const LIBS = [
  "vendor/Readability.js",
  "vendor/turndown.js",
  "vendor/turndown-plugin-gfm.js",
  "content/convert.js"
];

export async function extractMarkdown(tab, settings) {
  const target = { tabId: tab.id };
  await chrome.scripting.executeScript({ target, files: LIBS });
  const [{ result }] = await chrome.scripting.executeScript({
    target,
    func: (opts) => globalThis.__printToMarkdown.convert(opts),
    args: [{ mode: settings.mode }]
  });
  if (!result) throw new Error("The page produced no content.");
  if (result.error) throw new Error(result.error);
  return finishDocument(result, settings);
}

function finishDocument(page, settings) {
  const title = (page.title || "Untitled").trim();
  const parts = [];
  if (settings.frontMatter) {
    parts.push(frontMatter({
      title,
      source: page.url,
      author: page.byline,
      site: page.siteName,
      saved: new Date().toISOString()
    }));
  }
  if (!page.selection && !/^#\s/.test(page.markdown)) parts.push(`# ${title}\n`);
  parts.push(page.markdown.trim(), "");
  return {
    title,
    url: page.url,
    filename: `${slugify(title) || "page"}.md`,
    markdown: parts.join("\n")
  };
}

function frontMatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${yamlString(String(v))}`);
  return `---\n${lines.join("\n")}\n---\n`;
}

function yamlString(value) {
  return /[:#\-\[\]{}&*!|>'"%@`,?]|^\s|\s$/.test(value) ? JSON.stringify(value) : value;
}

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
