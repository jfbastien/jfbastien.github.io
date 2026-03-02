// Social preview card generator for jfbastien.com
// 1200×630 · OG/Twitter safe dimensions
// Run: bun run social/generate.ts

import satori, { type Font, type FontWeight } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parseFrontMatter } from "../site/parse.ts";

const root = join(import.meta.dir, "..");

// Read name and tagline from content.md front matter
const raw = readFileSync(join(root, "content.md"), "utf-8");
const { meta } = parseFrontMatter(raw);

// --- hyperscript ---
// Satori accepts ReactNode-shaped objects. We use a minimal compatible shape
// and pass through as `any` at the satori() call boundary since we don't
// depend on React types.
interface StyleProps {
  readonly [key: string]: string | number | undefined;
}

interface VNode {
  readonly type: string;
  readonly props: Record<string, unknown>;
}

const h = (tag: string, style: StyleProps, ...kids: readonly (string | VNode)[]): VNode =>
  ({ type: tag, props: { style, children: kids.length === 1 ? kids[0] : kids } });

const img = (src: string, style: StyleProps): VNode =>
  ({ type: "img", props: { src, style } });

// --- assets ---
const portrait = `data:image/png;base64,${readFileSync(join(root, "social/portrait.png"), "base64")}`;

const font = (file: string, name: string, weight: FontWeight): Font =>
  ({ name, weight, style: "normal" as const, data: readFileSync(join(root, "fonts", file)) });

// --- card ---
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- satori expects ReactNode, our VNode is compatible at runtime
const svg = await satori(element as any, {
  width: 1200, height: 630,
  fonts: [
    font("AlegreyaSansSC-ExtraBold.ttf", "Alegreya Sans SC", 800),
    font("AlegreyaSans-Light.ttf", "Alegreya Sans", 300),
    font("AlegreyaSansSC-Light.ttf", "Alegreya Sans SC", 300),
  ],
});

// --- render + optimize ---
const out = join(root, "og.png");
writeFileSync(out, new Resvg(svg).render().asPng());

execSync(`pngquant --quality=70-90 --force --output "${out}" "${out}"`, { stdio: "pipe" });

console.log(`✓ ${out} (${(readFileSync(out).length / 1024).toFixed(0)} KB)`);
