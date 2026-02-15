class TimeManager {
    constructor() {
        this.start = null;
        this.end = null;
        this.dates = [];
        this.updateWindow();
    }

    updateWindow() {
        const now = new Date();
        // Calculate end time: Next full hour
        // e.g. 14:30 -> 15:00
        // If current time IS 15:00, it should probably be 15:00? 
        // User said: "if the current time is 14:30 then take the upper limit that is 15;00"
        // So we round up to next hour.

        const end = new Date(now);
        end.setMinutes(0, 0, 0);
        end.setHours(end.getHours() + 1);

        // Calculate start time: 24 hours ago
        const start = new Date(end);
        start.setHours(start.getHours() - 24);

        this.start = start;
        this.end = end;

        this.dates = [];
        let d = new Date(start);
        // We need to capture every date involved in this 24h window
        // Iterate by hour to safe
        while (d < end) {
            const dateStr = this.formatDate(d);
            if (!this.dates.includes(dateStr)) {
                this.dates.push(dateStr);
            }
            d.setHours(d.getHours() + 1);
        }
    }

    formatDate(date) {
        // Matches existing format: YYYY.M.D (no leading zeros based on script.js)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}.${month}.${day}`;
    }

    // Generate keys for the 24h window
    getTimeSlots() {
        const slots = [];
        let current = new Date(this.start);

        // We iterate 24 hours
        // Avoid infinite loops with a safety counter or direct calculation
        for (let i = 0; i < 24; i++) {
            const dateStr = this.formatDate(current);
            const hour = current.getHours();

            for (let q = 0; q < 4; q++) {
                // Key format: YYYY.M.D-H-Q
                // We must use this key format in script.js for storage in timeSlots map
                const key = `${dateStr}-${hour}-${q}`;

                slots.push({
                    key: key,
                    date: dateStr,
                    hour: hour,
                    quarter: q,
                    // For display/header logic
                    isNewDay: (hour === 0 && q === 0) || (i === 0 && q === 0),
                    displayHour: hour
                });
            }

            // Move to next hour
            current.setHours(current.getHours() + 1);
        }
        return slots;
    }

    getDisplayRange() {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return `${this.start.toLocaleDateString('en-US', options)} - ${this.end.toLocaleDateString('en-US', options)}`;
    }
}
