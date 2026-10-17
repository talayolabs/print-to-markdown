import { getSettings, saveSettings } from "../lib/settings.js";

const status = document.getElementById("status");
const fields = [...document.querySelectorAll("[name]")];

const settings = await getSettings();
for (const field of fields) {
  if (field.type === "checkbox") field.checked = settings[field.name];
  else field.value = settings[field.name];
}

for (const field of fields) {
  field.addEventListener("change", async () => {
    const value = field.type === "checkbox" ? field.checked : field.type === "number" ? Number(field.value) : field.value;
    await saveSettings({ [field.name]: value });
    status.textContent = "Saved.";
    setTimeout(() => (status.textContent = ""), 1500);
  });
}
