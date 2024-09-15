chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showNotification") {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: request.title,
        message: request.message
      });
    }
  });

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['chrono.min.js', 'content.js']
  });
});