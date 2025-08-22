const { query } = require('./database')
const fs = require('fs').promises
const path = require('path')

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations')
  }

  async runMigrations() {
    try {
      console.log('🔄 Проверка миграций...')

      // Ensure migrations table exists
      await this.ensureMigrationsTable()

      // Get list of migration files
      const migrationFiles = await this.getMigrationFiles()
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations()
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(this.getMigrationName(file))
      )

      if (pendingMigrations.length === 0) {
        console.log('✅ Все миграции уже выполнены')
        return { executed: 0, total: migrationFiles.length }
      }

      console.log(`📊 Найдено ${pendingMigrations.length} новых миграций`)

      // Execute pending migrations
      let executedCount = 0
      for (const migrationFile of pendingMigrations) {
        try {
          await this.executeMigration(migrationFile)
          executedCount++
          console.log(`✅ Миграция ${migrationFile} выполнена`)
        } catch (error) {
          console.error(`❌ Ошибка выполнения миграции ${migrationFile}:`, error)
          throw error
        }
      }

      console.log(`🎉 В��полнено ${executedCount} миграций`)
      return { executed: executedCount, total: migrationFiles.length }

    } catch (error) {
      console.error('❌ Ошибка при выполнении миграций:', error)
      throw error
    }
  }

  async ensureMigrationsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rollback_sql TEXT
      )
    `
    await query(createTableQuery)
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath)
      return files
        .filter(file => file.endsWith('.sql'))
        .sort() // Ensure proper order
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📁 Папка миграций не найдена, создаю...')
        await fs.mkdir(this.migrationsPath, { recursive: true })
        return []
      }
      throw error
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await query('SELECT name FROM migrations ORDER BY executed_at')
      return result.rows.map(row => row.name)
    } catch (error) {
      // If table doesn't exist, return empty array
      return []
    }
  }

  getMigrationName(filename) {
    return path.basename(filename, '.sql')
  }

  async executeMigration(filename) {
    const migrationPath = path.join(this.migrationsPath, filename)
    const migrationName = this.getMigrationName(filename)
    
    // Read migration file
    const migrationSQL = await fs.readFile(migrationPath, 'utf8')
    
    // Split by statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement)
      }
    }

    console.log(`📝 Миграция ${migrationName} применена`)
  }

  async rollbackMigration(migrationName) {
    try {
      console.log(`🔄 Откат миграции ${migrationName}...`)

      // Get rollback SQL
      const result = await query(
        'SELECT rollback_sql FROM migrations WHERE name = $1',
        [migrationName]
      )

      if (result.rows.length === 0) {
        throw new Error(`Миграция ${migrationName} не найдена`)
      }

      const rollbackSQL = result.rows[0].rollback_sql
      if (!rollbackSQL) {
        throw new Error(`Скрипт отката для миграции ${migrationName} не найден`)
      }

      // Execute rollback
      const statements = rollbackSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          await query(statement)
        }
      }

      // Remove migration record
      await query('DELETE FROM migrations WHERE name = $1', [migrationName])

      console.log(`✅ Миграция ${migrationName} успешно откачена`)
      return true

    } catch (error) {
      console.error(`❌ Ошибка отката миграции ${migrationName}:`, error)
      throw error
    }
  }

  async getMigrationStatus() {
    try {
      const migrationFiles = await this.getMigrationFiles()
      const executedMigrations = await this.getExecutedMigrations()

      const status = migrationFiles.map(file => {
        const name = this.getMigrationName(file)
        return {
          name,
          file,
          executed: executedMigrations.includes(name),
          executedAt: null
        }
      })

      // Get execution dates
      const result = await query('SELECT name, executed_at FROM migrations')
      const executionDates = {}
      result.rows.forEach(row => {
        executionDates[row.name] = row.executed_at
      })

      status.forEach(migration => {
        if (migration.executed && executionDates[migration.name]) {
          migration.executedAt = executionDates[migration.name]
        }
      })

      return {
        migrations: status,
        total: migrationFiles.length,
        executed: executedMigrations.length,
        pending: migrationFiles.length - executedMigrations.length
      }

    } catch (error) {
      console.error('❌ Ошибка получения статуса миграций:', error)
      throw error
    }
  }

  async createMigration(name, sql, rollbackSQL = '') {
    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`
      const filepath = path.join(this.migrationsPath, filename)

      // Create migration content
      const migrationContent = `-- ${name}
-- Created: ${new Date().toISOString()}

${sql}

-- Rollback SQL
${rollbackSQL ? `INSERT INTO migrations (name, rollback_sql) VALUES ('${this.getMigrationName(filename)}', '${rollbackSQL.replace(/'/g, "''")}');` : ''}
`

      // Write to file
      await fs.writeFile(filepath, migrationContent, 'utf8')

      console.log(`📝 Миграция создана: ${filename}`)
      return {
        filename,
        name: this.getMigrationName(filename),
        path: filepath
      }

    } catch (error) {
      console.error('❌ Ошибка создания миграции:', error)
      throw error
    }
  }
}

module.exports = new MigrationManager()
