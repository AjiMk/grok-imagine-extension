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

function isEditMode() {
  const url = window.location.href;
  return /^https:\/\/grok\.com\/imagine\/post\/[^/]+$/.test(url);
}

function isGenerationMode() {
  const url = window.location.href;
  return /^https:\/\/grok\.com\/imagine(?!\/post)/.test(url);
}

function hasVideoContent(element) {
  if (!element) return false;
  return !!element.querySelector('video');
}

function isVideoEditMode() {
  if (!isEditMode()) return false;
  const element = document.querySelector('main > article > div > div:nth-of-type(2) > div > div:nth-of-type(1)');
  return hasVideoContent(element);
}

export { delay, normalizeText, isVisible, getElementText, isEditMode, isGenerationMode, hasVideoContent, isVideoEditMode };
