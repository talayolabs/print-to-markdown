import { ACTIONS, runAction } from "./lib/actions.js";

const PRINTERS = Object.entries(ACTIONS).map(([id, { label }]) => ({
  id,
  name: label,
  description: "Print to Markdown"
}));

const CAPABILITIES = {
  version: "1.0",
  printer: {
    supported_content_type: [{ content_type: "application/pdf" }],
    color: { option: [{ type: "STANDARD_COLOR", is_default: true }] },
    duplex: { option: [{ type: "NO_DUPLEX", is_default: true }] },
    page_orientation: { option: [{ type: "PORTRAIT", is_default: true }] },
    copies: { default: 1, max: 1 },
    media_size: {
      option: [{ name: "ISO_A4", width_microns: 210000, height_microns: 297000, is_default: true }]
    },
    dpi: { option: [{ horizontal_dpi: 96, vertical_dpi: 96, is_default: true }] }
  }
};

// Print dialog destinations. Chrome hands us a PDF of the page; we ignore it and
// convert the live DOM of the tab that opened the dialog instead.
chrome.printerProvider.onGetPrintersRequested.addListener((cb) => cb(PRINTERS));
chrome.printerProvider.onGetCapabilityRequested.addListener((_id, cb) => cb(CAPABILITIES));
chrome.printerProvider.onPrintRequested.addListener((job, cb) => {
  runOnActiveTab(job.printerId).then((r) => cb(r.ok ? "OK" : "FAILED"));
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "print-to-markdown", title: "Print to Markdown", contexts: ["page", "selection"] });
  for (const [id, { label }] of Object.entries(ACTIONS)) {
    chrome.contextMenus.create({ id, parentId: "print-to-markdown", title: label, contexts: ["page", "selection"] });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (ACTIONS[info.menuItemId] && tab) runAction(info.menuItemId, tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (ACTIONS[command]) (tab ? runAction(command, tab) : runOnActiveTab(command));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "run" || !ACTIONS[message.action]) return false;
  runOnActiveTab(message.action).then(sendResponse);
  return true;
});

async function runOnActiveTab(actionId) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) return { ok: false, error: "No active tab." };
  return runAction(actionId, tab);
}

// Debug hook for the service worker console: printToMarkdown.runOnActiveTab("md-copy").
globalThis.printToMarkdown = { runAction, runOnActiveTab };
