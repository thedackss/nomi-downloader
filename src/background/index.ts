console.log("Hello from the Background Service Worker!");

// Example: Listen for when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed successfully.");
});
