type AttrValue = boolean | number | string | undefined;

const attrNamePattern = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/;
const unquotedValuePattern = /^[^\t\n\f\r "'`=<>]+$/;

export function attr(name: string, value?: AttrValue): string {
  if (!attrNamePattern.test(name)) throw new Error(`Invalid HTML attribute name: ${name}`);
  if (arguments.length === 1) return ` ${name}`;
  if (value === false || value === undefined) return "";
  if (value === true) return ` ${name}`;

  const escaped = Bun.escapeHTML(String(value));
  if (unquotedValuePattern.test(escaped)) return ` ${name}=${escaped}`;
  return ` ${name}="${escaped}"`;
}

export function attrs(values: readonly (readonly [string, AttrValue])[]): string {
  return values.map(([name, value]) => attr(name, value)).join("");
}
