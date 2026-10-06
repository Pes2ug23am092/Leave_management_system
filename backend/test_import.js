// Quick test to check if teamController can be imported
try {
    console.log('Testing teamController import...');
    const { getTeamLeaveHistory } = require('./src/controllers/teamController');
    console.log('✅ Successfully imported getTeamLeaveHistory');
    console.log('Function type:', typeof getTeamLeaveHistory);
} catch (error) {
    console.error('❌ Error importing teamController:', error.message);
    console.error('Stack:', error.stack);
}

try {
    console.log('Testing database connection...');
    const { testConnection } = require('./db/db');
    testConnection().then(result => {
        console.log('DB test result:', result);
    }).catch(err => {
        console.error('DB connection error:', err.message);
    });
} catch (error) {
    console.error('❌ Error with database:', error.message);
}