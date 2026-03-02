// Front matter parser, section splitter, entry parser, inline markdown renderer.

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

export function parseFrontMatter(raw: string): { readonly meta: SiteMeta; readonly body: string } {
  const fencePattern = /^---\r?\n/;
  if (!fencePattern.test(raw)) {
    throw new Error("content.md must start with --- front matter fence");
  }

  const afterFirstFence = raw.slice(raw.indexOf("\n") + 1);
  const closingIndex = afterFirstFence.indexOf("\n---");
  if (closingIndex === -1) {
    throw new Error("content.md: no closing --- fence for front matter");
  }

  const yamlBlock = afterFirstFence.slice(0, closingIndex);
  const body = afterFirstFence.slice(closingIndex + 4).replace(/^\r?\n/, "");

  const parsed = Bun.YAML.parse(yamlBlock) as Record<string, unknown>;

  const requiredStrings = ["name", "tagline", "url", "email", "description"] as const;
  for (const field of requiredStrings) {
    if (typeof parsed[field] !== "string") {
      throw new Error(`content.md front matter: missing or invalid "${field}" (expected string)`);
    }
  }
  const requiredObjects = ["social", "og", "twitter"] as const;
  for (const field of requiredObjects) {
    if (!parsed[field] || typeof parsed[field] !== "object") {
      throw new Error(`content.md front matter: missing or invalid "${field}" (expected object)`);
    }
  }

  const meta: SiteMeta = {
    name: parsed.name as string,
    tagline: parsed.tagline as string,
    url: parsed.url as string,
    email: parsed.email as string,
    description: parsed.description as string,
    social: parsed.social as SocialLink[],
    og: parsed.og as OgMeta,
    twitter: parsed.twitter as TwitterMeta,
  };

  return { meta, body };
}

export function splitSections(body: string): readonly Section[] {
  const parts = body.split(/^## /m);
  const beforeFirstH2 = parts[0];
  if (beforeFirstH2.trim() !== "") {
    throw new Error("content.md: unexpected content before first ## heading");
  }

  return parts.slice(1).map((part) => {
    const newlineIndex = part.indexOf("\n");
    if (newlineIndex === -1) {
      throw new Error(`content.md: section heading with no content: "${part}"`);
    }
    const title = part.slice(0, newlineIndex).trim();
    const raw = part.slice(newlineIndex + 1);
    return { title, raw };
  });
}

export function parseEntries(raw: string): readonly Entry[] {
  const parts = raw.split(/^### /m);
  // First part is content before any ###, skip it
  return parts.slice(1).map((part) => {
    const newlineIndex = part.indexOf("\n");
    if (newlineIndex === -1) {
      throw new Error(`content.md: ### entry with no body: "${part.trim()}"`);
    }
    const heading = part.slice(0, newlineIndex).trim();
    const rest = part.slice(newlineIndex + 1);

    const lines = rest.split("\n");
    const blockquoteLines: string[] = [];
    let bodyStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("> ")) {
        blockquoteLines.push(lines[i].slice(2));
        bodyStartIndex = i + 1;
      } else {
        break;
      }
    }

    const body = lines.slice(bodyStartIndex).join("\n").trim();
    return { heading, blockquoteLines, body };
  });
}

export function inline(md: string): string {
  const html = Bun.markdown.html(md);
  const trimmed = html.replace(/\n$/, "");
  if (!trimmed.startsWith("<p>") || !trimmed.endsWith("</p>")) {
    throw new Error(`inline(): expected single <p> wrapper, got: ${html}`);
  }
  const inner = trimmed.slice(3, -4);
  if (inner.includes("</p>")) {
    throw new Error(`inline(): multi-paragraph input not allowed: ${html}`);
  }
  return inner;
}
