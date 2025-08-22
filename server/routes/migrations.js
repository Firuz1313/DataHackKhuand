const express = require('express')
const router = express.Router()
const migrationManager = require('../config/migrations')
const { query } = require('../config/database')

// Get migration status
router.get('/status', async (req, res) => {
  try {
    const status = await migrationManager.getMigrationStatus()
    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error getting migration status:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статуса миграций',
      details: error.message,
    })
  }
})

// Run pending migrations
router.post('/run', async (req, res) => {
  try {
    const result = await migrationManager.runMigrations()
    res.json({
      success: true,
      data: result,
      message: `Выполнено ${result.executed} миграций из ${result.total}`,
    })
  } catch (error) {
    console.error('Error running migrations:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка выполнения миграций',
      details: error.message,
    })
  }
})

// Rollback migration
router.post('/:name/rollback', async (req, res) => {
  try {
    const { name } = req.params
    await migrationManager.rollbackMigration(name)
    res.json({
      success: true,
      message: `Миграция ${name} успешно откачена`,
    })
  } catch (error) {
    console.error('Error rolling back migration:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка отката миграции',
      details: error.message,
    })
  }
})

// Create new migration
router.post('/create', async (req, res) => {
  try {
    const { name, sql, rollbackSQL } = req.body

    if (!name || !sql) {
      return res.status(400).json({
        success: false,
        error: 'Название и SQL код миграции обязательны',
      })
    }

    const migration = await migrationManager.createMigration(name, sql, rollbackSQL)
    res.json({
      success: true,
      data: migration,
      message: 'Миграция создана успешно',
    })
  } catch (error) {
    console.error('Error creating migration:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка создания миграции',
      details: error.message,
    })
  }
})

module.exports = router
