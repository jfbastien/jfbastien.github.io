import { type SiteMeta } from "./parse.ts";
import { preloadLinks } from "./fonts.ts";
import { screenCSS, printCSS } from "./style.ts";
import { attrs } from "./attrs.ts";

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
  const rootUrl = meta.url.endsWith("/") ? meta.url : `${meta.url}/`;
  return `  <head>
    <meta${attrs([["charset", "utf-8"]])}>
    <meta${attrs([["name", "viewport"], ["content", "width=device-width,minimum-scale=1,initial-scale=1"]])}>
    <title>${Bun.escapeHTML(meta.name)}</title>
    ${preloadLinks()}
    <style>
      ${screenCSS()}
    </style>
    <style${attrs([["media", "print"]])}>
      ${printCSS()}
    </style>
    <meta${attrs([["name", "description"], ["content", `${meta.name} — ${meta.tagline}.`]])}>
    <link${attrs([["rel", "canonical"], ["href", rootUrl]])}>
    <meta${attrs([["property", "og:type"], ["content", "website"]])}>
    <meta${attrs([["property", "og:url"], ["content", rootUrl]])}>
    <meta${attrs([["property", "og:title"], ["content", meta.name]])}>
    <meta${attrs([["property", "og:description"], ["content", meta.description]])}>
    <meta${attrs([["property", "og:image"], ["content", meta.og.image]])}>
    <meta${attrs([["property", "og:image:width"], ["content", meta.og.width]])}>
    <meta${attrs([["property", "og:image:height"], ["content", meta.og.height]])}>
    <meta${attrs([["property", "og:image:alt"], ["content", `${meta.name} — ${meta.tagline}`]])}>
    <meta${attrs([["name", "twitter:card"], ["content", "summary_large_image"]])}>
    <meta${attrs([["name", "twitter:site"], ["content", meta.twitter.site]])}>
    <meta${attrs([["name", "twitter:image"], ["content", meta.og.image]])}>
    <link${attrs([["rel", "icon"], ["href", "./favicon.ico"], ["sizes", "32x32"]])}>
    <link${attrs([["rel", "icon"], ["href", "./favicon-256.png"], ["type", "image/png"], ["sizes", "256x256"]])}>
    <link${attrs([["rel", "alternate"], ["type", "text/markdown"], ["href", "./index.md"]])}>
    <script${attrs([["type", "application/ld+json"]])}>${jsonLdSchema(meta)}</script>
  </head>`;
}
