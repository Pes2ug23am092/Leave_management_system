// Test script to check if teamController loads without errors
process.chdir('./backend');
console.log('Current directory:', process.cwd());

try {
    console.log('Testing database connection...');
    require('./db/db');
    console.log('✅ Database module loaded successfully');
    
    console.log('Testing teamController import...');
    const teamController = require('./src/controllers/teamController');
    console.log('✅ TeamController loaded successfully');
    console.log('Available functions:', Object.keys(teamController));
    
    console.log('✅ All modules loaded successfully - no syntax errors');
} catch (error) {
    console.error('❌ Error loading modules:', error.message);
    console.error('Stack:', error.stack);
}