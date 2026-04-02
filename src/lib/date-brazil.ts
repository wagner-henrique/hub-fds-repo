const BRAZIL_UTC_MIDNIGHT_HOUR = 3

export function buildBrazilSafeUtcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day, BRAZIL_UTC_MIDNIGHT_HOUR, 0, 0, 0))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function parseBrazilOrIsoDateToUtc(value: string): Date | null {
  const trimmed = value.trim()

  const brFormat = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brFormat) {
    const [, day, month, year] = brFormat
    return buildBrazilSafeUtcDate(Number(year), Number(month), Number(day))
  }

  const isoDate = new Date(trimmed)
  if (Number.isNaN(isoDate.getTime())) {
    return null
  }

  return buildBrazilSafeUtcDate(
    isoDate.getUTCFullYear(),
    isoDate.getUTCMonth() + 1,
    isoDate.getUTCDate()
  )
}