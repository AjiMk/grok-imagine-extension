function findComposer() {
  const promptComposer = document.querySelector('.query-bar [contenteditable="true"].ProseMirror');
  if (promptComposer) {
    return promptComposer;
  }

  const selectors = [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
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

function getPromptSectionRoot() {
  const composer = findComposer();
  if (!composer) {
    return document;
  }

  return composer.closest('.relative.flex-1.min-w-0.max-w-3xl') ||
    composer.closest(".query-bar")?.parentElement ||
    document;
}

function findRadioGroup(label, root = document) {
  const groups = Array.from(root.querySelectorAll('[role="radiogroup"]'));
  const target = normalizeText(label);
  return groups.find((group) => normalizeText(group.getAttribute("aria-label") || "").includes(target));
}

async function setGenerationMode(mode, root = document) {
  const container = root.querySelector('div[role="radiogroup"][aria-label="Generation mode"]');

  if (!container) {
    return { ok: false, reason: 'Generation mode container not found' };
  }

  const buttons = Array.from(container.querySelectorAll('button[role="radio"]'));
  const targetButton = buttons.find(btn =>
    btn.textContent.trim().toLowerCase() === mode.toLowerCase()
  );

  if (!targetButton) {
    return { ok: false, reason: `Mode "${mode}" not found. Try "image" or "video".` };
  }

  if (targetButton.getAttribute("aria-checked") === "true") {
    return { ok: true };
  }

  targetButton.click();
  await delay(300);
  return { ok: true };
}

async function setResolution(resolution, root = document) {
  const resGroup = root.querySelector('[role="radiogroup"][aria-label="Video resolution"]');

  if (!resGroup) {
    return { ok: false, reason: 'Video resolution group not found' };
  }

  const options = Array.from(resGroup.querySelectorAll('button[role="radio"]'));
  const targetOption = options.find(opt => opt.innerText.trim() === resolution);

  if (!targetOption) {
    return { ok: false, reason: `Resolution "${resolution}" not found` };
  }

  if (targetOption.getAttribute("aria-checked") === "true") {
    return { ok: true };
  }

  targetOption.click();
  await delay(200);
  return { ok: true };
}

async function setDuration(duration, root = document) {
  const durationGroup = root.querySelector('[role="radiogroup"][aria-label="Video duration"]');

  if (!durationGroup) {
    return { ok: false, reason: 'Video duration group not found' };
  }

  const options = Array.from(durationGroup.querySelectorAll('button[role="radio"]'));
  const targetOption = options.find(opt => opt.innerText.trim() === duration);

  if (!targetOption) {
    return { ok: false, reason: `Duration "${duration}" not found` };
  }

  if (targetOption.getAttribute("aria-checked") === "true") {
    return { ok: true };
  }

  targetOption.click();
  await delay(200);
  return { ok: true };
}

async function setGenerationSpeed(value, root = document) {
  const normalizedValue = normalizeText(value);
  const group = findRadioGroup("Image generation speed", root);
  if (!group) {
    return { ok: false, reason: "Image generation speed control not found" };
  }

  const buttons = Array.from(group.querySelectorAll('[role="radio"], button'));
  const targetButton = buttons.find((btn) => normalizeText(btn.textContent || "").includes(normalizedValue));
  if (!targetButton) {
    return { ok: false, reason: `${value} option not found` };
  }

  if (targetButton.getAttribute("aria-checked") === "true") {
    return { ok: true };
  }

  targetButton.click();
  await delay(200);
  return { ok: true };
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

function findDropdownTrigger(labelCandidates, knownValues, root = document) {
  const labels = labelCandidates.map(normalizeText);
  const values = knownValues.map(normalizeText);
  const buttons = Array.from(root.querySelectorAll("button")).filter(isVisible);

  return buttons.find((button) => {
    const ariaLabel = normalizeText(button.getAttribute("aria-label") || "");
    const text = normalizeText(button.textContent || "");
    const hasKnownLabel = labels.some((label) => ariaLabel.includes(label));
    const hasKnownValue = values.some((value) => text === value || text.includes(value));
    return hasKnownLabel || (hasKnownValue && button.getAttribute("aria-haspopup"));
  });
}

function findOpenMenuOption(value, root = document) {
  const target = normalizeText(value);
  const selectors = [
    '[role="menuitem"]',
    '[role="menuitemradio"]',
    '[role="option"]',
    '[cmdk-item]',
    "button",
  ];
  const candidates = Array.from(root.querySelectorAll(selectors.join(",")));
  return candidates.find((element) => {
    if (!isVisible(element)) return false;
    const text = getElementText(element);
    return text.includes(target) || text === target;
  });
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
    results,
  };
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
  const direct = root.querySelector('button[type="submit"][aria-label="Submit"]')
  if (direct) {
    return direct;
  }

  // Search in scoped root first
  const scopedButtons = Array.from(root.querySelectorAll("button"));
  const scopedResult = scopedButtons.find((button) => {
    const label = `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
    return !button.disabled && (
      button.type === "submit" ||
      label.includes("generate") ||
      label.includes("submit") ||
      label.includes("send") ||
      label.includes("ask")
    );
  });

  if (scopedResult) {
    return scopedResult;
  }

  // Fall back to full document search for the Submit button
  const docButtons = Array.from(document.querySelectorAll("button[type=\"submit\"][aria-label=\"Submit\"]"));
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
    const submitForm = document.querySelector('button[type="submit"][aria-label="Submit"]')?.closest('form');
    if (submitForm) {
      await delay(1000);
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

  const uploadButton = Array.from(document.querySelectorAll('button[aria-label], button')).find((button) => {
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

  return { ok: true, count: transfer.files.length };
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

  applyGenerationOptions(generation.options || {})
    .then((optionsResult) => {
      return attachImages(generation.attachments || []).then((attachmentResult) => ({
        optionsResult,
        attachmentResult,
      }));
    })
    .then(({ optionsResult, attachmentResult }) => {
      const promptResult = insertPrompt(String(generation.promptText || generation.prompt || ""));
      if (promptResult.ok) {
        clickSubmit();
      }
      sendResponse({
        ok: promptResult.ok && optionsResult.ok,
        options: optionsResult,
        prompt: promptResult,
        attachments: attachmentResult,
      });
    })
    .catch((error) => {
      console.error("NOCTURNAL_SUBMIT_PROMPT error:", error);
      sendResponse({ ok: false, reason: String(error) });
    });

  return true;
});
