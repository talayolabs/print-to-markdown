export const DEFAULTS = {
  // "auto": article (Readability) when it finds one, otherwise the whole page.
  mode: "auto",
  frontMatter: true,
  askWhereToSave: false,
  // "prefill": open claude.ai/new?q=<markdown>; falls back to the clipboard when too long.
  claudeMode: "prefill",
  prefillLimit: 20000
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

export function saveSettings(patch) {
  return chrome.storage.sync.set(patch);
}
