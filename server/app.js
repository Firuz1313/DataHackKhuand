const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const databaseRoutes = require('./routes/database')
const migrationRoutes = require('./routes/migrations')
const customTablesRoutes = require('./routes/customTables')
const businessTablesRoutes = require('./routes/businessTables')
const { connectToDatabase, closeDatabaseConnection } = require('./config/database')
const migrationManager = require('./config/migrations')

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy for rate limiting to work correctly
app.set('trust proxy', 1)

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Слишком много запросов с этого IP адреса',
})
app.use(limiter)

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }),
)

// Logging
app.use(morgan('combined'))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API routes
app.use('/api/database', databaseRoutes)
app.use('/api/migrations', migrationRoutes)
app.use('/api/custom-tables', customTablesRoutes)
app.use('/api/business-tables', businessTablesRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint не найден',
    path: req.originalUrl,
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err)

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'База данных недоступна',
      details: 'Проверьте подключение к базе данных',
    })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.message,
    })
  }

  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так',
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Получен сигнал SIGTERM, завершение работы...')
  await closeDatabaseConnection()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('По��учен сигнал SIGINT, завершение работы...')
  await closeDatabaseConnection()
  process.exit(0)
})

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectToDatabase()

    // Run migrations
    try {
      console.log('🔄 Запуск миграций...')
      const migrationResult = await migrationManager.runMigrations()
      console.log(`✅ Миграции завершены: ${migrationResult.executed}/${migrationResult.total}`)
    } catch (migrationError) {
      console.error('⚠️ Ошибка миграций:', migrationError.message)
      // Don't exit on migration error, just log it
    }

    // Setup business tables
    try {
      console.log('🏢 Настройка бизнес-таблиц...')
      const businessTablesController = require('./controllers/businessTablesController')

      // Create a mock response object to capture the result
      const mockRes = {
        json: (data) => {
          if (data.success) {
            console.log(`✅ Бизнес-таблицы настроены: выполнено ${data.data.executed} операций`)
          } else {
            console.log(`⚠️ Настройка бизнес-таблиц: ${data.message || data.error}`)
          }
        },
        status: () => mockRes
      }

      await businessTablesController.setupBusinessTables({}, mockRes)
    } catch (businessError) {
      console.error('⚠️ Ошибка настройки бизнес-таблиц:', businessError.message)
      // Don't exit on business tables error, just log it
    }

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`)
      console.log(`📊 API доступно: http://localhost:${PORT}/api`)
      console.log(`🔧 Миграции: http://localhost:${PORT}/api/migrations`)
      console.log(`📋 Кастомные таблицы: http://localhost:${PORT}/api/custom-tables`)
      console.log(`💓 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app
