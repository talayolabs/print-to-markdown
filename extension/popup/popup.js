const status = document.getElementById("status");

document.querySelectorAll("button[data-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    setBusy(true);
    status.textContent = "Converting…";
    const result = await chrome.runtime.sendMessage({ type: "run", action: button.dataset.action });
    status.textContent = result?.ok ? result.outcome || "Done." : result?.error || "Failed.";
    status.classList.toggle("error", !result?.ok);
    setBusy(false);
  });
});

document.getElementById("options").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

function setBusy(busy) {
  document.querySelectorAll("button").forEach((b) => (b.disabled = busy));
}
