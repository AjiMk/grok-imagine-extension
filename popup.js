const appShell = document.querySelector(".app-shell");
const loadingState = document.getElementById("loadingState");
const launchState = document.getElementById("launchState");
const launchButton = document.getElementById("launchGrokButton");
const navButtons = Array.from(document.querySelectorAll(".nav-item[data-target]"));
const screens = Array.from(document.querySelectorAll(".screen"));

function showScreen(target) {
  for (const screen of screens) {
    screen.classList.toggle("active", screen.dataset.screen === target);
  }

  for (const button of navButtons) {
    button.classList.toggle("active", button.dataset.target === target);
  }
}

function setViewState(state) {
  loadingState.classList.toggle("hidden", state !== "loading");
  launchState.classList.toggle("hidden", state !== "launch");
  appShell.classList.toggle("hidden", state !== "app");
}

function isGrokUrl(url = "") {
  return /(^|:\/\/)(www\.)?grok\.com(\/|$)/i.test(url);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function detectGrokTab() {
  try {
    const tab = await getActiveTab();
    if (tab?.url && isGrokUrl(tab.url)) {
      setViewState("app");
      showScreen("templates");
      return;
    }
  } catch (error) {
    console.error("Failed to inspect active tab:", error);
  }

  setViewState("launch");
}

for (const button of navButtons) {
  button.addEventListener("click", () => showScreen(button.dataset.target));
}

launchButton.addEventListener("click", async () => {
  await chrome.tabs.create({ url: "https://grok.com/" });
  window.close();
});

setViewState("loading");
void detectGrokTab();
