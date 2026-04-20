import { chmod } from "fs/promises";
import { join } from "path";
import { parseFrontMatter, splitSections, type SiteMeta, type Section } from "./parse.ts";
import { renderHead } from "./head.ts";
import { renderHeader, renderFooter, renderSection } from "./html.ts";

const root = join(import.meta.dir, "..");
const sitemapInputs = ["content.md", "site"] as const;

function renderPage(meta: SiteMeta, sections: readonly Section[]): string {
  return `<!DOCTYPE html>
<html lang="en">
${renderHead(meta)}
  <body>
${renderHeader(meta)}
    <main>
${sections.map(renderSection).join("\n")}
    </main>
${renderFooter(meta)}
  </body>
</html>
`;
}

function renderMarkdown(meta: SiteMeta, body: string): string {
  return `# ${meta.name}

> ${meta.tagline}

${body}`;
}

function renderLlmsTxt(meta: SiteMeta): string {
  const socialLinks = meta.social
    .filter((s) => s.url.startsWith("http"))
    .map((s) => `- ${s.label}: ${s.url}`)
    .join("\n");
  return `# ${meta.name}

> ${meta.description}

## Links

- Website: ${meta.url}
- Full content: ${meta.url}/index.md
- Email: ${meta.email}
${socialLinks}
`;
}

function siteRoot(meta: SiteMeta): string {
  return meta.url.endsWith("/") ? meta.url : `${meta.url}/`;
}

function renderRobotsTxt(meta: SiteMeta): string {
  return `User-agent: *
Allow: /

Content-Signal: ai-train=yes, search=yes, ai-input=yes

Sitemap: ${siteRoot(meta)}sitemap.xml
`;
}

function renderSitemapXml(meta: SiteMeta, lastmod: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteRoot(meta)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
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

const outputs: readonly [string, string][] = [
  ["index.html", renderPage(meta, sections)],
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
  console.log(`\u2713 ${name} (${content.length} bytes)`);
}
