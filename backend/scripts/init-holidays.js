// backend/scripts/init-holidays.js

const holidayService = require('../src/services/holidayService');

async function initializeHolidays() {
    try {
        console.log('🎉 Initializing holiday data...');
        
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        // Update holidays for current and next year
        await holidayService.updateHolidaysForYear(currentYear);
        await holidayService.updateHolidaysForYear(nextYear);
        
        console.log('✅ Holiday initialization complete!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to initialize holidays:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeHolidays();
}

module.exports = initializeHolidays;