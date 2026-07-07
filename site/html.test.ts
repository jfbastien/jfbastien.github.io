import { expect, test } from "bun:test";
import { renderDispatch, renderHeader, renderSections } from "./html.ts";
import type { Section, SiteMeta } from "./parse.ts";

test("renders sections with deterministic unique slugs", () => {
  const sections: readonly Section[] = [{
    title: "Public Record",
    raw: `### LLVM
> 2019

Talk one.

### LLVM
> 2018

Talk two.`,
  }];

  const html = renderSections(sections).map((s) => s.html).join("\n");
  expect(html).toContain("id=llvm-2019");
  expect(html).toContain("id=llvm-2018");
});

test("renders education degree field and term in order", () => {
  const sections: readonly Section[] = [{
    title: "Education",
    raw: `### Stanford
> Master's degree
> Computer science
> 2010/2015

Systems coursework.`,
  }];

  const html = renderSections(sections)[0].html;
  expect(html).toContain("<p class=record__degree>Master's degree</p>");
  expect(html).toContain("<p class=record__field>Computer science</p>");
  expect(html).toContain('<p class=record__term><time datetime=2010>2010</time>/<time datetime=2015>2015</time></p>');
  expect(html).not.toContain("record__meta-line");
});

test("renders semantic section and record elements", () => {
  const sections: readonly Section[] = [{
    title: "Service Record",
    raw: `### Apple
> Compiler Engineer
> 2016-08/2020-08

Security through compiler technology.`,
  }];

  const rendered = renderSections(sections)[0];
  expect(rendered.id).toBe("service-record");
  expect(rendered.html).toContain("<section");
  expect(rendered.html).toContain("aria-labelledby=service-record-title");
  expect(rendered.html).toContain('<article class="record record--service" id=apple>');
  expect(rendered.html).toContain("<p class=record__role>Compiler Engineer</p>");
  expect(rendered.html).toContain('<p class=record__term><time datetime=2016-08>2016-08</time>/<time datetime=2020-08>2020-08</time></p>');
});

test("renders known social labels with their real casing", () => {
  const meta: SiteMeta = {
    name: "JF Bastien",
    tagline: "build & scale platforms",
    email: "me@example.test",
    url: "https://example.test",
    description: "test",
    location: "日本 東京都",
    og: {
      image: "og.png",
      width: 1200,
      height: 630,
    },
    twitter: {
      site: "@jfbastien",
    },
    social: [{
      kind: "github",
      label: "@jfbastien",
      url: "https://github.com/jfbastien",
      rel: "me",
    }],
  };

  const header = renderHeader(meta);
  expect(header).toContain('<div class=name><dt>Name</dt><dd><h1 class=wordmark id=site-title>JF Bastien</h1></dd></div>');
  expect(header).toContain('<div class=uri><dt>URI</dt><dd><a href=https://example.test>example.test</a></dd></div>');
  expect(header).toContain('<div class=location><dt>Location</dt><dd><span lang=ja>日本 東京都</span></dd></div>');
  expect(header).toContain('<div class=contact><dt>Contact</dt>');
  expect(header).not.toContain("<dt>Type</dt>");
  expect(header).not.toContain("<dt>Updated</dt>");
  expect(header).not.toContain("<dt>Source</dt>");
  expect(header).not.toContain("<dt>Class</dt>");
  const dispatch = renderDispatch(meta);
  expect(dispatch).toContain("<li><span>GitHub</span>");
  expect(dispatch).not.toContain("<span>URL</span>");
});

test("preserves unordered and ordered list semantics", () => {
  const sections: readonly Section[] = [{
    title: "Public Record",
    raw: `### WG21
- [P3477](https://wg21.link/P3477) There are exactly 8 bits in a byte
- [P2809](https://wg21.link/P2809) Trivial infinite loops are not Undefined Behavior

### Tokyo C++
0. First meeting
0. C++ and security`,
  }];

  const html = renderSections(sections)[0].html;
  expect(html).toContain('<ul class=docket-list style=--docket-code-cols:5ch>');
  expect(html).toContain('style=--docket-code-cols:5ch');
  expect(html).toContain('<span class=doc-code>P3477</span>');
  expect(html).toContain('<h3 class=artifact-group__title>Standards Docket</h3>');
  expect(html).toContain('<h3 class=artifact-group__title>Ongoing Series</h3>');
  expect(html).toContain('<ol start=0 class=series-list style=--series-index-cols:2ch>');
  expect(html).toContain('<li><span class=series-index aria-hidden>00</span><span class=series-title>First meeting</span></li>');
});

test("groups papers and talk artifacts into distinct publication layouts", () => {
  const sections: readonly Section[] = [{
    title: "Public Record",
    raw: `### PLDI
> 2017

Verified lifting.

### NDC TechTown
> 2025

Much ado about noping
Conference talk.

### CppCast
> 2018

San Diego EWGI trip report`,
  }];

  const html = renderSections(sections)[0].html;
  expect(html).toContain('<h3 class=artifact-group__title>Papers</h3>');
  expect(html).toContain('<ol class="artifact-ledger artifact-ledger--papers" style=--artifact-control-cols:11ch>');
  expect(html).toContain('<li id=pldi-2017>');
  expect(html).toContain('<h3 class=artifact-group__title>Talks</h3>');
  expect(html).toContain('<li id=ndc-techtown-2025>');
  expect(html).toContain('<span class=artifact-venue>NDC TechTown</span>');
  expect(html).toContain('<span class=artifact-note>Conference talk.</span>');
  expect(html).toContain('<span class=artifact-note>Podcast.</span>');
});

test("rejects unknown Public Record venues instead of misfiling them", () => {
  const sections: readonly Section[] = [{
    title: "Public Record",
    raw: `### OSDI
> 2027

A new paper venue.`,
  }];

  expect(() => renderSections(sections)).toThrow('Unknown Public Record venue: "OSDI"');
});

test("rejects unknown entry sections instead of rendering generic fields", () => {
  const sections: readonly Section[] = [{
    title: "Mystery Register",
    raw: `### Unknown
> Ambiguous

This needs a real renderer.`,
  }];

  expect(() => renderSections(sections)).toThrow('Unknown entry section: "Mystery Register"');
});
