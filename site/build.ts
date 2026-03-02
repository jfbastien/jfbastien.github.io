// Orchestrator: reads content.md, generates index.html + index.md + llms.txt.

import { join } from "path";
import { parseFrontMatter, splitSections, type SiteMeta, type Section } from "./parse.ts";
import { renderHead } from "./head.ts";
import { renderHeader, renderFooter, renderSection } from "./html.ts";

const root = join(import.meta.dir, "..");

function renderPage(meta: SiteMeta, sections: readonly Section[]): string {
  const head = renderHead(meta);
  const header = renderHeader(meta);
  const main = sections.map(renderSection).join("\n");
  const footer = renderFooter(meta);

  return `<!DOCTYPE html>
<html lang="en">
${head}
  <body>
${header}
    <main>
${main}
    </main>
${footer}
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
  return `# ${meta.name}

> ${meta.description}

${meta.name} — ${meta.description}

## Links

- Website: ${meta.url}
- Email: ${meta.email}
${meta.social.filter((s) => s.url.startsWith("http")).map((s) => `- ${s.label}: ${s.url}`).join("\n")}
`;
}

// --- Main ---

const raw = await Bun.file(join(root, "content.md")).text();
const { meta, body } = parseFrontMatter(raw);
const sections = splitSections(body);

const html = renderPage(meta, sections);
const md = renderMarkdown(meta, body);
const llms = renderLlmsTxt(meta);

await Promise.all([
  Bun.write(join(root, "index.html"), html),
  Bun.write(join(root, "index.md"), md),
  Bun.write(join(root, "llms.txt"), llms),
]);

console.log(`✓ index.html (${html.length} bytes)`);
console.log(`✓ index.md (${md.length} bytes)`);
console.log(`✓ llms.txt (${llms.length} bytes)`);
