import { chmod } from "fs/promises";
import { join } from "path";
import { parseFrontMatter, splitSections, type SiteMeta, type Section } from "./parse.ts";
import { renderHead } from "./head.ts";
import { renderHeader, renderFooter, renderSection } from "./html.ts";

const root = join(import.meta.dir, "..");

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

const raw = await Bun.file(join(root, "content.md")).text();
const { meta, body } = parseFrontMatter(raw);
const sections = splitSections(body);

const outputs: readonly [string, string][] = [
  ["index.html", renderPage(meta, sections)],
  ["index.md", renderMarkdown(meta, body)],
  ["llms.txt", renderLlmsTxt(meta)],
];

for (const [name, content] of outputs) {
  const path = join(root, name);
  if (await Bun.file(path).exists()) await chmod(path, 0o644);
  await Bun.write(path, content);
  await chmod(path, 0o444);
  console.log(`\u2713 ${name} (${content.length} bytes)`);
}
