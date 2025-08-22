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

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface RequestQueue {
  resolve: (value: any) => void
  reject: (error: any) => void
  endpoint: string
  options: RequestInit
}

class DatabaseService {
  private static instance: DatabaseService
  private baseUrl: string
  private cache = new Map<string, CacheEntry<any>>()
  private requestQueue: RequestQueue[] = []
  private isProcessingQueue = false
  private lastRequestTime = 0
  private readonly MIN_REQUEST_INTERVAL = 200 // Minimum 200ms between requests
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff
  private readonly DEFAULT_CACHE_TTL = 30000 // 30 seconds

  constructor() {
    // Use relative URLs for API calls - Vite proxy will handle routing to backend
    this.baseUrl = '/api'
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET'
    const body = options.body || ''
    return `${method}:${endpoint}:${body}`
  }

  private getCachedData<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey)
      return null
    }

    return entry.data as T
  }

  private setCachedData<T>(cacheKey: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await this.wait(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      }

      const request = this.requestQueue.shift()
      if (request) {
        try {
          this.lastRequestTime = Date.now()
          const result = await this.makeDirectApiCall(request.endpoint, request.options)
          request.resolve(result)
        } catch (error) {
          request.reject(error)
        }
      }
    }

    this.isProcessingQueue = false
  }

  private async makeDirectApiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`🌐 API вызов: ${options.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result: ApiResponse<T> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'API вернул ошибку')
    }

    return result.data as T
  }

  private async apiCallWithRetry<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let lastError: Error = new Error('Unknown error')

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        if (attempt === 0) {
          // First attempt - use queue to rate limit
          return await new Promise<T>((resolve, reject) => {
            this.requestQueue.push({
              resolve,
              reject,
              endpoint,
              options,
            })
            this.processRequestQueue()
          })
        } else {
          // Retry attempts - wait before retrying
          const delay = this.RETRY_DELAYS[attempt - 1] || 4000
          console.log(`⏳ Retry attempt ${attempt} after ${delay}ms for ${endpoint}`)
          await this.wait(delay)
          return await this.makeDirectApiCall<T>(endpoint, options)
        }
      } catch (error) {
        lastError = error as Error

        // If it's a 429 error, continue retrying
        if (lastError.message.includes('429') && attempt < this.MAX_RETRIES) {
          console.log(
            `🔄 Rate limited (429), retrying ${endpoint} in ${this.RETRY_DELAYS[attempt] || 4000}ms`,
          )
          continue
        }

        // If it's not a 429 or we've exhausted retries, break
        if (!lastError.message.includes('429')) {
          break
        }
      }
    }

    console.error('❌ Ошибка API после всех попыток:', lastError)
    throw lastError
  }

  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTtl?: number,
  ): Promise<T> {
    try {
      // Check cache first for GET requests
      if ((!options.method || options.method === 'GET') && !options.body) {
        const cacheKey = this.getCacheKey(endpoint, options)
        const cachedData = this.getCachedData<T>(cacheKey)
        if (cachedData) {
          console.log(`📋 Cache hit for ${endpoint}`)
          return cachedData
        }
      }

      const result = await this.apiCallWithRetry<T>(endpoint, options)

      // Cache successful GET requests
      if ((!options.method || options.method === 'GET') && !options.body) {
        const cacheKey = this.getCacheKey(endpoint, options)
        this.setCachedData(cacheKey, result, cacheTtl)
      }

      return result
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
      const status = await this.apiCall<{ isConnected: boolean }>('/database/status', {}, 10000) // 10s cache
      return status.isConnected
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      return await this.apiCall<DatabaseStats>('/database/stats', {}, 30000) // 30s cache
    } catch (error) {
      console.error('Failed to get database stats:', error)
      // Return fallback data
      return {
        totalTables: 0,
        totalRecords: 0,
        databaseSize: 'Недоступно',
        activeConnections: 0,
        newTables: 0,
        newRecords: 0,
        sizeGrowth: '0 MB',
        maxConnections: 100,
      }
    }
  }

  async getTables(): Promise<TableInfo[]> {
    try {
      return await this.apiCall<TableInfo[]>('/database/tables', {}, 60000) // 60s cache
    } catch (error) {
      console.error('Failed to get tables:', error)
      return []
    }
  }

  async getTableSchema(tableName: string): Promise<{ tableName: string; columns: any[] }> {
    try {
      return await this.apiCall<{ tableName: string; columns: any[] }>(
        `/database/tables/${tableName}/schema`,
        {},
        300000, // 5min cache for schema
      )
    } catch (error) {
      console.error('Failed to get table schema:', error)
      throw error
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    try {
      // Don't cache query results
      return await this.apiCallWithRetry<QueryResult>('/database/query', {
        method: 'POST',
        body: JSON.stringify({ query }),
      })
    } catch (error) {
      console.error('Query execution failed:', error)
      throw error
    }
  }

  async getRecentQueries(): Promise<QueryActivity[]> {
    try {
      return await this.apiCall<QueryActivity[]>('/database/queries/recent', {}, 15000) // 15s cache
    } catch (error) {
      console.error('Failed to get recent queries:', error)
      return []
    }
  }

  // Health check for the API
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch('/health')
      return response.ok
    } catch (error) {
      console.error('API health check failed:', error)
      return false
    }
  }

  // Get table data with pagination
  async getTableData(
    tableName: string,
    options: {
      page?: number
      limit?: number
      search?: string
      sort?: string
      order?: 'ASC' | 'DESC'
    } = {},
  ): Promise<{
    rows: any[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> {
    try {
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.search) params.append('search', options.search)
      if (options.sort) params.append('sort', options.sort)
      if (options.order) params.append('order', options.order)

      const queryString = params.toString()
      const endpoint = `/database/tables/${tableName}/data${queryString ? '?' + queryString : ''}`

      return await this.apiCall<{
        rows: any[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
          hasNext: boolean
          hasPrev: boolean
        }
      }>(endpoint, {}, 30000) // 30s cache
    } catch (error) {
      console.error('Failed to get table data:', error)
      throw error
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<{
    cpu: { current: number; average: number; max: number }
    memory: { current: number; average: number; available: string }
    io: { current: number; read: string; write: string }
    connections: { active: number; max: number; idle: number }
  }> {
    try {
      return await this.apiCall<{
        cpu: { current: number; average: number; max: number }
        memory: { current: number; average: number; available: string }
        io: { current: number; read: string; write: string }
        connections: { active: number; max: number; idle: number }
      }>('/database/performance', {}, 10000) // 10s cache for performance data
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      throw error
    }
  }

  // Get real-time monitoring stats
  async getRealTimeStats(): Promise<{
    activeConnections: number
    queriesPerMinute: number
    avgResponseTime: number
    cacheHitRate: number
    cacheSize: string
    transactionsPerSecond: number
    locksCount: number
    deadlocks: number
    timestamp: string
  }> {
    try {
      return await this.apiCall<{
        activeConnections: number
        queriesPerMinute: number
        avgResponseTime: number
        cacheHitRate: number
        cacheSize: string
        transactionsPerSecond: number
        locksCount: number
        deadlocks: number
        timestamp: string
      }>('/database/monitoring/realtime', {}, 5000) // 5s cache for real-time data
    } catch (error) {
      console.error('Failed to get real-time stats:', error)
      throw error
    }
  }

  // Get weekly activity analytics
  async getWeeklyActivity(): Promise<{
    weeklyActivity: Array<{ day: string; queries: number }>
    summary: {
      totalQueries: number
      successfulQueries: number
      errorQueries: number
      successRate: number
    }
  }> {
    try {
      return await this.apiCall<{
        weeklyActivity: Array<{ day: string; queries: number }>
        summary: {
          totalQueries: number
          successfulQueries: number
          errorQueries: number
          successRate: number
        }
      }>('/database/analytics/weekly', {}, 300000) // 5min cache for analytics
    } catch (error) {
      console.error('Failed to get weekly activity:', error)
      throw error
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ API cache cleared')
  }

  // Get cache info for debugging
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const dbService = DatabaseService.getInstance()
