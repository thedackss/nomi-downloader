chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "CHANGE_COLOR") {
        const color = message.color ?? "blue";
        document.documentElement.style.setProperty(
            "background-color",
            color,
            "important",
        );
        document.body.style.setProperty("background-color", color, "important");
        sendResponse({ status: "success" }); // Send info back to popup
    }
});
