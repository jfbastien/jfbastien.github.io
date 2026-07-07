import { existsSync } from "fs";
import { join } from "path";
import { launchChrome, openPage } from "./chrome.ts";

const root = join(import.meta.dir, "..");
const html = existsSync(join(root, "_site", "index.html"))
  ? join(root, "_site", "index.html")
  : join(root, "index.html");

const viewports = [
  { width: 360, height: 900 },
  { width: 390, height: 900 },
  { width: 768, height: 1000 },
  { width: 1024, height: 1000 },
  { width: 1280, height: 1000 },
] as const;

interface Finding {
  readonly viewport: number;
  readonly selector: string;
  readonly text: string;
  readonly reason: string;
}

const browser = await launchChrome();
const findings: Finding[] = [];

try {
  for (const viewport of viewports) {
    const page = await openPage(browser, html);
    await page.setViewport(viewport);
    await page.reload({ waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");

    const next = await page.evaluate((width) => {
      interface Finding {
        readonly viewport: number;
        readonly selector: string;
        readonly text: string;
        readonly reason: string;
      }

      function text(el: Element): string {
        return (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 96);
      }

      function lineCount(el: Element): number {
        if (getComputedStyle(el).display === "inline") {
          return el.getClientRects().length;
        }
        const rect = el.getBoundingClientRect();
        const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
        return lineHeight > 0 ? rect.height / lineHeight : 1;
      }

      function visible(el: Element): boolean {
        for (let node: Element | null = el; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden") return false;
        }
        return true;
      }

      function collect(selector: string, reason: string, predicate: (el: Element) => boolean): Finding[] {
        return [...document.querySelectorAll(selector)]
          .filter(visible)
          .filter(predicate)
          .map((el) => ({ viewport: width, selector, text: text(el), reason }));
      }

      function selectorName(el: Element): string {
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className && typeof el.className === "string"
          ? `.${el.className.trim().replace(/\s+/g, ".")}`
          : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      }

      function contentBounds(panel: Element): { readonly left: number; readonly right: number; readonly width: number } {
        const rect = panel.getBoundingClientRect();
        const style = getComputedStyle(panel);
        const left = rect.left + Number.parseFloat(style.paddingLeft);
        const right = rect.right - Number.parseFloat(style.paddingRight);
        return { left, right, width: right - left };
      }

      function unitProbe(): { readonly ch: number; readonly lh: number } {
        const probe = document.createElement("span");
        probe.textContent = "0";
        probe.style.position = "absolute";
        probe.style.inset = "0 auto auto 0";
        probe.style.visibility = "hidden";
        probe.style.font = getComputedStyle(document.body).font;
        document.body.append(probe);
        const ch = probe.getBoundingClientRect().width;
        probe.remove();
        return { ch, lh: Number.parseFloat(getComputedStyle(document.body).lineHeight) };
      }

      // Linux and macOS Chromium disagree by ~0.15ch on integer CSS ch boxes
      // after font rasterization; keep the audit on character-grid failures,
      // not cross-platform subpixel rounding.
      function offGrid(value: number, unit: number, tolerance = 0.2): number {
        const position = value / unit;
        return Math.abs(position - Math.round(position)) <= tolerance ? 0 : position;
      }

      function rulerFinding(
        selector: string,
        reason: string,
        el: Element,
        position: number,
        unitName: "ch" | "lh",
      ): Finding {
        return {
          viewport: width,
          selector,
          text: text(el),
          reason: `${reason}: ${position.toFixed(2)}${unitName} is off grid`,
        };
      }

      const out: Finding[] = [];
      const root = document.documentElement;
      const body = document.body;
      const rootOverflow = root.scrollWidth > root.clientWidth + 1;
      const bodyOverflow = body.scrollWidth > body.clientWidth + 1;
      if (rootOverflow || bodyOverflow) {
        const offenders = [...document.querySelectorAll("*")]
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const node = el as HTMLElement;
            return {
              el,
              rect,
              node,
              overflows: rect.left < -1 || rect.right > window.innerWidth + 1 || node.scrollWidth > node.clientWidth + 1,
            };
          })
          .filter((entry) => entry.overflows)
          .sort((a, b) => {
            const aOverflow = Math.max(a.rect.right - window.innerWidth, (a.node.scrollWidth - a.node.clientWidth), -a.rect.left);
            const bOverflow = Math.max(b.rect.right - window.innerWidth, (b.node.scrollWidth - b.node.clientWidth), -b.rect.left);
            return bOverflow - aOverflow;
          })
          .slice(0, 8)
          .map((entry) => `${selectorName(entry.el)} ${Math.round(entry.rect.left)}..${Math.round(entry.rect.right)}`)
          .join(", ");
        out.push({
          viewport: width,
          selector: "document",
          text: "",
          reason: `horizontal overflow root ${root.scrollWidth}px > ${root.clientWidth}px, body ${body.scrollWidth}px > ${body.clientWidth}px${offenders ? ` via ${offenders}` : ""}`,
        });
      }

      out.push(...collect(".record__role, .record__degree, .record__field, .record__term", "metadata wrapped", (el) => lineCount(el) > 1.15));
      out.push(...collect(".record-index li > :first-child", "index label wrapped", (el) => lineCount(el) > 1.15));
      out.push(...collect(".artifact-group__title", "artifact group title wrapped", (el) => lineCount(el) > 1.15));
      const bodyFontSize = getComputedStyle(document.body).fontSize;
      out.push(...collect(
        ".wordmark, .panel__title, .record__title, .artifact-group__title",
        "title escaped single-size grid",
        (el) => getComputedStyle(el).fontSize !== bodyFontSize,
      ));
      out.push(...collect(".dispatch-list a", "dispatch value wrapped", (el) => lineCount(el) > 1.15));
      out.push(...collect(".masthead dt, .masthead dd", "masthead field overflowed", (el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1));
      const mastheadFields = [...document.querySelectorAll(".masthead dt, .masthead dd")].filter(visible);
      for (let i = 0; i < mastheadFields.length; i += 1) {
        const a = mastheadFields[i];
        const ar = a.getBoundingClientRect();
        for (const b of mastheadFields.slice(i + 1)) {
          const br = b.getBoundingClientRect();
          const xOverlap = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
          const yOverlap = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
          const minHeight = Math.min(ar.height, br.height);
          if (xOverlap > 1 && yOverlap > minHeight * 0.5) {
            out.push({
              viewport: width,
              selector: ".masthead dt, .masthead dd",
              text: `${text(a)} / ${text(b)}`,
              reason: `masthead fields overlap by ${xOverlap.toFixed(1)}px`,
            });
          }
        }
      }
      out.push(...collect(".doc-code", "docket code overflowed", (el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1));
      out.push(...collect(".artifact-year", "artifact year overflowed", (el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1));
      out.push(...collect(".artifact-title, .artifact-note, .doc-title, .series-title, .patent-title, .patent-family", "catalogue text overflowed", (el) => (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 1));
      out.push(...collect(".record--compact, .record--docket, .record--series, .record--patent", "compact record has glyph separator", (el) => getComputedStyle(el, "::before").content.includes("─")));

      out.push(...collect(".artifact-venue", "artifact venue leader fill missing", (el) => getComputedStyle(el, "::after").content === "none"));
      out.push(...collect(".artifact-ledger > li", "artifact row has second leader source", (el) => getComputedStyle(el, "::before").content !== "none"));

      if (width >= 768) {
        out.push(...collect(".record--service .record__title", "service title wrapped on wide viewport", (el) => lineCount(el) > 1.15));
      }

      const page = document.querySelector(".page");
      if (page) {
        const { ch, lh } = unitProbe();
        const pageRect = page.getBoundingClientRect();
        const pageWidth = offGrid(pageRect.width, ch);
        if (pageWidth) out.push(rulerFinding(".page", "page width", page, pageWidth, "ch"));

        for (const panel of document.querySelectorAll(".panel")) {
          const rect = panel.getBoundingClientRect();
          const panelWidth = offGrid(rect.width, ch);
          if (panelWidth) out.push(rulerFinding(selectorName(panel), "panel width", panel, panelWidth, "ch"));
          const panelHeight = offGrid(rect.height, lh);
          if (panelHeight) out.push(rulerFinding(selectorName(panel), "panel height", panel, panelHeight, "lh"));
          const panelTop = offGrid(rect.top - pageRect.top, lh);
          if (panelTop) out.push(rulerFinding(selectorName(panel), "panel top", panel, panelTop, "lh"));
          const inner = contentBounds(panel);
          const contentWidth = offGrid(inner.width, ch);
          if (contentWidth) out.push(rulerFinding(selectorName(panel), "panel content width", panel, contentWidth, "ch"));
        }

        for (const el of document.querySelectorAll(".masthead dt, .masthead dd, .record-index li > :last-child, .record__body, .artifact-venue, .artifact-title, .doc-code, .doc-title, .series-index, .series-title, .series-url, .dispatch-list span, .dispatch-list a")) {
          if (!visible(el)) continue;
          const panel = el.closest(".panel");
          if (!panel) continue;
          const inner = contentBounds(panel);
          const rect = el.getBoundingClientRect();
          const left = offGrid(rect.left - inner.left, ch);
          if (left) out.push(rulerFinding(selectorName(el), "left column", el, left, "ch"));
          if (el.matches(".record-index li > :last-child, .dispatch-list a")) {
            const right = offGrid(inner.right - rect.right, ch);
            if (right) out.push(rulerFinding(selectorName(el), "right column", el, right, "ch"));
          }
        }

        if (width >= 768) {
          for (const el of document.querySelectorAll(".masthead .uri dd, .masthead .location dd")) {
            if (!visible(el)) continue;
            const panel = el.closest(".panel");
            if (!panel) continue;
            const drift = contentBounds(panel).right - el.getBoundingClientRect().right;
            if (Math.abs(drift) > 1) {
              out.push({
                viewport: width,
                selector: selectorName(el),
                text: text(el),
                reason: `masthead right register not right-anchored: ${drift.toFixed(1)}px from panel edge`,
              });
            }
          }
        }

        for (const el of document.querySelectorAll(".record, .artifact-ledger > li, .artifact-group, .series-list > li, .docket-list > li")) {
          if (!visible(el)) continue;
          const rect = el.getBoundingClientRect();
          const height = offGrid(rect.height, lh);
          if (height) out.push(rulerFinding(selectorName(el), "row height", el, height, "lh"));
        }

      }

      return out;
    }, viewport.width);

    findings.push(...next);
    await page.close();
  }
} finally {
  await browser.close();
}

if (findings.length > 0) {
  throw new Error(findings
    .map((f) => `${f.viewport}px ${f.selector}: ${f.reason}${f.text ? ` (${f.text})` : ""}`)
    .join("\n"));
}

console.log(`✓ layout check passed at ${viewports.map((v) => `${v.width}px`).join(", ")}`);
