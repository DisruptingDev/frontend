/**
 * Formats a date to YYYY-MM-DDTHH:mm:ss in local time.
 * This is the standard format required for SAT CFDI 4.0.
 * 
 * @param {Date|string} dateSource - The date object or string to format
 * @returns {string} - Formatted date string
 */
export function formatSATDate(dateSource = new Date()) {
    let d;

    if (typeof dateSource === 'string') {
        // Handle YYYY-MM-DD strings directly to avoid time zone shifts
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateSource)) {
            return `${dateSource}T00:00:00`;
        }
        // Handle ISO-like strings that might already have a T but maybe incomplete
        if (dateSource.includes('T')) {
            const [datePart, timePart] = dateSource.split('T');
            const [hours, minutes, seconds] = timePart.split(':');
            const h = (hours || '00').padStart(2, '0');
            const m = (minutes || '00').padStart(2, '0');
            const s = (seconds || '00').slice(0, 2).padStart(2, '0');
            return `${datePart}T${h}:${m}:${s}`;
        }
        d = new Date(dateSource);
    } else {
        d = dateSource;
    }

    if (!(d instanceof Date) || isNaN(d.getTime())) {
        console.warn('Invalid date passed to formatSATDate:', dateSource);
        return String(dateSource);
    }

    const pad = (n) => n.toString().padStart(2, '0');

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
