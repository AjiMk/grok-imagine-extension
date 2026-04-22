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

async function clickRadioOption(groupLabel, optionLabel, root = document) {
  const group = findRadioGroup(groupLabel, root);
  if (!group) {
    return { ok: false, reason: `${groupLabel} control not found` };
  }

  const target = normalizeText(optionLabel);
  const options = Array.from(group.querySelectorAll('[role="radio"], button'));
  const option = options.find((element) => getElementText(element).includes(target));
  if (!option) {
    return { ok: false, reason: `${optionLabel} option not found` };
  }

  if (option.getAttribute("aria-checked") !== "true") {
    option.click();
    await delay(200);
  }

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

function findOpenMenuOption(value) {
  const target = normalizeText(value);
  const selectors = [
    '[role="menuitem"]',
    '[role="menuitemradio"]',
    '[role="option"]',
    '[cmdk-item]',
    "button",
  ];
  const candidates = Array.from(document.querySelectorAll(selectors.join(","))).filter(isVisible);
  return candidates.find((element) => getElementText(element).includes(target));
}

async function selectDropdownValue(labelCandidates, value, knownValues) {
  const normalizedValue = normalizeText(value);
  const root = getPromptSectionRoot();
  const trigger = findDropdownTrigger(labelCandidates, knownValues, root);

  if (!trigger) {
    return { ok: false, reason: `${labelCandidates[0]} control not found` };
  }

  if (normalizeText(trigger.textContent || "").includes(normalizedValue)) {
    return { ok: true };
  }

  trigger.click();
  await delay(200);

  const option = findOpenMenuOption(value);
  if (!option) {
    return { ok: false, reason: `${value} option not found` };
  }

  option.click();
  await delay(150);
  return { ok: true };
}

async function applyGenerationOptions(options = {}) {
  const results = [];
  const mode = options.type === "video" ? "Video" : "Image";
  const root = getPromptSectionRoot();

  results.push(await clickRadioOption("Generation mode", mode, root));
  await delay(250);

  if (options.type === "video") {
    results.push(await selectDropdownValue(["Aspect Ratio"], options.aspectRatio, ["2:3", "3:2", "1:1", "9:16", "16:9"]));
    results.push(await selectDropdownValue(["Duration"], options.duration, ["6s", "10s"]));
    results.push(await selectDropdownValue(["Resolution", "Quality"], options.resolution, ["480p", "720p"]));
  } else {
    results.push(await clickRadioOption("Image generation speed", options.speed || "Speed", root));
    results.push(await selectDropdownValue(["Aspect Ratio"], options.aspectRatio, ["2:3", "3:2", "1:1", "9:16", "16:9"]));
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
  const direct = root.querySelector('button[type="submit"][aria-label="Submit"]:not([disabled])');
  if (direct) {
    return direct;
  }

  const buttons = Array.from(root.querySelectorAll("button"));
  return buttons.find((button) => {
    const label = `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
    return !button.disabled && (
      button.type === "submit" ||
      label.includes("generate") ||
      label.includes("submit") ||
      label.includes("send") ||
      label.includes("ask")
    );
  });
}

async function clickSubmit() {
  let submitButton = findSubmitButton();
  const startedAt = Date.now();

  while (!submitButton && Date.now() - startedAt < 1500) {
    await delay(50);
    submitButton = findSubmitButton();
  }

  if (submitButton) {
    submitButton.click();
    return true;
  }

  const form = findComposer()?.closest("form");
  if (form) {
    form.requestSubmit?.();
    return true;
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
    .then((optionsResult) => attachImages(generation.attachments || []))
    .then((attachmentResult) => {
      const promptResult = insertPrompt(String(generation.promptText || generation.prompt || ""));
      if (promptResult.ok) {
        clickSubmit();
      }
      return { optionsResult, attachmentResult, promptResult };
    })
    .then(({ optionsResult, attachmentResult, promptResult }) => {
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
