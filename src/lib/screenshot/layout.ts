export interface Bbox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface OcrWord {
  text: string
  bbox: Bbox
}

export interface Cell extends Bbox {
  text: string
}

export interface Row {
  cells: Cell[]
}

// Words closer than this many line-heights belong to the same phrase; wider
// gaps separate a label from its value (Robinhood right-aligns values).
const CELL_GAP_LINE_HEIGHTS = 1.5

interface TesseractBlockLike {
  paragraphs: { lines: { words: OcrWord[] }[] }[]
}

export function wordsFromBlocks(blocks: TesseractBlockLike[] | null): OcrWord[] {
  return (blocks ?? []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.flatMap((line) => line.words.map(({ text, bbox }) => ({ text, bbox }))),
    ),
  )
}

const centerY = (bbox: Bbox) => (bbox.y0 + bbox.y1) / 2

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function toCells(words: OcrWord[]): Cell[] {
  const sorted = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0)
  const maxGap = CELL_GAP_LINE_HEIGHTS * median(sorted.map((w) => w.bbox.y1 - w.bbox.y0))
  const cells: Cell[] = []
  let current: Cell | null = null
  for (const { text, bbox } of sorted) {
    if (current && bbox.x0 - current.x1 <= maxGap) {
      current.text = `${current.text} ${text}`
      current.x1 = Math.max(current.x1, bbox.x1)
      current.y0 = Math.min(current.y0, bbox.y0)
      current.y1 = Math.max(current.y1, bbox.y1)
    } else {
      current = { text, ...bbox }
      cells.push(current)
    }
  }
  return cells
}

// Rebuild visual rows from word boxes. Tesseract's own blocks can split one
// visual row into separate columns (or merge two cards), so rows are regrouped
// here: a word joins a row when each one's vertical centre lies inside the other.
export function buildRows(words: OcrWord[]): Row[] {
  const groups: { words: OcrWord[]; y0: number; y1: number; center: number }[] = []
  const sorted = words.filter((w) => w.text.trim() !== '').sort((a, b) => centerY(a.bbox) - centerY(b.bbox))
  for (const w of sorted) {
    const wordCenter = centerY(w.bbox)
    const group = groups.find(
      (g) => wordCenter >= g.y0 && wordCenter <= g.y1 && g.center >= w.bbox.y0 && g.center <= w.bbox.y1,
    )
    if (group) {
      group.words.push(w)
      group.y0 = Math.min(group.y0, w.bbox.y0)
      group.y1 = Math.max(group.y1, w.bbox.y1)
      group.center = group.words.reduce((sum, member) => sum + centerY(member.bbox), 0) / group.words.length
    } else {
      groups.push({ words: [w], y0: w.bbox.y0, y1: w.bbox.y1, center: wordCenter })
    }
  }
  return groups.sort((a, b) => a.center - b.center).map((g) => ({ cells: toCells(g.words) }))
}
