// On touch devices (e.g. Firefox for Android, where the toolbar popup opens as
// a separate full-screen view), inject a floating bubble onto nomi.ai that opens
// the extension UI as an in-page bottom sheet — so the user never leaves the
// Nomi page. The sheet hosts the same popup, framed as a web-accessible page.

const HOST_ID = "nomi-downloader-host";

function injectBubble(): void {
    if (document.getElementById(HOST_ID)) return;

    const host = document.createElement("div");
    host.id = HOST_ID;
    const root = host.attachShadow({ mode: "open" });

    const popupUrl = chrome.runtime.getURL("index.html");

    root.innerHTML = `
        <style>
            :host { all: initial; }
            .bubble {
                position: fixed;
                right: 16px;
                bottom: calc(16px + env(safe-area-inset-bottom, 0px));
                width: 56px;
                height: 56px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                z-index: 2147483646;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                background: linear-gradient(135deg, #a855f7, #7c3aed);
                box-shadow: 0 8px 24px rgba(124, 58, 237, 0.45);
                transition: transform 0.15s ease;
            }
            .bubble:active { transform: scale(0.92); }
            .bubble svg { width: 26px; height: 26px; }

            .overlay {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
            }
            .overlay[hidden] { display: none; }
            .backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.55);
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            .overlay.open .backdrop { opacity: 1; }
            .sheet {
                position: relative;
                width: 100%;
                height: 90dvh;
                background: #0d0e12;
                border-radius: 18px 18px 0 0;
                box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                transform: translateY(100%);
                transition: transform 0.25s ease;
                display: flex;
                flex-direction: column;
            }
            .overlay.open .sheet { transform: translateY(0); }
            .grabber {
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 26px;
                cursor: pointer;
            }
            .grabber::before {
                content: "";
                width: 40px;
                height: 4px;
                border-radius: 2px;
                background: rgba(255, 255, 255, 0.25);
            }
            iframe {
                flex: 1 1 auto;
                width: 100%;
                border: 0;
                background: #0d0e12;
            }
        </style>
        <button class="bubble" type="button" aria-label="Open Nomi Downloader">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round"/>
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round"/>
            </svg>
        </button>
        <div class="overlay" hidden>
            <div class="backdrop"></div>
            <div class="sheet">
                <div class="grabber" title="Close"></div>
            </div>
        </div>
    `;

    document.documentElement.appendChild(host);

    const bubble = root.querySelector<HTMLButtonElement>(".bubble");
    const overlay = root.querySelector<HTMLDivElement>(".overlay");
    const backdrop = root.querySelector<HTMLDivElement>(".backdrop");
    const grabber = root.querySelector<HTMLDivElement>(".grabber");
    const sheet = root.querySelector<HTMLDivElement>(".sheet");
    if (!bubble || !overlay || !backdrop || !grabber || !sheet) return;

    // Lazily create the iframe on first open so the popup app only boots when
    // actually used.
    let iframe: HTMLIFrameElement | null = null;
    const open = () => {
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.src = popupUrl;
            sheet.appendChild(iframe);
        }
        overlay.hidden = false;
        // Next frame so the open transition runs from the hidden state.
        requestAnimationFrame(() => overlay.classList.add("open"));
    };
    const close = () => {
        overlay.classList.remove("open");
        setTimeout(() => {
            overlay.hidden = true;
        }, 250);
    };

    bubble.addEventListener("click", open);
    backdrop.addEventListener("click", close);
    grabber.addEventListener("click", close);
}

// The in-page UI is meant for touch devices (Firefox Android, where the toolbar
// popup opens as a separate view). Temporarily enabled on every platform so it
// can be debugged on desktop with DevTools — re-add the touch gate afterward.
if (document.body) {
    injectBubble();
} else {
    document.addEventListener("DOMContentLoaded", injectBubble, { once: true });
}
