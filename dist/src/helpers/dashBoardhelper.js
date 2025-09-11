export function getTodayDateRange() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = new Date(today);
    today.setHours(23, 59, 59, 999);
    const todayEnd = new Date(today);
    return {
        todayStart,
        todayEnd,
    };
}
