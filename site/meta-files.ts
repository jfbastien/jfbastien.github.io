import { siteRoot, type SiteMeta } from "./parse.ts";

export function renderLlmsTxt(meta: SiteMeta): string {
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

export function renderRobotsTxt(meta: SiteMeta): string {
  return `User-agent: *
Allow: /

Content-Signal: ai-train=yes, search=yes, ai-input=yes

Sitemap: ${siteRoot(meta)}sitemap.xml
`;
}

export function renderSitemapXml(meta: SiteMeta, lastmod: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteRoot(meta)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
}
