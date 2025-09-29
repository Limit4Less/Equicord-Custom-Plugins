import "./style.css";

const BLOCKED_IDS = ["17256204456248240326", "27377866"];

function hideGIF(root: HTMLElement) {
    // Covers both images and Tenor embeds
    root.querySelectorAll("img, iframe, video, source").forEach(el => {
        const src = (el as any).src || (el as HTMLSourceElement).srcset;
        if (src && BLOCKED_IDS.some(id => src.includes(id))) {
            el.remove();
        }
    });

    // Replace links in message embeds with a black box
    root.querySelectorAll("a[href]").forEach(link => {
        if (BLOCKED_IDS.some(id => link.href.includes(id))) {
            const blackBox = document.createElement("span");
            blackBox.classList.add("blocked-gif-box");
            blackBox.title = "Blocked GIF";
            link.replaceWith(blackBox);
        }
    });
}

function scanAndObserve() {
    const root = document.querySelector("[class^='scrollerInner_']");
    if (!root) return;

    // Scan all messages, even previously marked ones, to handle re-renders
    root.querySelectorAll("[class^='message_']").forEach(msg => {
        if (!(msg as HTMLElement).hasAttribute("data-gif-blocked")) {
            msg.setAttribute("data-gif-blocked", "true");
            hideGIF(msg as HTMLElement);
        }
    });

    // Observe for new messages or changes in the scroller
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                    // Re-scan the entire message list to catch re-renders
                    node.querySelectorAll("[class^='message_']").forEach(msg => {
                        if (!(msg as HTMLElement).hasAttribute("data-gif-blocked")) {
                            msg.setAttribute("data-gif-blocked", "true");
                            hideGIF(msg as HTMLElement);
                        }
                    });
                }
            });
        });
    });

    observer.observe(root, { childList: true, subtree: true });
}

export default {
    name: "BlockKitaGIF",
    description: "Hides specific Kita Tenor GIFs with a black box",
    start() {
        const waitForChat = () => {
            const root = document.querySelector("[class^='scrollerInner_']");
            if (root) {
                scanAndObserve();
                // Observe for changes in the chat container to handle DM/channel switches
                const container = document.querySelector("[class^='chat_']");
                if (container) {
                    const containerObserver = new MutationObserver(() => {
                        scanAndObserve(); // Re-scan when chat container changes
                    });
                    containerObserver.observe(container, { childList: true, subtree: true });
                }
            } else {
                requestAnimationFrame(waitForChat);
            }
        };
        waitForChat();
    },
    stop() {
        // Clean up observers if needed (optional, for Vencord compatibility)
    }
};
