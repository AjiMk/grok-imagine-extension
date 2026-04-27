import { delay, isVisible, getElementText } from './utils.js';

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

  await delay(attachments.length > 2 ? 1500 : 800);

  return { ok: true, count: transfer.files.length };
}

export { dataUrlToFile, findFileInput, attachImages };
