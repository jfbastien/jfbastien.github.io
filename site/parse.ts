// Front matter + structural parsing for content.md.

export interface SocialLink {
  readonly icon: string;
  readonly label: string;
  readonly url: string;
  readonly rel?: string;
}

export interface OgMeta {
  readonly image: string;
  readonly width: number;
  readonly height: number;
}

export interface TwitterMeta {
  readonly site: string;
}

export interface SiteMeta {
  readonly name: string;
  readonly tagline: string;
  readonly url: string;
  readonly email: string;
  readonly description: string;
  readonly social: readonly SocialLink[];
  readonly og: OgMeta;
  readonly twitter: TwitterMeta;
}

export interface Section {
  readonly title: string;
  readonly raw: string;
}

export interface Entry {
  readonly heading: string;
  readonly blockquoteLines: readonly string[];
  readonly body: string;
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const val = obj[field];
  if (typeof val !== "string") throw new Error(`content.md: "${field}" must be a string, got ${typeof val}`);
  return val;
}

function requireObject(obj: Record<string, unknown>, field: string): Record<string, unknown> {
  const val = obj[field];
  if (!val || typeof val !== "object") throw new Error(`content.md: "${field}" must be an object`);
  return val as Record<string, unknown>;
}

function requireNumber(obj: Record<string, unknown>, field: string): number {
  const val = obj[field];
  if (typeof val !== "number") throw new Error(`content.md: "${field}" must be a number, got ${typeof val}`);
  return val;
}

function requireArray(obj: Record<string, unknown>, field: string): readonly unknown[] {
  const val = obj[field];
  if (!Array.isArray(val)) throw new Error(`content.md: "${field}" must be an array`);
  return val;
}

function parseSocialLinks(raw: readonly unknown[]): readonly SocialLink[] {
  return raw.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error(`content.md: social[${i}] must be an object`);
    const o = item as Record<string, unknown>;
    return {
      icon: requireString(o, "icon"),
      label: requireString(o, "label"),
      url: requireString(o, "url"),
      ...("rel" in o ? { rel: requireString(o, "rel") } : {}),
    };
  });
}

export function parseFrontMatter(raw: string): { readonly meta: SiteMeta; readonly body: string } {
  if (!/^---\r?\n/.test(raw)) throw new Error("content.md must start with --- front matter fence");

  const afterFirstFence = raw.slice(raw.indexOf("\n") + 1);
  const closingIndex = afterFirstFence.indexOf("\n---");
  if (closingIndex === -1) throw new Error("content.md: no closing --- fence");

  const yaml = afterFirstFence.slice(0, closingIndex);
  const body = afterFirstFence.slice(closingIndex + 4).replace(/^\r?\n/, "");
  const p = Bun.YAML.parse(yaml) as Record<string, unknown>;

  const og = requireObject(p, "og");
  const twitter = requireObject(p, "twitter");

  const meta: SiteMeta = {
    name: requireString(p, "name"),
    tagline: requireString(p, "tagline"),
    url: requireString(p, "url"),
    email: requireString(p, "email"),
    description: requireString(p, "description"),
    social: parseSocialLinks(requireArray(p, "social")),
    og: { image: requireString(og, "image"), width: requireNumber(og, "width"), height: requireNumber(og, "height") },
    twitter: { site: requireString(twitter, "site") },
  };

  return { meta, body };
}

export function splitSections(body: string): readonly Section[] {
  const parts = body.split(/^## /m);
  if (parts[0].trim() !== "") throw new Error("content.md: unexpected content before first ## heading");

  return parts.slice(1).map((part) => {
    const nl = part.indexOf("\n");
    if (nl === -1) throw new Error(`content.md: section heading with no content: "${part}"`);
    return { title: part.slice(0, nl).trim(), raw: part.slice(nl + 1) };
  });
}

export function parseEntries(raw: string): readonly Entry[] {
  const parts = raw.split(/^### /m);
  return parts.slice(1).map((part) => {
    const nl = part.indexOf("\n");
    if (nl === -1) throw new Error(`content.md: ### entry with no body: "${part.trim()}"`);

    const heading = part.slice(0, nl).trim();
    const lines = part.slice(nl + 1).split("\n");
    const blockquoteLines: string[] = [];
    let bodyStart = 0;

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("> ")) break;
      blockquoteLines.push(lines[i].slice(2));
      bodyStart = i + 1;
    }

    return { heading, blockquoteLines, body: lines.slice(bodyStart).join("\n").trim() };
  });
}

export function inline(md: string): string {
  const html = Bun.markdown.html(md).replace(/\n$/, "");
  if (!html.startsWith("<p>") || !html.endsWith("</p>")) {
    throw new Error(`inline(): expected <p> wrapper, got: ${html}`);
  }
  const inner = html.slice(3, -4);
  if (inner.includes("</p>")) throw new Error(`inline(): multi-paragraph input: ${html}`);
  return inner;
}
