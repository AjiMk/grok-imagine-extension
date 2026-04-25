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

export { delay, normalizeText, isVisible, getElementText };
