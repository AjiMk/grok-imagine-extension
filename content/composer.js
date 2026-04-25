import { isVisible } from './utils.js';

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

function getPromptSectionRoot() {
  const composer = findComposer();
  if (!composer) {
    return document;
  }

  return composer.closest('.relative.flex-1.min-w-0.max-w-3xl') ||
    composer.closest(".query-bar")?.parentElement ||
    document;
}

export { findComposer, getPromptSectionRoot };
