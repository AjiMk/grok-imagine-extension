(() => {
  // content/content.js
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function normalizeText(value = "") {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
  }
  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }
  function getElementText(element) {
    return normalizeText(`${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`);
  }
  function findComposer() {
    const promptComposer = document.querySelector('.query-bar [contenteditable="true"].ProseMirror');
    if (promptComposer) {
      return promptComposer;
    }
    const selectors = [
      "textarea",
      'input[type="text"]',
      '[contenteditable="true"]'
    ];
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      const candidate = elements.find((element) => {
        const ariaLabel = element.getAttribute("aria-label") || "";
        const placeholder = element.getAttribute("placeholder") || "";
        const text = `${ariaLabel} ${placeholder}`.toLowerCase();
        return text.includes("prompt") || text.includes("message") || text.includes("ask") || text.includes("describe") || element.isContentEditable || element.tagName === "TEXTAREA";
      });
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }
  function getPromptSectionRoot() {
    const composer = findComposer();
    if (!composer) {
      return document;
    }
    return composer.closest(".relative.flex-1.min-w-0.max-w-3xl") || composer.closest(".query-bar")?.parentElement || document;
  }
  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    const setter = descriptor?.set;
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  }
  function insertPrompt(prompt) {
    const composer = findComposer();
    if (!composer) {
      return { ok: false, reason: "Composer not found" };
    }
    composer.focus();
    if (composer.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(composer);
      selection.removeAllRanges();
      selection.addRange(range);
      const inserted = document.execCommand("insertText", false, prompt);
      if (!inserted) {
        composer.textContent = prompt;
      }
      composer.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: prompt, inputType: "insertText" }));
    } else {
      setNativeValue(composer, prompt);
    }
    return { ok: true };
  }
  function findSubmitButton() {
    const root = getPromptSectionRoot();
    const direct = root.querySelector('button[type="submit"][aria-label="Submit"]');
    if (direct) {
      return direct;
    }
    const scopedButtons = Array.from(root.querySelectorAll("button"));
    const scopedResult = scopedButtons.find((button) => {
      const label = `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
      return !button.disabled && (button.type === "submit" || label.includes("generate") || label.includes("submit") || label.includes("send") || label.includes("ask"));
    });
    if (scopedResult) {
      return scopedResult;
    }
    const docButtons = Array.from(document.querySelectorAll('button[type="submit"][aria-label="Submit"]'));
    return docButtons.find((button) => !button.disabled) || null;
  }
  async function clickSubmit() {
    let submitButton = findSubmitButton();
    const startedAt = Date.now();
    while (!submitButton && Date.now() - startedAt < 1500) {
      await delay(50);
      submitButton = findSubmitButton();
    }
    if (submitButton) {
      const submitForm = document.querySelector('button[type="submit"][aria-label="Submit"]')?.closest("form");
      if (submitForm) {
        await delay(1e3);
        submitForm.requestSubmit();
        return true;
      }
    }
    return false;
  }
  function dataUrlToFile(attachment) {
    const [header, base64] = String(attachment.dataUrl || "").split(",");
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = attachment.type || mimeMatch?.[1] || "application/octet-stream";
    const binary = atob(base64 || "");
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new File([bytes], attachment.name || "reference-image", { type: mimeType });
  }
  async function findFileInput() {
    let fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      return fileInput;
    }
    const uploadButton = Array.from(document.querySelectorAll("button[aria-label], button")).find((button) => {
      const label = getElementText(button);
      return isVisible(button) && (label.includes("upload") || label.includes("attach"));
    });
    if (uploadButton) {
      uploadButton.click();
      await delay(300);
      fileInput = document.querySelector('input[type="file"]');
    }
    return fileInput;
  }
  async function attachImages(attachments = []) {
    if (!attachments.length) {
      return { ok: true, count: 0 };
    }
    const fileInput = await findFileInput();
    if (!fileInput) {
      return { ok: false, count: 0, reason: "File input not found" };
    }
    const transfer = new DataTransfer();
    for (const attachment of attachments) {
      transfer.items.add(dataUrlToFile(attachment));
    }
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    fileInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    await delay(attachments.length > 2 ? 1500 : 800);
    return { ok: true, count: transfer.files.length };
  }
  async function clickRadiogroupOption(groupLabel, value, root = document, matchFn = (text, val) => text === val) {
    let group = root.querySelector(`[role="radiogroup"][aria-label="${groupLabel}"]`);
    let attempts = 0;
    while (!group && attempts < 10) {
      await delay(100);
      group = root.querySelector(`[role="radiogroup"][aria-label="${groupLabel}"]`);
      attempts++;
    }
    if (!group) return { ok: false, reason: `${groupLabel} group not found` };
    const options = Array.from(group.querySelectorAll('button[role="radio"]'));
    const target = options.find((opt) => matchFn(opt.innerText.trim(), value));
    if (!target) return { ok: false, reason: `${value} option not found` };
    if (target.getAttribute("aria-checked") === "true") return { ok: true };
    target.click();
    await delay(200);
    return { ok: true };
  }
  async function setGenerationMode(mode, root = document) {
    const result = await clickRadiogroupOption("Generation mode", mode.toLowerCase(), root, (text, val) => text.toLowerCase() === val.toLowerCase());
    if (result.ok && mode.toLowerCase() === "video") {
      await delay(1500);
    }
    return result;
  }
  async function setResolution(resolution, root = document) {
    return clickRadiogroupOption("Video resolution", resolution, root, (text, val) => text.toLowerCase().includes(val.toLowerCase()));
  }
  async function setDuration(duration, root = document) {
    return clickRadiogroupOption("Video duration", duration, root, (text, val) => text.toLowerCase().includes(val.toLowerCase()));
  }
  async function setGenerationSpeed(value, root = document) {
    const normalizedValue = normalizeText(value);
    return clickRadiogroupOption("Image generation speed", normalizedValue, root, (text, val) => text.toLowerCase().includes(val));
  }
  function findDropdownTrigger(labelCandidates, knownValues, root = document) {
    const labels = labelCandidates.map(normalizeText);
    const values = knownValues.map(normalizeText);
    const buttons = Array.from(root.querySelectorAll("button")).filter(isVisible);
    return buttons.find((button) => {
      const ariaLabel = normalizeText(button.getAttribute("aria-label") || "");
      const text = normalizeText(button.textContent || "");
      const hasKnownLabel = labels.some((label) => ariaLabel.includes(label));
      const hasKnownValue = values.some((value) => text === value || text.includes(value));
      return hasKnownLabel || hasKnownValue && button.getAttribute("aria-haspopup");
    });
  }
  function findOpenMenuOption(value, root = document) {
    const target = normalizeText(value);
    const selectors = [
      '[role="menuitem"]',
      '[role="menuitemradio"]',
      '[role="option"]',
      "[cmdk-item]",
      "button"
    ];
    const candidates = Array.from(root.querySelectorAll(selectors.join(",")));
    return candidates.find((element) => {
      if (!isVisible(element)) return false;
      const text = getElementText(element);
      return text.includes(target) || text === target;
    });
  }
  async function setAspectRatio(targetRatio, root = document) {
    const trigger = findDropdownTrigger(["Aspect Ratio"], ["2:3", "3:2", "1:1", "9:16", "16:9"], root);
    if (!trigger) {
      return { ok: false, reason: "Aspect Ratio control not found" };
    }
    if (normalizeText(trigger.textContent || "").includes(normalizeText(targetRatio))) {
      return { ok: true };
    }
    trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    trigger.click();
    await delay(500);
    const option = findOpenMenuOption(targetRatio, document);
    if (!option) {
      return { ok: false, reason: `${targetRatio} option not found` };
    }
    await delay(200);
    option.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    option.click();
    await delay(150);
    return { ok: true };
  }
  async function applyGenerationOptions(options = {}, root = document) {
    const results = [];
    results.push(await setGenerationMode(options.type === "video" ? "video" : "image", root));
    if (options.type === "video") {
      results.push(await setAspectRatio(options.aspectRatio, root));
      results.push(await setDuration(options.duration, root));
      results.push(await setResolution(options.resolution, root));
    } else {
      results.push(await setGenerationSpeed(options.speed || "Speed", root));
      results.push(await setAspectRatio(options.aspectRatio, root));
    }
    return {
      ok: results.every((result) => result.ok),
      results
    };
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "NOCTURNAL_PING") {
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type !== "NOCTURNAL_SUBMIT_PROMPT") {
      return false;
    }
    const generation = message.generation || { promptText: message.prompt, attachments: [], options: {} };
    (async () => {
      try {
        const optionsResult = await applyGenerationOptions(generation.options || {});
        const attachmentResult = await attachImages(generation.attachments || []);
        const promptResult = insertPrompt(String(generation.promptText || generation.prompt || ""));
        if (promptResult.ok) {
          clickSubmit();
        }
        sendResponse({
          ok: promptResult.ok && optionsResult.ok,
          options: optionsResult,
          prompt: promptResult,
          attachments: attachmentResult
        });
      } catch (error) {
        console.error("NOCTURNAL_SUBMIT_PROMPT error:", error);
        sendResponse({ ok: false, reason: String(error) });
      }
    })();
    return true;
  });
})();
