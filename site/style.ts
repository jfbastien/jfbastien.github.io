// CSS for screen and print — extracted verbatim from the hand-authored index.html.

import { fontFaceCSS } from "./fonts.ts";

export function screenCSS(): string {
  return `${fontFaceCSS()}

      body { font-family: "Alegreya Sans", Arial, Helvetica, sans-serif; font-weight: 300; }
      header { max-width: 50em; margin: 0 auto; padding: 0 1em; display: flex; flex-direction: row; flex-wrap: wrap; justify-content: space-between; }
      header h1 { font-family: "Alegreya Sans SC", Arial, Helvetica, sans-serif; font-weight: 800; margin-bottom: 0; display: flex; flex-direction: column; }
      header div { display: flex; flex-direction: column; margin: 1em 0 0 0; }
      header p { margin: 0; text-align: right; }
      header p:first-child { font-family: "Alegreya Sans SC", Arial, Helvetica, sans-serif; font-weight: 300; }
      h2 { font-family: "Alegreya Sans SC", Arial, Helvetica, sans-serif; font-weight: 400; }
      main { max-width: 50em; margin: 0 auto; padding: 0 1em; }
      article { padding: 1em 0; }
      ul { list-style-type: circle; }
      .grid .entry { padding: 1em 0 1em 0; display: flex; flex-direction: row; flex-wrap: wrap; justify-content: space-between; }
      .grid h3 { margin: 0; font-weight: 400; }
      .grid .entry .where { display: flex; flex-direction: column; flex-basis: 9em; }
      .grid p, .grid ul, .grid ol { margin: 0; }
      .grid ul, .grid ol { padding: 0 0 0 1em; }
      .grid .where p { font-weight: 100; }
      .grid .entry .what { display: flex; flex-direction: column; flex-basis: 35em; }
      .grid .short { padding: 0.2em 0 0.2em 0; }
      .grid .short .where { display: flex; flex-direction: row; }
      .grid .short .where h3, .grid .short .where p { width: 5em; }
      .grid .entry.patent { padding: 0.35em 0; }
      .grid .entry.patent .what p { margin: 0; }
      .grid .entry.patent .patent-filings { font-size: 0.95em; line-height: 1.25; margin-top: 0.15em; padding-left: 1.1em; text-indent: -1.1em; }
      footer { font-family: "Alegreya Sans SC", Arial, Helvetica, sans-serif; font-weight: 300; text-align: center; margin-top: 2em; }
      footer::before { content: "❧"; display: block; margin-bottom: 0.5em; }`;
}

export function printCSS(): string {
  return `html, body { width: 100%; height: 100%; font-size: 10.5pt; color: #000; background: none; margin: 0; padding: 0; }
      @page { size: A4; margin: 0.75in 0.75in 0.75in 0.75in; }
      a { text-decoration: underline; color: #000; }
      main { margin: 0; padding: 0; width: 100%; }
      h1, h2, h3 { break-after: avoid; }
      p, li { orphans: 3; widows: 3; }
      .grid .entry, .grid .short.entry { break-inside: avoid; }
      header div p:nth-child(n+3) { display: none; }`;
}
