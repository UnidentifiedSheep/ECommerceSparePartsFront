const identifierTransliteration: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ı: 'i',
}

export function normalizeTransliteratedIdentifier(value: string, separator: '.' | '-') {
  const escapedSeparator = separator === '.' ? '\\.' : '-'

  return [...value.trim().toLowerCase()]
    .map((character) => identifierTransliteration[character] ?? character)
    .join('')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${escapedSeparator}+|${escapedSeparator}+$`, 'g'), '')
    .replace(new RegExp(`${escapedSeparator}{2,}`, 'g'), separator)
}
