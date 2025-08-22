import { dbService } from './database'

// ====================================
// DATA MODEL & STAR SCHEMA DOCUMENTATION
// ====================================

/**
 * BUSINESS INTELLIGENCE DATA MODEL
 *
 * FACT TABLES (Transaction/Event Data):
 * - orders: Order transactions with totals, dates, payment status
 * - order_items: Order line items with quantities, prices, products
 * - payments: Payment transactions
 * - inventory_movements: Stock movements (in/out/adjustments)
 *
 * DIMENSION TABLES (Master Data):
 * - customers: Customer master data with segmentation
 * - products: Product catalog with categories and suppliers
 * - suppliers: Supplier information
 * - product_categories: Product categorization hierarchy
 * - dim_regions: Geographic regions
 * - dim_districts: Geographic districts
 * - dim_payment_methods: Payment method lookup
 * - dim_dates: Date dimension for time analysis
 *
 * STAR SCHEMA RELATIONSHIPS:
 * orders (FACT) -> customers (DIM): orders.customer_id -> customers.id
 * order_items (FACT) -> orders (FACT): order_items.order_id -> orders.id
 * order_items (FACT) -> products (DIM): order_items.product_id -> products.id
 * products (DIM) -> suppliers (DIM): products.supplier_id -> suppliers.id
 * products (DIM) -> product_categories (DIM): products.category_id -> product_categories.id
 * payments (FACT) -> orders (FACT): payments.order_id -> orders.id
 *
 * DEDUPLICATION KEYS:
 * - customers.customer_code (business key)
 * - products.product_code (business key)
 * - orders.order_number (business key)
 * - suppliers.supplier_code (business key)
 */

// ====================================
// KPI DEFINITIONS AND FORMULAS
// ====================================

export interface DashboardKPIs {
  // MANDATORY KPIs
  orders: {
    total_orders: number
    orders_growth: number
    avg_orders_per_day: number
  }
  units: {
    total_units: number
    units_growth: number
    avg_units_per_order: number
  }
  revenue: {
    gross_revenue: number // Валовая выручка
    net_paid_revenue: number // Оплаченная выручка (Net Paid)
    revenue_growth: number
  }
  aov: {
    average_order_value: number // AOV - средняя стоимость заказа
    aov_growth: number
    aov_by_channel: { [key: string]: number }
  }
  conversion: {
    payment_conversion: number // Конверсия оплаты (paid/total orders)
    conversion_trend: number[]
  }
  returns: {
    return_rate: number // Доля возвратов
    return_amount: number
    return_units: number
  }
  wallet_share: {
    wallet_percentage: number // Доля кошельков vs карты/налич
    payment_mix: { [key: string]: number }
  }
  channels: {
    channel_mix: { [key: string]: number }
    top_channels: Array<{ channel: string; revenue: number; orders: number }>
  }
  geography: {
    regions: Array<{ region: string; revenue: number; orders: number }>
    districts: Array<{ district: string; revenue: number; orders: number }>
  }
  seasonality: {
    holiday_effect: number // Эффект праздников/выходных
    weekend_vs_weekday: { weekend: number; weekday: number }
    daily_patterns: Array<{ day: string; orders: number; revenue: number }>
  }
}

export interface InsightAnalysis {
  insights: Array<{
    id: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    evidence: string
    business_action: string
    quantitative_effect?: string
  }>
  trends: Array<{
    metric: string
    direction: 'up' | 'down' | 'stable'
    change_percent: number
    period: string
  }>
}

class AnalyticsService {
  private static instance: AnalyticsService

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * CORE KPI CALCULATIONS
   * Формулы для обязательных KPI согласно ТЗ
   */
  async getDashboardKPIs(dateRange?: { start: string; end: string }): Promise<DashboardKPIs> {
    try {
      const response = await fetch('/api/advanced-analytics/dashboard-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get dashboard KPIs')
      }

      return result.data
    } catch (error) {
      console.error('Error calculating dashboard KPIs:', error)
      throw error
    }
  }

  /**
   * EXPLORATORY DATA ANALYSIS & INSIGHTS
   * Generates ≥3 non-obvious insights with evidence
   */
  async getBusinessInsights(): Promise<InsightAnalysis> {
    try {
      const response = await fetch('/api/advanced-analytics/business-insights')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get business insights')
      }

      return result.data
    } catch (error) {
      console.error('Error generating business insights:', error)
      return { insights: [], trends: [] }
    }
  }

  /**
   * Time-series analysis for trend identification
   */
  async getTimeSeries(
    metric: string,
    granularity: 'day' | 'week' | 'month' = 'day',
    days: number = 30,
  ) {
    try {
      const response = await fetch('/api/advanced-analytics/time-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, granularity, days }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get time series data')
      }

      return { rows: result.data }
    } catch (error) {
      console.error('Error getting time series data:', error)
      return { rows: [] }
    }
  }

  /**
   * Cohort analysis for customer retention
   */
  async getCohortAnalysis() {
    return await dbService.executeQuery(`
      WITH customer_cohorts AS (
        SELECT 
          customer_id,
          DATE_TRUNC('month', MIN(order_date)) as cohort_month,
          DATE_TRUNC('month', order_date) as order_month
        FROM orders
        GROUP BY customer_id, DATE_TRUNC('month', order_date)
      ),
      cohort_sizes AS (
        SELECT 
          cohort_month,
          COUNT(DISTINCT customer_id) as cohort_size
        FROM customer_cohorts
        GROUP BY cohort_month
      ),
      cohort_table AS (
        SELECT 
          c.cohort_month,
          c.order_month,
          COUNT(DISTINCT c.customer_id) as active_customers,
          cs.cohort_size,
          ROUND(COUNT(DISTINCT c.customer_id) * 100.0 / cs.cohort_size, 2) as retention_rate,
          EXTRACT(month FROM age(c.order_month, c.cohort_month)) as period_number
        FROM customer_cohorts c
        JOIN cohort_sizes cs ON c.cohort_month = cs.cohort_month
        GROUP BY c.cohort_month, c.order_month, cs.cohort_size
        ORDER BY c.cohort_month, c.order_month
      )
      SELECT 
        TO_CHAR(cohort_month, 'YYYY-MM') as cohort,
        period_number,
        retention_rate,
        cohort_size
      FROM cohort_table
      WHERE cohort_month >= CURRENT_DATE - INTERVAL '12 months'
    `)
  }
}

export const analyticsService = AnalyticsService.getInstance()
