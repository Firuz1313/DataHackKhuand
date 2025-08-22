const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`📡 API запрос: ${req.method} ${req.path}`);
  next();
});

// Database connection status
router.get('/status', databaseController.getConnectionStatus);

// Database statistics
router.get('/stats', databaseController.getDatabaseStats);

// Get list of tables
router.get('/tables', databaseController.getTables);

// Get table schema
router.get('/tables/:tableName/schema', databaseController.getTableSchema);

// Execute SQL query
router.post('/query', databaseController.executeQuery);

// Get recent queries
router.get('/queries/recent', databaseController.getRecentQueries);

module.exports = router;
