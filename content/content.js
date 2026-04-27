import { delay, normalizeText, isVisible, getElementText } from './utils.js';
import { findComposer, getPromptSectionRoot } from './composer.js';
import { insertPrompt, findSubmitButton, clickSubmit } from './submission.js';
import { attachImages } from './attachments.js';
import {
  setGenerationMode,
  setResolution,
  setDuration,
  setGenerationSpeed,
  setAspectRatio,
  applyGenerationOptions
} from './options.js';

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
        attachments: attachmentResult,
      });
    } catch (error) {
      console.error("NOCTURNAL_SUBMIT_PROMPT error:", error);
      sendResponse({ ok: false, reason: String(error) });
    }
  })();

  return true;
});