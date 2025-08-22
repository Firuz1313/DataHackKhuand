const express = require('express')
const router = express.Router()
const { query } = require('../config/database')

// Simple custom tables endpoints for now
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Custom tables feature available',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error getting custom tables',
      details: error.message,
    })
  }
})

module.exports = router
