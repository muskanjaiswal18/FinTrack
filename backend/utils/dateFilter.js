const getDateRange = (range) => {
    const now = new Date();
    const end = new Date(now);
    let start;

    switch (range) {
        case "daily":
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case "weekly": {
            const firstDayOfWeek = now.getDate() - now.getDay();
            start = new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
            break;
        }
        case "monthly":
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case "yearly":
            start = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1); // default monthly
    }

    return { start, end };
};

export default getDateRange;