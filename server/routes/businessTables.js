const express = require('express')
const router = express.Router()
const businessTablesController = require('../controllers/businessTablesController')

// Setup business tables (run migration)
router.post('/setup', businessTablesController.setupBusinessTables)

// Get business tables summary
router.get('/summary', businessTablesController.getBusinessTablesSummary)

// Get business analytics
router.get('/analytics', businessTablesController.getBusinessAnalytics)

// Get specific table data
router.get('/customers', businessTablesController.getCustomers)
router.get('/products', businessTablesController.getProducts)
router.get('/orders', businessTablesController.getOrders)
router.get('/suppliers', businessTablesController.getSuppliers)

// Export table data
router.get('/export/:tableName/:format?', businessTablesController.exportTableData)

module.exports = router
