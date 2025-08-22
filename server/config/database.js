const { Pool } = require('pg')
const tunnel = require('tunnel-ssh')

class DatabaseManager {
  constructor() {
    this.pool = null
    this.sshTunnel = null
    this.isConnected = false
  }

  async connectToDatabase() {
    try {
      console.log('🔌 Подключение к базе данных...')

      // Database Configuration
      const dbConfig = {
        host: process.env.DB_HOST || '103.246.146.132',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'hackathon',
        user: process.env.DB_USER || 'user_db',
        password: process.env.DB_PASSWORD || 'psql14182025',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }

      try {
        // Try direct connection first
        console.log('🔗 Попытка прямого подключения к PostgreSQL...')
        this.pool = new Pool(dbConfig)

        // Test connection with timeout
        const testClient = await Promise.race([
          this.pool.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000),
          ),
        ])

        await testClient.query('SELECT 1')
        testClient.release()

        console.log('✅ Прямое подключение к PostgreSQL успешно')
        this.isConnected = true
      } catch (directError) {
        console.log('⚠️ Прямое подключение не удалось, попытка через SSH туннель...')
        console.log('Ошибка прямого подключения:', directError.message)

        // Close the failed pool
        if (this.pool) {
          await this.pool.end()
          this.pool = null
        }

        // SSH Tunnel Configuration
        const sshConfig = {
          username: process.env.SSH_USER || 'user_db',
          password: process.env.SSH_PASSWORD || 'psql14182025',
          host: process.env.SSH_HOST || '103.246.146.132',
          port: parseInt(process.env.SSH_PORT) || 22,
          dstHost: dbConfig.host,
          dstPort: dbConfig.port,
          localHost: '127.0.0.1',
          localPort: 5433,
          keepAlive: true,
        }

        console.log('🔐 Создание SSH туннеля...')

        // Create SSH tunnel
        this.sshTunnel = await new Promise((resolve, reject) => {
          const server = tunnel(sshConfig, (error, server) => {
            if (error) {
              console.error('❌ Ошибка SSH туннеля:', error)
              reject(error)
            } else {
              console.log('✅ SSH туннель создан на порту 5433')
              resolve(server)
            }
          })
        })

        // Connect to database through tunnel
        const tunnelDbConfig = {
          ...dbConfig,
          host: '127.0.0.1',
          port: 5433,
        }

        // Wait a bit for tunnel to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000))

        this.pool = new Pool(tunnelDbConfig)

        // Test connection through tunnel
        const testClient = await this.pool.connect()
        await testClient.query('SELECT 1')
        testClient.release()

        console.log('✅ Подключение к PostgreSQL через SSH туннель успешно')
        this.isConnected = true
      }

      // Setup pool event handlers
      this.pool.on('error', (err) => {
        console.error('❌ Ошибка пула подключений:', err)
        this.isConnected = false
      })

      this.pool.on('connect', () => {
        console.log('🔗 Новое подключение к базе данных')
      })

      this.pool.on('remove', () => {
        console.log('🔌 Подключение удалено из пула')
      })

      return this.pool
    } catch (error) {
      console.error('❌ Ошибка подключения к базе данных:', error)
      this.isConnected = false
      throw error
    }
  }

  async query(text, params) {
    if (!this.isConnected || !this.pool) {
      throw new Error('База данных не подключена')
    }

    try {
      const start = Date.now()
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start

      console.log(
        `📊 SQL запрос выполнен за ${duration}ms: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
      )
      return result
    } catch (error) {
      console.error('❌ Ошибка выполнения запроса:', error.message)
      console.error('📝 Запрос:', text)
      throw error
    }
  }

  async getClient() {
    if (!this.isConnected || !this.pool) {
      throw new Error('База данных не подключена')
    }
    return await this.pool.connect()
  }

  async closeDatabaseConnection() {
    try {
      if (this.pool) {
        await this.pool.end()
        console.log('🔌 Пул подключений к базе данных закрыт')
        this.pool = null
      }

      if (this.sshTunnel) {
        this.sshTunnel.close()
        console.log('🔐 SSH туннель закрыт')
        this.sshTunnel = null
      }

      this.isConnected = false
    } catch (error) {
      console.error('❌ Ошибка при закрытии подключений:', error)
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      poolConnected: !!this.pool,
      sshConnected: !!this.sshTunnel,
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager()

module.exports = {
  connectToDatabase: () => dbManager.connectToDatabase(),
  query: (text, params) => dbManager.query(text, params),
  getClient: () => dbManager.getClient(),
  closeDatabaseConnection: () => dbManager.closeDatabaseConnection(),
  getConnectionStatus: () => dbManager.getConnectionStatus(),
}
