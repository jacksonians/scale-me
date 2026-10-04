// Measured on Jost at weight 200 with tabular figures, in em
const DIGIT_WIDTH = 0.559
const COMMA_WIDTH = 0.285
// The digits' top edge sits this far above the ring's centre, because the
// "contracts" caption below shares the centred stack: (0.8em line + 22px) / 2,
// less the 0.05em the glyphs sit inside their line box
const TOP_OFFSET_EM = 0.35
const TOP_OFFSET_PX = 11
// The inner ring's radius is 62.5px; this keeps a margin inside its border
const SAFE_RADIUS_PX = 56
const MAX_FONT_SIZE_PX = 88

// The largest font size, in px, at which the count's top corners stay inside
// the inner ring. Solves (width / 2)^2 + top^2 = radius^2 for the font size.
export function contractCountFontSize(text: string): number {
  const commas = text.split(',').length - 1
  const digits = text.length - commas
  const widthInEm = digits * DIGIT_WIDTH + commas * COMMA_WIDTH
  const a = (widthInEm / 2) ** 2 + TOP_OFFSET_EM ** 2
  const b = 2 * TOP_OFFSET_EM * TOP_OFFSET_PX
  const c = TOP_OFFSET_PX ** 2 - SAFE_RADIUS_PX ** 2
  const fits = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
  return Math.min(MAX_FONT_SIZE_PX, Math.floor(fits))
}
