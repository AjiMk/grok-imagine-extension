let targetTabId = null;

chrome.action.onClicked.addListener(async (tab) => {
  try {
    targetTabId = tab.id;
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TARGET_TAB') {
    sendResponse({ tabId: targetTabId });
    return true;
  }
});
