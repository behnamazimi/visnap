export function buildElementsMaskCSS(
  selectors: string[] | undefined,
  overlay: string = "#ffA500"
): string {
  if (!selectors || selectors.length === 0) return "";

  const cleaned = selectors
    .map(s => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  if (cleaned.length === 0) return "";

  // For each selector S, overlay an ::after pseudo-element without affecting layout
  const parts: string[] = [];
  for (const s of cleaned) {
    parts.push(
      `${s}{position:relative !important;}` +
        `${s}::after{content:'';position:absolute;inset:0;` +
        `background:${overlay} !important;opacity:1;pointer-events:none;}`
    );
  }
  return parts.join("\n");
}
