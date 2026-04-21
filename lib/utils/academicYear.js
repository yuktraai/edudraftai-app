/**
 * getAcademicYear(date?)
 * AY runs July–June.
 * If month >= 7 (July+): AY = "YYYY–YY" (e.g. July 2025 → "2025–26")
 * If month < 7 (Jan–Jun): AY = "(YYYY-1)–YY" (e.g. April 2026 → "2025–26")
 */
export function getAcademicYear(date = new Date()) {
  const month = date.getMonth() + 1 // 1-indexed
  const year  = date.getFullYear()
  const startYear = month >= 7 ? year : year - 1
  const endYear   = (startYear + 1).toString().slice(-2)
  return `${startYear}–${endYear}`
}
