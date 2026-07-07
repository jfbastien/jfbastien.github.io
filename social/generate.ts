import satori, { type Font } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { execFileSync } from "child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { colors } from "../site/design-tokens.ts";
import { isWideCodepoint } from "../site/font-corpus.ts";
import { webFonts } from "../site/fonts.ts";
import { parseFrontMatter } from "../site/parse.ts";

const root = join(import.meta.dir, "..");
const { meta } = parseFrontMatter(readFileSync(join(root, "content.md"), "utf-8"));

type SatoriInput = Parameters<typeof satori>[0];
interface StyleProps { readonly [k: string]: string | number | undefined }
interface VNode { readonly type: string; readonly props: Record<string, unknown> }

const h = (tag: string, style: StyleProps, ...kids: readonly (string | VNode)[]): VNode =>
  ({ type: tag, props: { style, children: kids.length === 1 ? kids[0] : kids } });
const img = (src: string, style: StyleProps): VNode =>
  ({ type: "img", props: { src, style } });

const primaryFont = webFonts.find((f) => f.kind === "primary");
if (!primaryFont) throw new Error("fonts/manifest.json has no primary font");
const supplementalFont = webFonts.find((f) => f.kind === "supplemental");

type FontWeight = NonNullable<Font["weight"]>;

const font = (file: string, name: string, weight: FontWeight): Font =>
  ({ name, weight, style: "normal" as const, data: readFileSync(join(root, "fonts", file)) });

const paper = colors.paper;
const ink = colors.ink;
const muted = colors.muted;
const rule = colors.rule;
const warm = colors.accentWarm;
const portrait = `data:image/png;base64,${readFileSync(join(root, "social", "portrait.png"), "base64")}`;

const supplementalFamily = supplementalFont?.family ?? primaryFont.family;
const cardFontSize = 28;
const registerColumns = 42;
const supplementText = (text: string): VNode =>
  h("span", { color: ink, fontFamily: supplementalFamily }, text);

function displayCells(text: string): number {
  return [...text].reduce((sum, ch) => sum + (isWideCodepoint(ch.codePointAt(0)!) ? 2 : 1), 0);
}

function field(term: string, valueText: string, value: string | VNode = valueText, weight = 400): VNode {
  const label = term.toUpperCase();
  const dotCount = Math.max(4, registerColumns - label.length - displayCells(valueText) - 2);
  const leader = ".".repeat(dotCount);
  return h("div", {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    width: "100%",
    fontSize: cardFontSize,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
  },
    h("span", { color: muted }, label),
    h("span", { color: colors.faint }, ` ${leader} `),
    h("span", { color: ink, fontWeight: weight }, value),
  );
}

const locationText = `• ${meta.location}`;
const locationValue = h("span", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
},
  h("span", { color: colors.japanRed }, "•"),
  h("span", { width: cardFontSize * 0.6 }, ""),
  supplementText(meta.location),
);

const staticField = (term: string, valueText: string, weight = 400): VNode =>
  field(term, valueText, valueText, weight);

const element = h("div", {
  display: "flex",
  width: meta.og.width,
  height: meta.og.height,
  background: paper,
  color: ink,
  fontFamily: primaryFont.family,
  padding: 54,
},
  h("div", {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
    h("div", {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      border: `2px solid ${rule}`,
      padding: 36,
    },
      h("div", { display: "flex", flexDirection: "row", gap: 36, flex: 1 },
        h("div", {
          display: "flex",
          width: 270,
          height: "100%",
          border: `2px solid ${rule}`,
          overflow: "hidden",
          background: "#fff",
          flexShrink: 0,
        },
          img(portrait, { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }),
        ),
        h("div", { display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" },
          staticField("Name", meta.name, 700),
          staticField("Work", meta.tagline),
          field("Location", locationText, locationValue),
          staticField("URI", meta.url.replace(/^https?:\/\//, "")),
        ),
      ),
      h("div", { display: "flex", width: "100%", height: 2, background: rule, marginTop: 30, marginBottom: 18 }, ""),
      h("div", {
        display: "flex",
        justifyContent: "flex-end",
        color: muted,
        fontSize: cardFontSize,
        lineHeight: 1.25,
      },
        h("span", { color: warm, fontFamily: supplementalFamily, fontSize: cardFontSize, lineHeight: 1.25 }, "以上"),
      ),
    ),
  ),
);

const svg = await satori(element as unknown as SatoriInput, {
  width: meta.og.width,
  height: meta.og.height,
  fonts: [
    font(primaryFont.staticTtf ?? primaryFont.ttf, primaryFont.family, 400),
    ...(primaryFont.staticBoldTtf ? [font(primaryFont.staticBoldTtf, primaryFont.family, 700)] : []),
    ...(supplementalFont ? [font(supplementalFont.ttf, supplementalFont.family, 400)] : []),
  ],
});

const out = join(root, "og.png");
if (existsSync(out)) chmodSync(out, 0o644);
writeFileSync(out, new Resvg(svg).render().asPng());
execFileSync("pngquant", ["--quality=70-90", "--force", "--output", out, out], { stdio: "pipe" });
chmodSync(out, 0o444);

const png = readFileSync(out);
const [pngWidth, pngHeight] = [png.readUInt32BE(16), png.readUInt32BE(20)];
if (pngWidth !== meta.og.width || pngHeight !== meta.og.height) {
  throw new Error(`og.png is ${pngWidth}x${pngHeight}; content.md declares ${meta.og.width}x${meta.og.height}`);
}
console.log(`✓ ${out} (${(png.length / 1024).toFixed(0)} KB, ${pngWidth}x${pngHeight})`);
