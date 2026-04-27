import { delay, getElementText, isEditMode } from './utils.js';
import { findComposer, getPromptSectionRoot } from './composer.js';

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

  let direct;
  if (isEditMode()) {
    direct = root.querySelector('button[aria-label="Edit"], button[aria-label="Make video"]');
  } else {
    direct = root.querySelector('button[type="submit"][aria-label="Submit"]');
  }

  if (direct) {
    return direct;
  }

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
    if(isEditMode()) {
      submitButton.click();
    }else {
      const submitForm = document.querySelector('button[type="submit"][aria-label="Submit"]')?.closest('form');
      if (submitForm) {
        await delay(1000);
        submitForm.requestSubmit();
        return true;
      } 
    }
  }

  return false;
}

export { insertPrompt, findSubmitButton, clickSubmit };
