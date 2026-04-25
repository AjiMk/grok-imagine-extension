import { delay, normalizeText, isVisible, getElementText } from './utils.js';

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
  const target = options.find(opt => matchFn(opt.innerText.trim(), value));
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
    results,
  };
}

export {
  clickRadiogroupOption,
  setGenerationMode,
  setResolution,
  setDuration,
  setGenerationSpeed,
  setAspectRatio,
  applyGenerationOptions
};
