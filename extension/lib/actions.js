import { getSettings } from "./settings.js";
import { extractMarkdown } from "./extract.js";
import { saveAsFile, copyToClipboard, sendToClaude } from "./outputs.js";
import { notify } from "./notify.js";

export const ACTIONS = {
  "md-save": { label: "Save as Markdown", run: saveAsFile },
  "md-copy": { label: "Copy as Markdown", run: copyToClipboard },
  "md-claude": { label: "Send to Claude", run: sendToClaude }
};

export async function runAction(actionId, tab) {
  const action = ACTIONS[actionId];
  if (!action) throw new Error(`Unknown action ${actionId}`);
  const settings = await getSettings();
  try {
    const doc = await extractMarkdown(tab, settings);
    const outcome = await action.run(doc, settings);
    if (outcome) await notify(action.label, outcome);
    return { ok: true, outcome };
  } catch (err) {
    const message = describeError(err, tab);
    await notify(`${action.label} failed`, message);
    return { ok: false, error: message };
  }
}

function describeError(err, tab) {
  const text = String(err?.message || err);
  if (/Cannot access|chrome:\/\/|chrome-extension:\/\/|Extension manifest|cannot be scripted/i.test(text)) {
    return `Chrome does not let extensions read ${tab?.url || "this page"}.`;
  }
  return text;
}
