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
  timestamp: number
}

class DatabaseService {
  private static instance: DatabaseService
  private baseUrl: string
  private cache = new Map<string, CacheEntry<any>>()
  private requestQueue: RequestQueue[] = []
  private isProcessingQueue = false
  private lastRequestTime = 0
  private rateLimitedUntil = 0 // Circuit breaker for 429 errors
  private consecutiveErrors = 0
  private readonly MIN_REQUEST_INTERVAL = 3000 // Minimum 3 seconds between requests
  private readonly MAX_RETRIES = 1 // Only retry once
  private readonly RETRY_DELAYS = [5000] // 5 second delay only
  private readonly DEFAULT_CACHE_TTL = 300000 // 5 minutes cache
  private readonly RATE_LIMIT_BACKOFF = 30000 // 30 seconds backoff on 429
  private readonly MAX_QUEUE_SIZE = 5 // Limit queue size

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

  private isRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil
  }

  private handleRateLimit(): void {
    this.rateLimitedUntil = Date.now() + this.RATE_LIMIT_BACKOFF
    this.consecutiveErrors++
    console.warn(`🚫 Rate limited! Backing off for ${this.RATE_LIMIT_BACKOFF / 1000} seconds`)
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      // Check if we're rate limited
      if (this.isRateLimited()) {
        console.warn('⏸️ Queue processing paused due to rate limiting')
        break
      }

      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await this.wait(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      }

      const request = this.requestQueue.shift()
      if (request) {
        // Check if request is too old (older than 30 seconds)
        if (now - request.timestamp > 30000) {
          request.reject(new Error('Request timeout - too long in queue'))
          continue
        }

        try {
          this.lastRequestTime = Date.now()
          const result = await this.makeDirectApiCall(request.endpoint, request.options)
          request.resolve(result)
          this.consecutiveErrors = 0 // Reset error count on success
        } catch (error) {
          if (error instanceof Error && error.message.includes('429')) {
            this.handleRateLimit()
            // Reject all remaining requests to prevent flooding
            this.requestQueue.forEach(req => req.reject(new Error('Rate limited - service temporarily unavailable')))
            this.requestQueue.length = 0
          }
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
    // Check circuit breaker first
    if (this.isRateLimited()) {
      throw new Error('Service temporarily unavailable due to rate limiting')
    }

    // Check queue size
    if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
      throw new Error('Too many pending requests - try again later')
    }

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
              timestamp: Date.now(),
            })
            this.processRequestQueue()
          })
        } else {
          // Single retry attempt with longer delay
          const delay = this.RETRY_DELAYS[0]
          console.log(`⏳ Retry attempt ${attempt} after ${delay}ms for ${endpoint}`)
          await this.wait(delay)

          // Check circuit breaker again before retry
          if (this.isRateLimited()) {
            throw new Error('Service temporarily unavailable due to rate limiting')
          }

          return await this.makeDirectApiCall<T>(endpoint, options)
        }
      } catch (error) {
        lastError = error as Error

        // If it's a 429 error, stop retrying immediately
        if (lastError.message.includes('429')) {
          this.handleRateLimit()
          throw new Error('Rate limit exceeded - please wait before making more requests')
        }

        // For other errors, break after first retry
        if (attempt >= this.MAX_RETRIES) {
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

  // Get table indexes
  async getTableIndexes(tableName: string): Promise<{
    tableName: string;
    indexes: Array<{
      index_name: string;
      index_definition: string;
      index_type: 'PRIMARY' | 'UNIQUE' | 'REGULAR';
      index_size: string;
      index_method: string;
      columns: string;
    }>;
  }> {
    try {
      return await this.apiCall<{
        tableName: string;
        indexes: Array<{
          index_name: string;
          index_definition: string;
          index_type: 'PRIMARY' | 'UNIQUE' | 'REGULAR';
          index_size: string;
          index_method: string;
          columns: string;
        }>;
      }>(`/database/tables/${tableName}/indexes`, {}, 300000) // 5min cache for indexes
    } catch (error) {
      console.error('Failed to get table indexes:', error)
      throw error
    }
  }

  // Get table foreign keys
  async getTableForeignKeys(tableName: string): Promise<{
    tableName: string;
    outgoingForeignKeys: Array<{
      constraint_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      update_rule: string;
      delete_rule: string;
    }>;
    incomingForeignKeys: Array<{
      constraint_name: string;
      referencing_table_name: string;
      referencing_column_name: string;
      update_rule: string;
      delete_rule: string;
    }>;
  }> {
    try {
      return await this.apiCall<{
        tableName: string;
        outgoingForeignKeys: Array<{
          constraint_name: string;
          column_name: string;
          foreign_table_name: string;
          foreign_column_name: string;
          update_rule: string;
          delete_rule: string;
        }>;
        incomingForeignKeys: Array<{
          constraint_name: string;
          referencing_table_name: string;
          referencing_column_name: string;
          update_rule: string;
          delete_rule: string;
        }>;
      }>(`/database/tables/${tableName}/foreign-keys`, {}, 300000) // 5min cache for foreign keys
    } catch (error) {
      console.error('Failed to get table foreign keys:', error)
      throw error
    }
  }

  // Get database data model and relationships
  async getDatabaseDataModel(): Promise<{
    tables: Array<{
      name: string;
      schema: string;
      comment: string | null;
      columns: Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        is_primary_key: boolean;
      }>;
      position: { x: number; y: number };
    }>;
    relationships: Array<{
      id: string;
      sourceTable: string;
      sourceColumn: string;
      targetTable: string;
      targetColumn: string;
      constraintName: string;
      updateRule: string;
      deleteRule: string;
      type: string;
    }>;
  }> {
    try {
      return await this.apiCall<{
        tables: Array<{
          name: string;
          schema: string;
          comment: string | null;
          columns: Array<{
            column_name: string;
            data_type: string;
            is_nullable: string;
            column_default: string | null;
            is_primary_key: boolean;
          }>;
          position: { x: number; y: number };
        }>;
        relationships: Array<{
          id: string;
          sourceTable: string;
          sourceColumn: string;
          targetTable: string;
          targetColumn: string;
          constraintName: string;
          updateRule: string;
          deleteRule: string;
          type: string;
        }>;
      }>('/database/data-model', {}, 600000) // 10min cache for data model
    } catch (error) {
      console.error('Failed to get database data model:', error)
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
