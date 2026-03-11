// Parse quality scores like "Lighting: 6/10 → 9/10"
export function parseScores(text) {
  const scores = []
  const lines = text.split('\n')
  for (const line of lines) {
    const m = line.match(/([A-Za-z\s&]+):\s*(\d+)\/10\s*[→\-]\s*(\d+)\/10/)
    if (m) {
      scores.push({
        label: m[1].trim(),
        orig: parseInt(m[2]),
        enhanced: parseInt(m[3]),
      })
    }
  }
  return scores
}

// Parse variations from text
export function parseVariations(text) {
  const variations = []
  // Match VARIATION N — Name: content
  const blocks = text.split(/\n(?=VARIATION\s*\d)/i)
  for (const block of blocks) {
    const headerMatch = block.match(/VARIATION\s*(\d+)\s*[—\-]\s*([^:\n]+)/i)
    if (!headerMatch) continue
    const num = headerMatch[1]
    const name = headerMatch[2].trim()
    const rest = block.replace(/VARIATION\s*\d+\s*[—\-]\s*[^\n]+/, '').trim()

    // Try to extract prompt
    const promptMatch = rest.match(/Prompt:\s*(.+?)(?:\n|$)/si)
    const prompt = promptMatch ? promptMatch[1].trim() : ''
    const body = rest.replace(/Prompt:\s*.+/si, '').trim()

    variations.push({ num, name, body, prompt })
  }
  return variations
}

// Parse hashtags
export function parseHashtags(text) {
  const matches = text.match(/#\w+/g)
  return matches ? [...new Set(matches)] : []
}

// Split report into sections
export function parseSections(text) {
  const rawSections = text.split(/\n(?=##\s)/)
  return rawSections.map(raw => {
    const lines = raw.trim().split('\n')
    const heading = lines[0]
    const body = lines.slice(1).join('\n').trim()
    const isHeading = heading.startsWith('##')
    const title = isHeading ? heading.replace(/^##\s*/, '') : heading
    return { title, body, raw }
  })
}

// Inline markdown to JSX-safe HTML string (used in dangerouslySetInnerHTML)
export function md(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
