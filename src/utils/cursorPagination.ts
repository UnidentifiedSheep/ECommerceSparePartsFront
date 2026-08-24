export interface CursorPage<T> {
  items: T[]
  nextCursor?: string | null
}

export async function collectCursorPages<T>(
  loadPage: (cursor?: string) => Promise<CursorPage<T>>,
): Promise<T[]> {
  const items: T[] = []
  const visitedCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const page = await loadPage(cursor)
    items.push(...page.items)

    const nextCursor = page.nextCursor || undefined
    if (!nextCursor || visitedCursors.has(nextCursor)) return items

    visitedCursors.add(nextCursor)
    cursor = nextCursor
  }
}
