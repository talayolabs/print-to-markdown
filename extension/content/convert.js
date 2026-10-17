// Injected into the page after vendor/Readability.js, turndown.js and turndown-plugin-gfm.js.
// Exposes globalThis.__printToMarkdown.convert({ mode }) -> { title, url, markdown, ... }.
(() => {
  if (globalThis.__printToMarkdown) return;

  const DROP = "script, style, noscript, template, iframe, canvas, svg, [aria-hidden='true'], [hidden]";
  // Chrome/UI chrome that is never content: Wikipedia "[edit]" links and the like.
  const PRE_CLEAN = ".mw-editsection, .mw-jump-link";
  const MIN_ARTICLE_CHARS = 500;

  function convert(opts = {}) {
    try {
      const mode = opts.mode || "auto";
      const selection = selectedHtml();
      const source = selection ? { html: selection } : pickSource(mode);
      return {
        title: source.title || document.title,
        url: location.href,
        byline: source.byline || metaContent("author"),
        siteName: source.siteName || metaContent("og:site_name"),
        excerpt: source.excerpt || metaContent("description"),
        selection: Boolean(selection),
        markdown: toMarkdown(source.html)
      };
    } catch (err) {
      return { error: String(err?.message || err) };
    }
  }

  function selectedHtml() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const box = document.createElement("div");
    for (let i = 0; i < sel.rangeCount; i++) box.appendChild(sel.getRangeAt(i).cloneContents());
    return box.textContent.trim() ? box.innerHTML : null;
  }

  function pickSource(mode) {
    if (mode !== "full") {
      const article = readArticle();
      if (article && (mode === "article" || article.length >= MIN_ARTICLE_CHARS)) {
        return {
          html: article.content,
          title: article.title,
          byline: article.byline,
          siteName: article.siteName,
          excerpt: article.excerpt
        };
      }
    }
    return { html: fullPageHtml() };
  }

  function readArticle() {
    try {
      const clone = document.cloneNode(true);
      clone.querySelectorAll(PRE_CLEAN).forEach((el) => el.remove());
      unwrapHeadingWrappers(clone);
      return new Readability(clone, { keepClasses: false }).parse();
    } catch {
      return null;
    }
  }

  // Readability drops short <div>s, taking any heading wrapped in one (e.g. Wikipedia's
  // <div class="mw-heading"><h2>) with it. Replace such wrappers with the heading itself.
  function unwrapHeadingWrappers(root) {
    root.querySelectorAll("div, section > header").forEach((wrapper) => {
      const kids = [...wrapper.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      if (kids.length === 1 && /^H[1-6]$/.test(kids[0].nodeName)) wrapper.replaceWith(kids[0]);
    });
  }

  function fullPageHtml() {
    const body = document.body.cloneNode(true);
    body.querySelectorAll(`${DROP}, ${PRE_CLEAN}`).forEach((el) => el.remove());
    absolutizeUrls(body);
    return body.innerHTML;
  }

  function absolutizeUrls(root) {
    root.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", resolve(a.getAttribute("href"))));
    root.querySelectorAll("img[src]").forEach((img) => img.setAttribute("src", resolve(img.getAttribute("src"))));
  }

  function resolve(url) {
    try {
      return new URL(url, location.href).href;
    } catch {
      return url;
    }
  }

  function toMarkdown(html) {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "_",
      hr: "---"
    });
    service.use(turndownPluginGfm.gfm);
    service.remove(["script", "style", "noscript", "template"]);
    service.addRule("stripDataImages", {
      filter: (node) => node.nodeName === "IMG" && /^data:/.test(node.getAttribute("src") || ""),
      replacement: (_c, node) => (node.getAttribute("alt") ? `*${node.getAttribute("alt")}*` : "")
    });
    const scratch = document.createElement("div");
    scratch.innerHTML = html;
    absolutizeUrls(scratch);
    return service.turndown(scratch).replace(/\n{3,}/g, "\n\n").trim();
  }

  function metaContent(name) {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el?.getAttribute("content") || "";
  }

  globalThis.__printToMarkdown = { convert };
})();
