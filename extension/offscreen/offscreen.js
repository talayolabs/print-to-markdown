chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "offscreen-copy") return false;
  try {
    const area = document.getElementById("clip");
    area.value = message.text;
    area.select();
    const ok = document.execCommand("copy");
    sendResponse(ok ? { ok: true } : { ok: false, error: "execCommand('copy') returned false." });
  } catch (err) {
    sendResponse({ ok: false, error: String(err?.message || err) });
  }
  return false;
});
