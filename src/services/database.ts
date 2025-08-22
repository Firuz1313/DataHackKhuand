// Frontend API service for database operations

export interface DatabaseStats {
  totalTables: number
  totalRecords: number
  databaseSize: string
  activeConnections: number
  newTables: number
  newRecords: number
  sizeGrowth: string
  maxConnections: number
}

export interface TableInfo {
  id: number
  name: string
  records: string
  lastUpdate: string
  status: 'Активна' | 'Обновляется' | 'Ошибка'
  schema?: string
}

export interface QueryActivity {
  id: number
  query: string
  duration: string
  time: string
  status: 'success' | 'error'
}

export interface QueryResult {
  rows: any[]
  rowCount: number
  executionTime: number
  fields?: Array<{
    name: string
    dataTypeID: number
  }>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

class DatabaseService {
  private static instance: DatabaseService
  private baseUrl: string
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      console.log(`🌐 API вызов: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка сети' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<T> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'API вернул ошибку')
      }

      return result.data as T
    } catch (error) {
      console.error('❌ Ошибка API:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Неизвестная ошибка API')
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const status = await this.apiCall<{isConnected: boolean}>('/database/status')
      return status.isConnected
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      return await this.apiCall<DatabaseStats>('/database/stats')
    } catch (error) {
      console.error('Failed to get database stats:', error)
      // Return fallback data
      return {
        totalTables: 0,
        totalRecords: 0,
        databaseSize: '0 MB',
        activeConnections: 0,
        newTables: 0,
        newRecords: 0,
        sizeGrowth: '0 MB',
        maxConnections: 100
      }
    }
  }

  async getTables(): Promise<TableInfo[]> {
    try {
      return await this.apiCall<TableInfo[]>('/database/tables')
    } catch (error) {
      console.error('Failed to get tables:', error)
      return []
    }
  }

  async getTableSchema(tableName: string): Promise<{tableName: string, columns: any[]}> {
    try {
      return await this.apiCall<{tableName: string, columns: any[]}>(`/database/tables/${tableName}/schema`)
    } catch (error) {
      console.error('Failed to get table schema:', error)
      throw error
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    try {
      return await this.apiCall<QueryResult>('/database/query', {
        method: 'POST',
        body: JSON.stringify({ query })
      })
    } catch (error) {
      console.error('Query execution failed:', error)
      throw error
    }
  }

  async getRecentQueries(): Promise<QueryActivity[]> {
    try {
      return await this.apiCall<QueryActivity[]>('/database/queries/recent')
    } catch (error) {
      console.error('Failed to get recent queries:', error)
      return []
    }
  }

  // Health check for the API
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`)
      return response.ok
    } catch (error) {
      console.error('API health check failed:', error)
      return false
    }
  }
}

export const dbService = DatabaseService.getInstance()
