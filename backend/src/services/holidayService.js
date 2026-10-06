// backend/src/services/holidayService.js

const axios = require('axios');
const { pool } = require('../../db/db');

class HolidayService {
    constructor() {
        // Using calendarific.com API for Indian holidays (free tier available)
        this.apiKey = process.env.CALENDARIFIC_API_KEY || 'demo-key';
        this.baseUrl = 'https://calendarific.com/api/v2/holidays';
        this.country = 'IN'; // India
    }

    // Fetch holidays from external API
    async fetchIndianHolidays(year = new Date().getFullYear()) {
        try {
            // If no API key, use backup static data
            if (this.apiKey === 'demo-key') {
                console.log('📅 Using static Indian holidays data (no API key provided)');
                return this.getStaticIndianHolidays(year);
            }

            const response = await axios.get(this.baseUrl, {
                params: {
                    api_key: this.apiKey,
                    country: this.country,
                    year: year,
                    type: 'national' // Only national holidays
                }
            });

            return response.data.response.holidays.map(holiday => ({
                date: holiday.date.iso,
                name: holiday.name,
                description: holiday.description || holiday.name,
                type: holiday.type.join(', ')
            }));

        } catch (error) {
            console.warn('⚠️ Failed to fetch from external API, using static data:', error.message);
            return this.getStaticIndianHolidays(year);
        }
    }

    // Fallback static Indian holidays for current year
    getStaticIndianHolidays(year) {
        return [
            { date: `${year}-01-01`, name: 'New Year\'s Day', description: 'New Year\'s Day' },
            { date: `${year}-01-26`, name: 'Republic Day', description: 'Republic Day of India' },
            { date: `${year}-03-08`, name: 'Holi', description: 'Festival of Colors' },
            { date: `${year}-03-29`, name: 'Good Friday', description: 'Good Friday' },
            { date: `${year}-04-14`, name: 'Dr. Ambedkar Jayanti', description: 'Birthday of Dr. B.R. Ambedkar' },
            { date: `${year}-05-01`, name: 'Labour Day', description: 'International Workers\' Day' },
            { date: `${year}-08-15`, name: 'Independence Day', description: 'Independence Day of India' },
            { date: `${year}-08-19`, name: 'Raksha Bandhan', description: 'Festival of Brothers and Sisters' },
            { date: `${year}-08-26`, name: 'Janmashtami', description: 'Birth of Lord Krishna' },
            { date: `${year}-09-07`, name: 'Ganesh Chaturthi', description: 'Birth of Lord Ganesha' },
            { date: `${year}-10-02`, name: 'Gandhi Jayanti', description: 'Birthday of Mahatma Gandhi' },
            { date: `${year}-10-12`, name: 'Dussehra', description: 'Victory of Good over Evil' },
            { date: `${year}-10-31`, name: 'Diwali', description: 'Festival of Lights' },
            { date: `${year}-11-15`, name: 'Guru Nanak Jayanti', description: 'Birthday of Guru Nanak' },
            { date: `${year}-12-25`, name: 'Christmas Day', description: 'Birth of Jesus Christ' }
        ];
    }

    // Alternative: Use date-holidays npm package for more accurate dates
    async getHolidaysWithDateHolidays(year) {
        try {
            // This would require installing 'date-holidays' package
            // const Holidays = require('date-holidays');
            // const hd = new Holidays('IN');
            // return hd.getHolidays(year);
            
            // For now, return static data
            return this.getStaticIndianHolidays(year);
        } catch (error) {
            console.warn('⚠️ date-holidays package not available, using static data');
            return this.getStaticIndianHolidays(year);
        }
    }

    // Save holidays to database
    async saveHolidaysToDatabase(holidays, year) {
        try {
            // Clear existing holidays for the year
            await pool.query('DELETE FROM HolidayCalendar WHERE Year = ?', [year]);

            // Insert new holidays
            for (const holiday of holidays) {
                const holidayDate = new Date(holiday.date);
                const dayOfWeek = holidayDate.toLocaleDateString('en-US', { weekday: 'long' });

                await pool.query(
                    'INSERT INTO HolidayCalendar (Year, HolidayDate, HolidayName, DayOfWeek) VALUES (?, ?, ?, ?)',
                    [year, holiday.date, holiday.name, dayOfWeek]
                );
            }

            console.log(`✅ Successfully saved ${holidays.length} holidays for year ${year}`);
            return holidays.length;

        } catch (error) {
            console.error('❌ Error saving holidays to database:', error.message);
            throw error;
        }
    }

    // Main function to update holidays for a year
    async updateHolidaysForYear(year = new Date().getFullYear()) {
        try {
            console.log(`📅 Updating holidays for year ${year}...`);
            
            const holidays = await this.fetchIndianHolidays(year);
            const savedCount = await this.saveHolidaysToDatabase(holidays, year);
            
            console.log(`✅ Holiday update complete: ${savedCount} holidays saved for ${year}`);
            return { success: true, count: savedCount, year };

        } catch (error) {
            console.error(`❌ Failed to update holidays for ${year}:`, error.message);
            return { success: false, error: error.message, year };
        }
    }

    // Get current holidays from database
    async getUpcomingHolidays(limit = 5) {
        try {
            const [holidays] = await pool.query(
                `SELECT HolidayDate as date, HolidayName as name, DayOfWeek as dayOfWeek
                 FROM HolidayCalendar
                 WHERE HolidayDate >= CURDATE()
                 ORDER BY HolidayDate
                 LIMIT ?`,
                [limit]
            );

            return holidays;
        } catch (error) {
            console.error('❌ Error fetching upcoming holidays:', error.message);
            throw error;
        }
    }
}

module.exports = new HolidayService();