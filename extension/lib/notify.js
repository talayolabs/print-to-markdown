export function notify(title, message) {
  return new Promise((resolve) => {
    chrome.notifications.create(
      { type: "basic", iconUrl: chrome.runtime.getURL("icons/icon128.png"), title, message },
      () => resolve()
    );
  });
}
