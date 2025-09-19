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

export function getTodayDateRangeIst() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const todayStart = new Date(year, month, date, 0, 0, 0, 0);
  const todayEnd = new Date(year, month, date, 23, 59, 59, 999);

  return { todayStart, todayEnd };
}
