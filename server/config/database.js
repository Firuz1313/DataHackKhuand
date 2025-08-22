const { Pool } = require('pg');
const SSH2Promise = require('ssh2-promise');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.sshConnection = null;
    this.isConnected = false;
  }

  async connectToDatabase() {
    try {
      console.log('🔌 Подключение к базе данных через SSH...');

      // SSH Configuration
      const sshConfig = {
        host: process.env.SSH_HOST || '103.246.146.132',
        port: parseInt(process.env.SSH_PORT) || 22,
        username: process.env.SSH_USER || 'user_db',
        password: process.env.SSH_PASSWORD || 'psql14182025'
      };

      // Database Configuration
      const dbConfig = {
        host: process.env.DB_HOST || '103.246.146.132',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'hackathon',
        user: process.env.DB_USER || 'user_db',
        password: process.env.DB_PASSWORD || 'psql14182025',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

      try {
        // Try direct connection first (in case SSH is not needed or already configured)
        console.log('🔗 Попытка прямого подключения к PostgreSQL...');
        this.pool = new Pool(dbConfig);
        
        // Test connection
        const testClient = await this.pool.connect();
        await testClient.query('SELECT 1');
        testClient.release();
        
        console.log('✅ Прямое подключение к PostgreSQL успешно');
        this.isConnected = true;
        
      } catch (directError) {
        console.log('⚠️ Прямое подключение не удалось, попытка через SSH туннель...');
        
        // If direct connection fails, try SSH tunnel
        this.sshConnection = new SSH2Promise(sshConfig);
        await this.sshConnection.connect();
        
        console.log('🔐 SSH с��единение установлено');
        
        // Create tunnel for database connection
        const tunnel = await this.sshConnection.addTunnel({
          remoteAddr: dbConfig.host,
          remotePort: dbConfig.port,
          localPort: 5433 // Use different local port to avoid conflicts
        });
        
        console.log('🚇 SSH туннель создан на порту 5433');
        
        // Connect to database through tunnel
        const tunnelDbConfig = {
          ...dbConfig,
          host: 'localhost',
          port: 5433
        };
        
        this.pool = new Pool(tunnelDbConfig);
        
        // Test connection through tunnel
        const testClient = await this.pool.connect();
        await testClient.query('SELECT 1');
        testClient.release();
        
        console.log('✅ Подключение к PostgreSQL через SSH туннель успешно');
        this.isConnected = true;
      }

      // Setup pool event handlers
      this.pool.on('error', (err) => {
        console.error('❌ Ошибка пула подключений:', err);
        this.isConnected = false;
      });

      this.pool.on('connect', () => {
        console.log('🔗 Новое подключение к базе данных');
      });

      return this.pool;
      
    } catch (error) {
      console.error('❌ Ошибка подключения к базе данных:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async query(text, params) {
    if (!this.isConnected || !this.pool) {
      throw new Error('База данных не подключена');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      console.log(`📊 SQL запрос выполнен за ${duration}ms:`, text.substring(0, 100));
      return result;
    } catch (error) {
      console.error('❌ Ошибка выполнения запроса:', error);
      throw error;
    }
  }

  async getClient() {
    if (!this.isConnected || !this.pool) {
      throw new Error('База данных не подключена');
    }
    return await this.pool.connect();
  }

  async closeDatabaseConnection() {
    try {
      if (this.pool) {
        await this.pool.end();
        console.log('🔌 Пул подключений к базе данных закрыт');
      }
      
      if (this.sshConnection) {
        await this.sshConnection.close();
        console.log('🔐 SSH соеди��ение закрыто');
      }
      
      this.isConnected = false;
    } catch (error) {
      console.error('❌ Ошибка при закрытии подключений:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      poolConnected: !!this.pool,
      sshConnected: !!this.sshConnection
    };
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = {
  connectToDatabase: () => dbManager.connectToDatabase(),
  query: (text, params) => dbManager.query(text, params),
  getClient: () => dbManager.getClient(),
  closeDatabaseConnection: () => dbManager.closeDatabaseConnection(),
  getConnectionStatus: () => dbManager.getConnectionStatus()
};
