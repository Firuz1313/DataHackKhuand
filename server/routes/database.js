const express = require('express')
const router = express.Router()
const databaseController = require('../controllers/databaseController')

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`📡 API запрос: ${req.method} ${req.path}`)
  next()
})

// Database connection status
router.get('/status', databaseController.getConnectionStatus)

// Database statistics
router.get('/stats', databaseController.getDatabaseStats)

// Get list of tables
router.get('/tables', databaseController.getTables)

// Get table schema
router.get('/tables/:tableName/schema', databaseController.getTableSchema)

// Execute SQL query
router.post('/query', databaseController.executeQuery)

// Get recent queries
router.get('/queries/recent', databaseController.getRecentQueries)

// Get table data with pagination
router.get('/tables/:tableName/data', databaseController.getTableData)

// Get performance metrics
router.get('/performance', databaseController.getPerformanceMetrics)

// Get real-time monitoring stats
router.get('/monitoring/realtime', databaseController.getRealTimeStats)

// Get weekly activity analytics
router.get('/analytics/weekly', databaseController.getWeeklyActivity)

// Get table indexes
router.get('/tables/:tableName/indexes', databaseController.getTableIndexes)

// Get table foreign keys
router.get('/tables/:tableName/foreign-keys', databaseController.getTableForeignKeys)

// Get database relationships and data model
router.get('/data-model', databaseController.getDatabaseRelationships)

module.exports = router
