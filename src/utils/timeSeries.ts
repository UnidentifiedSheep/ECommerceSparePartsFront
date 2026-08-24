export type TimeSeriesGranularity = 'Day' | 'Month' | 'Year'

export interface TimeSeriesPoint {
  periodStart: string
}

interface FillTimeSeriesOptions<T extends TimeSeriesPoint> {
  points: T[]
  startDate: string
  endDate: string
  granularity: TimeSeriesGranularity
  createEmptyPoint: (periodStart: string) => T
}

export function fillTimeSeriesGaps<T extends TimeSeriesPoint>(
  options: FillTimeSeriesOptions<T>,
): T[] {
  const start = periodStart(dateFromInput(options.startDate), options.granularity)
  const end = periodStart(dateFromInput(options.endDate), options.granularity)
  const pointsByPeriod = new Map(
    options.points.map((point) => [periodKey(new Date(point.periodStart), options.granularity), point]),
  )
  const result: T[] = []

  for (let current = start; current <= end; current = nextPeriod(current, options.granularity)) {
    const key = periodKey(current, options.granularity)
    result.push(pointsByPeriod.get(key) ?? options.createEmptyPoint(current.toISOString()))
  }

  return result
}

function dateFromInput(value: string) {
  return new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)
}

function periodStart(date: Date, granularity: TimeSeriesGranularity) {
  if (granularity === 'Year') return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  if (granularity === 'Month') return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function nextPeriod(date: Date, granularity: TimeSeriesGranularity) {
  if (granularity === 'Year') return new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1))
  if (granularity === 'Month') return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1))
}

function periodKey(date: Date, granularity: TimeSeriesGranularity) {
  return periodStart(date, granularity).toISOString()
}
