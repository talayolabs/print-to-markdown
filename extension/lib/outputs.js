const CLAUDE = { name: "Claude", newChatUrl: "https://claude.ai/new", prefillParam: "q" };

export async function saveAsFile(doc, settings) {
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(doc.markdown)}`;
  await chrome.downloads.download({
    url,
    filename: doc.filename,
    saveAs: settings.askWhereToSave,
    conflictAction: "uniquify"
  });
  return `Saved ${doc.filename}`;
}

export async function copyToClipboard(doc) {
  await writeClipboard(doc.markdown);
  return `${formatSize(doc.markdown)} of Markdown copied to the clipboard.`;
}

export async function sendToClaude(doc, settings) {
  const encoded = encodeURIComponent(doc.markdown);
  if (settings.claudeMode === "prefill" && encoded.length <= settings.prefillLimit) {
    await chrome.tabs.create({ url: `${CLAUDE.newChatUrl}?${CLAUDE.prefillParam}=${encoded}` });
    return null;
  }
  await writeClipboard(doc.markdown);
  await chrome.tabs.create({ url: CLAUDE.newChatUrl });
  return `The page is in your clipboard as Markdown (${formatSize(doc.markdown)}); paste it into ${CLAUDE.name}.`;
}

async function writeClipboard(text) {
  await ensureOffscreenDocument();
  const reply = await chrome.runtime.sendMessage({ type: "offscreen-copy", text });
  if (!reply?.ok) throw new Error(reply?.error || "Clipboard write failed.");
}

let creatingOffscreen;
async function ensureOffscreenDocument() {
  const url = chrome.runtime.getURL("offscreen/offscreen.html");
  const existing = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [url]
  });
  if (existing.length) return;
  creatingOffscreen ??= chrome.offscreen.createDocument({
    url,
    reasons: ["CLIPBOARD"],
    justification: "Write the page's Markdown to the clipboard."
  });
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

function formatSize(text) {
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}
