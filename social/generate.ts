// OG card generator — 1200x630, reads content.md for name/tagline.

import satori, { type Font, type FontWeight } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parseFrontMatter } from "../site/parse.ts";

const root = join(import.meta.dir, "..");
const { meta } = parseFrontMatter(readFileSync(join(root, "content.md"), "utf-8"));

// Satori accepts ReactNode. We build compatible objects without depending on React types.
type SatoriInput = Parameters<typeof satori>[0];
interface StyleProps { readonly [k: string]: string | number | undefined }
interface VNode { readonly type: string; readonly props: Record<string, unknown> }

const h = (tag: string, style: StyleProps, ...kids: readonly (string | VNode)[]): VNode =>
  ({ type: tag, props: { style, children: kids.length === 1 ? kids[0] : kids } });
const img = (src: string, style: StyleProps): VNode =>
  ({ type: "img", props: { src, style } });

const portrait = `data:image/png;base64,${readFileSync(join(root, "social/portrait.png"), "base64")}`;
const font = (file: string, name: string, weight: FontWeight): Font =>
  ({ name, weight, style: "normal" as const, data: readFileSync(join(root, "fonts", file)) });

const element = h("div", { display: "flex", width: 1200, height: 630, background: "#fff" },
  h("div", { display: "flex", width: 630, height: 630, overflow: "hidden", flexShrink: 0 },
    img(portrait, { width: 630, height: 630, objectFit: "cover" }),
  ),
  h("div", { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: 48,
    marginLeft: -120, backgroundImage: "linear-gradient(to right, rgba(255,255,255,0) 0%, #fff 25%)" },
    h("span", { fontSize: 88, fontWeight: 800, fontFamily: "Alegreya Sans SC", color: "#111", lineHeight: 1 }, meta.name),
    h("span", { fontSize: 38, fontWeight: 300, fontFamily: "Alegreya Sans", color: "#333", marginTop: 20 }, meta.tagline),
    h("span", { fontSize: 26, fontWeight: 300, fontFamily: "Alegreya Sans SC", color: "#888", marginTop: "auto" }, "jfbastien.com"),
  ),
);

const svg = await satori(element as unknown as SatoriInput, {
  width: 1200, height: 630,
  fonts: [
    font("AlegreyaSansSC-ExtraBold.ttf", "Alegreya Sans SC", 800),
    font("AlegreyaSans-Light.ttf", "Alegreya Sans", 300),
    font("AlegreyaSansSC-Light.ttf", "Alegreya Sans SC", 300),
  ],
});

const out = join(root, "og.png");
writeFileSync(out, new Resvg(svg).render().asPng());
execSync(`pngquant --quality=70-90 --force --output "${out}" "${out}"`, { stdio: "pipe" });
console.log(`\u2713 ${out} (${(readFileSync(out).length / 1024).toFixed(0)} KB)`);
