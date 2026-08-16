const markerStart = '[[['
const markerEnd = ']]]'
const searchableCharacter = /[\p{L}\p{N}]/u

function normalizedCharacters(value: string) {
  return [...value].filter((character) => searchableCharacter.test(character))
}

function highlightedRuns(value: string) {
  const runs: string[] = []
  let cursor = 0

  while (cursor < value.length) {
    const start = value.indexOf(markerStart, cursor)
    if (start < 0) break
    const contentStart = start + markerStart.length
    const end = value.indexOf(markerEnd, contentStart)
    if (end < 0) break
    const normalized = normalizedCharacters(value.slice(contentStart, end)).join('').toLocaleLowerCase()
    if (normalized) runs.push(normalized)
    cursor = end + markerEnd.length
  }

  return runs
}

export function resolveSkuHighlight(
  sku: string,
  fragments: readonly string[] | null | undefined,
) {
  const runs = (fragments ?? []).flatMap(highlightedRuns)
  if (runs.length === 0) return sku

  const normalizedSku = normalizedCharacters(sku).join('').toLocaleLowerCase()
  const highlighted = Array.from({ length: normalizedSku.length }, () => false)
  let searchFrom = 0

  for (const run of runs) {
    let index = normalizedSku.indexOf(run, searchFrom)
    if (index < 0) index = normalizedSku.indexOf(run)
    if (index < 0) continue
    highlighted.fill(true, index, index + run.length)
    searchFrom = index + run.length
  }

  if (!highlighted.some(Boolean)) return sku

  const characters = [...sku]
  const normalizedIndexes: Array<number | null> = []
  let normalizedIndex = 0
  for (const character of characters) {
    if (searchableCharacter.test(character)) {
      normalizedIndexes.push(normalizedIndex)
      normalizedIndex += 1
    } else {
      normalizedIndexes.push(null)
    }
  }

  let result = ''
  let isHighlighted = false

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? ''
    const characterIndex = normalizedIndexes[index]
    let nextHighlighted = characterIndex !== null && characterIndex !== undefined
      ? highlighted[characterIndex] ?? false
      : false

    if (characterIndex === null) {
      let previousIndex: number | undefined
      let followingIndex: number | undefined
      for (let before = index - 1; before >= 0; before -= 1) {
        const value = normalizedIndexes[before]
        if (value === null || value === undefined) continue
        previousIndex = value
        break
      }
      for (let after = index + 1; after < normalizedIndexes.length; after += 1) {
        const value = normalizedIndexes[after]
        if (value === null || value === undefined) continue
        followingIndex = value
        break
      }
      nextHighlighted = previousIndex !== undefined
        && followingIndex !== undefined
        && highlighted[previousIndex] === true
        && highlighted[followingIndex] === true
    }

    if (nextHighlighted !== isHighlighted) {
      result += nextHighlighted ? markerStart : markerEnd
      isHighlighted = nextHighlighted
    }
    result += character
  }

  if (isHighlighted) result += markerEnd
  return result
}
