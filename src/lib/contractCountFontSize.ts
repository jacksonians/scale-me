// Measured on Jost at weight 200 with tabular figures, in em
const DIGIT_WIDTH = 0.559
const COMMA_WIDTH = 0.285
// The inner ring is 128px; this leaves a margin inside its border
const AVAILABLE_WIDTH_PX = 108
const MAX_FONT_SIZE_PX = 88

// The largest font size, in px, at which the count fits inside the inner ring
export function contractCountFontSize(text: string): number {
  const commas = text.split(',').length - 1
  const digits = text.length - commas
  const widthInEm = digits * DIGIT_WIDTH + commas * COMMA_WIDTH
  return Math.min(MAX_FONT_SIZE_PX, Math.floor(AVAILABLE_WIDTH_PX / widthInEm))
}
