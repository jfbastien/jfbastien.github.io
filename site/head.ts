// <head> generation: meta tags, OG, Twitter card, JSON-LD Person schema, icons, alternate link.

import { type SiteMeta } from "./parse.ts";
import { preloadLinks } from "./fonts.ts";
import { screenCSS, printCSS } from "./style.ts";

function jsonLdSchema(meta: SiteMeta): string {
  const sameAs = meta.social
    .filter((s) => s.url.startsWith("http"))
    .map((s) => s.url);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: meta.name,
    url: meta.url,
    email: meta.email,
    jobTitle: meta.tagline,
    sameAs,
  };

  return JSON.stringify(schema);
}

export function renderHead(meta: SiteMeta): string {
  return `  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <title>${Bun.escapeHTML(meta.name)}</title>
    ${preloadLinks()}
    <style>
      ${screenCSS()}
    </style>
    <style media="print">
      ${printCSS()}
    </style>
    <meta name="description" content="${Bun.escapeHTML(meta.name)} — ${Bun.escapeHTML(meta.tagline)}.">
    <link rel="canonical" href="${meta.url}/">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${meta.url}/">
    <meta property="og:title" content="${Bun.escapeHTML(meta.name)}">
    <meta property="og:description" content="${Bun.escapeHTML(meta.description)}">
    <meta property="og:image" content="${meta.og.image}">
    <meta property="og:image:width" content="${meta.og.width}">
    <meta property="og:image:height" content="${meta.og.height}">
    <meta property="og:image:alt" content="${Bun.escapeHTML(meta.name)} — ${Bun.escapeHTML(meta.tagline)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${meta.twitter.site}">
    <meta name="twitter:image" content="${meta.og.image}">
    <link rel="icon" href="./favicon.ico" sizes="32x32">
    <link rel="icon" href="./favicon-256.png" type="image/png" sizes="256x256">
    <link rel="alternate" type="text/markdown" href="./index.md">
    <script type="application/ld+json">${jsonLdSchema(meta)}</script>
  </head>`;
}
