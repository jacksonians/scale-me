// Poiret One's "0" is 0.86em wide and the inner ring leaves about 108px, so
// longer counts step down to stay inside it. Sizes were measured, not guessed.
export function contractCountSize(text: string): string {
  if (text.length <= 1) {
    return 'text-[88px]'
  }
  if (text.length === 2) {
    return 'text-[60px]'
  }
  if (text.length === 3) {
    return 'text-[40px]'
  }
  if (text.length <= 5) {
    return 'text-[28px]'
  }
  if (text.length === 6) {
    return 'text-[24px]'
  }
  if (text.length === 7) {
    return 'text-[20px]'
  }
  return 'text-[15px]'
}
