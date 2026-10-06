// backend/src/routes/leaveCancellationRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const leaveCancellationController = require('../controllers/leaveCancellationController');

// Employee routes
router.post('/request', 
    authMiddleware, 
    leaveCancellationController.requestCancellation
);

router.get('/my-requests', 
    authMiddleware, 
    leaveCancellationController.getMyCancellationRequests
);

// Manager routes
router.get('/pending', 
    authMiddleware, 
    leaveCancellationController.getCancellationRequests
);

router.put('/handle/:requestId', 
    authMiddleware, 
    leaveCancellationController.handleCancellationRequest
);

module.exports = router;