import { chmod } from "fs/promises";
import { join } from "path";
import { parseFrontMatter, splitSections, type SiteMeta } from "./parse.ts";
import { renderLlmsTxt, renderRobotsTxt, renderSitemapXml } from "./meta-files.ts";
import { renderHead } from "./head.ts";
import { attrs } from "./attrs.ts";
import { renderDispatch, renderFooter, renderHeader, renderIndex, renderSections, type RenderedSection } from "./html.ts";

const root = join(import.meta.dir, "..");
const sitemapInputs = ["content.md", "site"] as const;

function renderPage(meta: SiteMeta, sections: readonly RenderedSection[]): string {
  return `<!DOCTYPE html>
<html${attrs([["lang", "en"]])}>
${renderHead(meta)}
  <body>
    <div${attrs([["class", "page"]])}>
${renderHeader(meta)}
${renderIndex(sections)}
      <main>
${sections.map((section) => section.html).join("\n")}
      </main>
${renderDispatch(meta)}
${renderFooter(meta)}
    </div>
  </body>
</html>
`;
}

function renderMarkdown(meta: SiteMeta, body: string): string {
  return `# ${meta.name}

> ${meta.tagline}

${body}`;
}

async function gitLastmod(paths: readonly string[]): Promise<string> {
  const proc = Bun.spawn(
    ["git", "log", "-1", "--format=%cI", "--", ...paths],
    { cwd: root, stdout: "pipe", stderr: "pipe" },
  );
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    proc.stdout ? new Response(proc.stdout).text() : "",
    proc.stderr ? new Response(proc.stderr).text() : "",
  ]);
  if (exitCode !== 0) throw new Error(`git log failed: ${stderr.trim()}`);
  const lastmod = stdout.trim();
  if (!lastmod) throw new Error("git log returned empty lastmod");
  return lastmod;
}

const raw = await Bun.file(join(root, "content.md")).text();
const { meta, body } = parseFrontMatter(raw);
const sections = splitSections(body);
const lastmod = await gitLastmod(sitemapInputs);
const renderedSections = renderSections(sections);

const outputs: readonly [string, string][] = [
  ["index.html", renderPage(meta, renderedSections)],
  ["index.md", renderMarkdown(meta, body)],
  ["llms.txt", renderLlmsTxt(meta)],
  ["robots.txt", renderRobotsTxt(meta)],
  ["sitemap.xml", renderSitemapXml(meta, lastmod)],
];

for (const [name, content] of outputs) {
  const path = join(root, name);
  if (await Bun.file(path).exists()) await chmod(path, 0o644);
  await Bun.write(path, content);
  await chmod(path, 0o444);
  console.log(`✓ ${name} (${content.length} bytes)`);
}
