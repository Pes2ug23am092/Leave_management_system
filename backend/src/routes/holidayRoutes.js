// backend/src/routes/holidayRoutes.js
const express = require('express');
const { getUpcomingHolidays, updateHolidays, getHolidaysByYear } = require('../controllers/holidayController');

const router = express.Router();

// GET /api/holidays/upcoming - Get upcoming holidays
router.get('/upcoming', getUpcomingHolidays);

// GET /api/holidays/:year - Get holidays for a specific year
router.get('/:year', getHolidaysByYear);

// POST /api/holidays/update - Admin endpoint to update holidays from external API
router.post('/update', updateHolidays);

module.exports = router;