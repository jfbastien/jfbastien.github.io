// Orchestrator: reads content.md, generates index.html + index.md + llms.txt.

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

console.log(`\u2713 index.html (${html.length} bytes)`);
console.log(`\u2713 index.md (${md.length} bytes)`);
console.log(`\u2713 llms.txt (${llms.length} bytes)`);
