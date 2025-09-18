export function getTodayDateRange() {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();

  const todayStart = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));

  return {
    todayStart,
    todayEnd,
  };
}
