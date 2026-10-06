// backend/src/controllers/holidayController.js

const { pool } = require('../../db/db');
const holidayService = require('../services/holidayService');

async function getUpcomingHolidays(req, res) {
    try {
        // Try DB first
        const [holidays] = await pool.query(
            `SELECT 
                HolidayDate as date,
                HolidayName as name,
                DayOfWeek as dayOfWeek
            FROM HolidayCalendar
            WHERE HolidayDate >= CURDATE()
            ORDER BY HolidayDate
            LIMIT 10`
        );

        if (Array.isArray(holidays) && holidays.length > 0) {
            console.log(`📅 Found ${holidays.length} upcoming holidays (DB)`);
            return res.json(holidays);
        }

        // Fallback: use service (external API or static) and optionally persist
        const year = new Date().getFullYear();
        console.warn('⚠️ No upcoming holidays in DB — using fallback source');
        const all = await holidayService.fetchIndianHolidays(year);

        // Filter upcoming and shape
        const todayISO = new Date().toISOString().slice(0, 10);
        const upcoming = all
            .filter(h => (h.date || '').slice(0, 10) >= todayISO)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 10)
            .map(h => {
                const d = new Date(h.date);
                const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
                return { date: h.date, name: h.name, dayOfWeek };
            });

        // Best-effort: populate DB in background for future requests
        holidayService.saveHolidaysToDatabase(all, year)
            .then(() => console.log('✅ Holidays saved to DB from fallback'))
            .catch(e => console.warn('⚠️ Could not save fallback holidays to DB:', e.message));

        console.log(`📅 Returning ${upcoming.length} upcoming holidays (fallback)`);
        return res.json(upcoming);
    } catch (err) {
        console.error('❌ Error fetching upcoming holidays:', err.message);
        return res.status(500).json({ error: 'Failed to fetch holiday calendar' });
    }
}

// Admin endpoint to update holidays
async function updateHolidays(req, res) {
    try {
        const { year, adminKey } = req.body;
        
        // Simple admin key check
        if (adminKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const targetYear = year || new Date().getFullYear();
        const result = await holidayService.updateHolidaysForYear(targetYear);
        
        if (result.success) {
            res.json({
                message: `Successfully updated ${result.count} holidays for year ${result.year}`,
                year: result.year,
                count: result.count
            });
        } else {
            res.status(500).json({
                error: `Failed to update holidays: ${result.error}`,
                year: result.year
            });
        }
    } catch (err) {
        console.error('❌ Error updating holidays:', err.message);
        res.status(500).json({ error: 'Failed to update holidays' });
    }
}

// Get all holidays for a specific year
async function getHolidaysByYear(req, res) {
    try {
        const year = req.params.year || new Date().getFullYear();
        
        const [holidays] = await pool.query(
            `SELECT 
                HolidayDate as date,
                HolidayName as name,
                DayOfWeek as dayOfWeek
            FROM HolidayCalendar
            WHERE Year = ?
            ORDER BY HolidayDate`,
            [year]
        );

        res.json({
            year: parseInt(year),
            count: holidays.length,
            holidays
        });
    } catch (err) {
        console.error('❌ Error fetching holidays by year:', err.message);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
}

module.exports = {
    getUpcomingHolidays,
    updateHolidays,
    getHolidaysByYear,
};