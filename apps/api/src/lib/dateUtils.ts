/**
 * Returns UTC Date representing midnight of the current day in WIB (UTC+7).
 * Used by the daily mission cron and "today's missions" query to align
 * with the 00:00 WIB reset boundary.
 */
export function getWIBStartOfDay(): Date {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const now = new Date();
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  wibNow.setUTCHours(0, 0, 0, 0);
  return new Date(wibNow.getTime() - WIB_OFFSET_MS);
}
