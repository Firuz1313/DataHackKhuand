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
    gross_revenue: number          // Валовая выручка
    net_paid_revenue: number       // Оплаченная выручка (Net Paid)
    revenue_growth: number
  }
  aov: {
    average_order_value: number    // AOV - средняя стоимость заказа
    aov_growth: number
    aov_by_channel: { [key: string]: number }
  }
  conversion: {
    payment_conversion: number     // Конверсия оплаты (paid/total orders)
    conversion_trend: number[]
  }
  returns: {
    return_rate: number           // Доля возвратов
    return_amount: number
    return_units: number
  }
  wallet_share: {
    wallet_percentage: number     // Доля кошельков vs карты/налич
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
    holiday_effect: number        // Эффект праздников/выходных
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
      const whereClause = dateRange 
        ? `WHERE o.order_date >= '${dateRange.start}' AND o.order_date <= '${dateRange.end}'`
        : 'WHERE o.order_date >= CURRENT_DATE - INTERVAL \'30 days\''

      // 1. ORDERS KPI
      const ordersKPI = await dbService.executeQuery(`
        WITH current_period AS (
          SELECT 
            COUNT(*) as total_orders,
            COUNT(*) / 30.0 as avg_orders_per_day
          FROM orders o
          ${whereClause}
        ),
        previous_period AS (
          SELECT COUNT(*) as prev_orders
          FROM orders o
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '60 days' 
            AND o.order_date < CURRENT_DATE - INTERVAL '30 days'
        )
        SELECT 
          c.total_orders,
          c.avg_orders_per_day,
          ROUND(((c.total_orders - p.prev_orders) * 100.0 / NULLIF(p.prev_orders, 0)), 2) as orders_growth
        FROM current_period c, previous_period p
      `)

      // 2. UNITS KPI  
      const unitsKPI = await dbService.executeQuery(`
        WITH current_units AS (
          SELECT 
            COALESCE(SUM(oi.quantity), 0) as total_units
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          ${whereClause}
        ),
        previous_units AS (
          SELECT COALESCE(SUM(oi.quantity), 0) as prev_units
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '60 days' 
            AND o.order_date < CURRENT_DATE - INTERVAL '30 days'
        ),
        avg_units AS (
          SELECT AVG(order_units) as avg_units_per_order
          FROM (
            SELECT SUM(oi.quantity) as order_units
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            ${whereClause}
            GROUP BY o.id
          ) subq
        )
        SELECT 
          c.total_units,
          ROUND(((c.total_units - p.prev_units) * 100.0 / NULLIF(p.prev_units, 0)), 2) as units_growth,
          ROUND(a.avg_units_per_order, 2) as avg_units_per_order
        FROM current_units c, previous_units p, avg_units a
      `)

      // 3. REVENUE KPI (Gross + Net Paid)
      const revenueKPI = await dbService.executeQuery(`
        WITH current_revenue AS (
          SELECT 
            COALESCE(SUM(o.total_amount), 0) as gross_revenue,
            COALESCE(SUM(CASE WHEN p.status = 'paid' OR o.payment_status = 'paid' 
                         THEN o.total_amount ELSE 0 END), 0) as net_paid_revenue
          FROM orders o
          LEFT JOIN payments p ON o.id = p.order_id
          ${whereClause}
        ),
        previous_revenue AS (
          SELECT COALESCE(SUM(o.total_amount), 0) as prev_revenue
          FROM orders o
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '60 days' 
            AND o.order_date < CURRENT_DATE - INTERVAL '30 days'
        )
        SELECT 
          c.gross_revenue,
          c.net_paid_revenue,
          ROUND(((c.gross_revenue - p.prev_revenue) * 100.0 / NULLIF(p.prev_revenue, 0)), 2) as revenue_growth
        FROM current_revenue c, previous_revenue p
      `)

      // 4. AOV (Average Order Value)
      const aovKPI = await dbService.executeQuery(`
        WITH current_aov AS (
          SELECT 
            ROUND(AVG(o.total_amount), 2) as average_order_value
          FROM orders o
          ${whereClause}
        ),
        previous_aov AS (
          SELECT AVG(o.total_amount) as prev_aov
          FROM orders o
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '60 days' 
            AND o.order_date < CURRENT_DATE - INTERVAL '30 days'
        ),
        aov_by_channel AS (
          SELECT 
            COALESCE(o.source, 'Unknown') as channel,
            ROUND(AVG(o.total_amount), 2) as avg_value
          FROM orders o
          ${whereClause}
          GROUP BY o.source
        )
        SELECT 
          c.average_order_value,
          ROUND(((c.average_order_value - p.prev_aov) * 100.0 / NULLIF(p.prev_aov, 0)), 2) as aov_growth,
          json_object_agg(ch.channel, ch.avg_value) as aov_by_channel
        FROM current_aov c, previous_aov p, aov_by_channel ch
        GROUP BY c.average_order_value, p.prev_aov
      `)

      // 5. PAYMENT CONVERSION 
      const conversionKPI = await dbService.executeQuery(`
        SELECT 
          ROUND(
            (COUNT(*) FILTER (WHERE p.status = 'paid' OR o.payment_status = 'paid') * 100.0 / 
             NULLIF(COUNT(*), 0)), 2
          ) as payment_conversion
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        ${whereClause}
      `)

      // 6. RETURNS RATE
      const returnsKPI = await dbService.executeQuery(`
        WITH returns_data AS (
          SELECT 
            COUNT(*) FILTER (WHERE o.status = 'returned') as return_orders,
            COUNT(*) as total_orders,
            COALESCE(SUM(CASE WHEN o.status = 'returned' THEN o.total_amount ELSE 0 END), 0) as return_amount,
            COALESCE(SUM(CASE WHEN o.status = 'returned' THEN oi.quantity ELSE 0 END), 0) as return_units
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          ${whereClause}
        )
        SELECT 
          ROUND((return_orders * 100.0 / NULLIF(total_orders, 0)), 2) as return_rate,
          return_amount,
          return_units
        FROM returns_data
      `)

      // 7. WALLET SHARE & PAYMENT MIX
      const walletKPI = await dbService.executeQuery(`
        WITH payment_stats AS (
          SELECT 
            COALESCE(pm.method_name, o.payment_method, 'Unknown') as payment_method,
            COUNT(*) as payment_count,
            SUM(o.total_amount) as payment_revenue
          FROM orders o
          LEFT JOIN payments p ON o.id = p.order_id
          LEFT JOIN dim_payment_methods pm ON p.payment_method_id = pm.id
          ${whereClause}
          GROUP BY COALESCE(pm.method_name, o.payment_method, 'Unknown')
        ),
        total_stats AS (
          SELECT SUM(payment_count) as total_payments FROM payment_stats
        )
        SELECT 
          ROUND(
            (SUM(CASE WHEN payment_method ILIKE '%кошел%' OR payment_method ILIKE '%wallet%' 
                     THEN payment_count ELSE 0 END) * 100.0 / 
             NULLIF(SUM(payment_count), 0)), 2
          ) as wallet_percentage,
          json_object_agg(payment_method, 
            ROUND((payment_count * 100.0 / t.total_payments), 2)
          ) as payment_mix
        FROM payment_stats, total_stats t
        GROUP BY t.total_payments
      `)

      // 8. CHANNEL MIX
      const channelKPI = await dbService.executeQuery(`
        WITH channel_stats AS (
          SELECT 
            COALESCE(o.source, 'Direct') as channel,
            COUNT(*) as orders,
            SUM(o.total_amount) as revenue
          FROM orders o
          ${whereClause}
          GROUP BY o.source
          ORDER BY revenue DESC
        ),
        total_revenue AS (
          SELECT SUM(revenue) as total FROM channel_stats
        )
        SELECT 
          json_object_agg(channel, 
            ROUND((revenue * 100.0 / t.total), 2)
          ) as channel_mix,
          json_agg(
            json_build_object(
              'channel', channel,
              'revenue', revenue,
              'orders', orders
            ) ORDER BY revenue DESC
          ) FILTER (WHERE revenue > 0) as top_channels
        FROM channel_stats, total_revenue t
        GROUP BY t.total
      `)

      // 9. GEOGRAPHY ANALYSIS
      const geoKPI = await dbService.executeQuery(`
        WITH region_stats AS (
          SELECT 
            COALESCE(r.region_name, 'Unknown') as region,
            COUNT(o.id) as orders,
            SUM(o.total_amount) as revenue
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN dim_regions r ON (c.address->>'region_id')::int = r.id
          ${whereClause}
          GROUP BY r.region_name
          ORDER BY revenue DESC NULLS LAST
        ),
        district_stats AS (
          SELECT 
            COALESCE(d.district_name, 'Unknown') as district,
            COUNT(o.id) as orders,
            SUM(o.total_amount) as revenue
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN dim_districts d ON (c.address->>'district_id')::int = d.id
          ${whereClause}
          GROUP BY d.district_name
          ORDER BY revenue DESC NULLS LAST
        )
        SELECT 
          (SELECT json_agg(json_build_object('region', region, 'revenue', revenue, 'orders', orders)) 
           FROM region_stats WHERE revenue > 0 LIMIT 10) as regions,
          (SELECT json_agg(json_build_object('district', district, 'revenue', revenue, 'orders', orders)) 
           FROM district_stats WHERE revenue > 0 LIMIT 10) as districts
      `)

      // 10. SEASONALITY & HOLIDAY EFFECTS
      const seasonalityKPI = await dbService.executeQuery(`
        WITH daily_stats AS (
          SELECT 
            EXTRACT(DOW FROM o.order_date) as day_of_week,
            TO_CHAR(o.order_date, 'Day') as day_name,
            COUNT(*) as orders,
            SUM(o.total_amount) as revenue,
            CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN 'weekend' ELSE 'weekday' END as period_type
          FROM orders o
          ${whereClause}
          GROUP BY EXTRACT(DOW FROM o.order_date), TO_CHAR(o.order_date, 'Day')
          ORDER BY day_of_week
        ),
        weekend_effect AS (
          SELECT 
            period_type,
            AVG(orders) as avg_orders,
            AVG(revenue) as avg_revenue
          FROM daily_stats
          GROUP BY period_type
        )
        SELECT 
          ROUND(
            ((SELECT avg_orders FROM weekend_effect WHERE period_type = 'weekend') - 
             (SELECT avg_orders FROM weekend_effect WHERE period_type = 'weekday')) * 100.0 /
            NULLIF((SELECT avg_orders FROM weekend_effect WHERE period_type = 'weekday'), 0), 2
          ) as holiday_effect,
          json_object_agg(period_type, avg_orders) as weekend_vs_weekday,
          json_agg(json_build_object('day', day_name, 'orders', orders, 'revenue', revenue)) as daily_patterns
        FROM weekend_effect, daily_stats
        GROUP BY daily_stats.day_of_week
      `)

      // Assemble final KPI structure
      return {
        orders: ordersKPI.rows[0] || { total_orders: 0, orders_growth: 0, avg_orders_per_day: 0 },
        units: unitsKPI.rows[0] || { total_units: 0, units_growth: 0, avg_units_per_order: 0 },
        revenue: revenueKPI.rows[0] || { gross_revenue: 0, net_paid_revenue: 0, revenue_growth: 0 },
        aov: aovKPI.rows[0] || { average_order_value: 0, aov_growth: 0, aov_by_channel: {} },
        conversion: conversionKPI.rows[0] || { payment_conversion: 0, conversion_trend: [] },
        returns: returnsKPI.rows[0] || { return_rate: 0, return_amount: 0, return_units: 0 },
        wallet_share: walletKPI.rows[0] || { wallet_percentage: 0, payment_mix: {} },
        channels: channelKPI.rows[0] || { channel_mix: {}, top_channels: [] },
        geography: geoKPI.rows[0] || { regions: [], districts: [] },
        seasonality: seasonalityKPI.rows[0] || { holiday_effect: 0, weekend_vs_weekday: {}, daily_patterns: [] }
      }
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
      // Advanced analytics queries for insights discovery
      const insights = await dbService.executeQuery(`
        WITH 
        -- Customer behavior patterns
        customer_segments AS (
          SELECT 
            CASE 
              WHEN total_spent >= 100000 THEN 'VIP'
              WHEN total_spent >= 50000 THEN 'Premium' 
              WHEN total_spent >= 10000 THEN 'Regular'
              ELSE 'New'
            END as segment,
            COUNT(*) as customers,
            AVG(total_spent) as avg_spent,
            AVG(total_orders) as avg_orders
          FROM customers 
          WHERE status = 'active'
          GROUP BY segment
        ),
        -- Product performance anomalies
        product_insights AS (
          SELECT 
            p.name,
            p.selling_price,
            COALESCE(SUM(oi.quantity), 0) as units_sold,
            COALESCE(SUM(oi.line_total), 0) as revenue,
            (p.selling_price - p.purchase_price) / p.selling_price * 100 as margin_percent
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
          GROUP BY p.id, p.name, p.selling_price, p.purchase_price
          HAVING COALESCE(SUM(oi.quantity), 0) > 0
          ORDER BY revenue DESC
        ),
        -- Payment method effectiveness
        payment_analysis AS (
          SELECT 
            COALESCE(pm.method_name, o.payment_method, 'Unknown') as payment_method,
            COUNT(*) as orders,
            AVG(o.total_amount) as avg_order_value,
            COUNT(*) FILTER (WHERE p.status = 'paid' OR o.payment_status = 'paid') * 100.0 / COUNT(*) as success_rate
          FROM orders o
          LEFT JOIN payments p ON o.id = p.order_id  
          LEFT JOIN dim_payment_methods pm ON p.payment_method_id = pm.id
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY COALESCE(pm.method_name, o.payment_method, 'Unknown')
          HAVING COUNT(*) >= 10
        )
        SELECT 
          'Customer Concentration Risk' as insight_title,
          'VIP customers (' || cs.customers || ') represent ' || 
          ROUND((cs.customers * 100.0 / (SELECT SUM(customers) FROM customer_segments)), 1) || 
          '% of customers but drive ' || ROUND((cs.avg_spent * cs.customers * 100.0 / 
          (SELECT SUM(avg_spent * customers) FROM customer_segments)), 1) || '% of revenue' as insight_description,
          'High customer concentration increases revenue risk if VIP customers churn' as business_impact,
          'Implement VIP retention program and diversify customer base in Regular segment' as recommended_action
        FROM customer_segments cs WHERE cs.segment = 'VIP'
        
        UNION ALL
        
        SELECT 
          'Payment Method Optimization',
          method_name || ' has ' || ROUND(success_rate, 1) || '% success rate with ' || 
          ROUND(avg_order_value, 0) || ' RUB AOV (' || orders || ' orders)',
          CASE WHEN success_rate < 80 THEN 'Low conversion reducing revenue'
               WHEN avg_order_value > 50000 THEN 'High-value channel driving growth'
               ELSE 'Stable payment channel' END,
          CASE WHEN success_rate < 80 THEN 'Fix payment processing issues for ' || method_name
               WHEN avg_order_value > 50000 THEN 'Promote ' || method_name || ' for large orders'
               ELSE 'Monitor and maintain current performance' END
        FROM (
          SELECT *, ROW_NUMBER() OVER (ORDER BY success_rate DESC) as rn 
          FROM payment_analysis
        ) ranked WHERE rn <= 3
        
        UNION ALL
        
        SELECT 
          'Product Margin vs Volume Trade-off',
          name || ': ' || ROUND(margin_percent, 1) || '% margin, ' || units_sold || ' units sold',
          CASE WHEN margin_percent > 50 AND units_sold < 10 THEN 'High-margin but low-volume product'
               WHEN margin_percent < 30 AND units_sold > 100 THEN 'Low-margin but high-volume product'
               ELSE 'Balanced margin-volume product' END,
          CASE WHEN margin_percent > 50 AND units_sold < 10 THEN 'Increase marketing for high-margin products'
               WHEN margin_percent < 30 AND units_sold > 100 THEN 'Review pricing or costs for volume products'
               ELSE 'Maintain current strategy' END
        FROM (
          SELECT *, ROW_NUMBER() OVER (ORDER BY 
            CASE WHEN margin_percent > 50 AND units_sold < 10 THEN 1
                 WHEN margin_percent < 30 AND units_sold > 100 THEN 2
                 ELSE 3 END
          ) as priority_rank
          FROM product_insights
        ) prioritized WHERE priority_rank <= 2
      `)

      const trends = await dbService.executeQuery(`
        WITH monthly_trends AS (
          SELECT 
            DATE_TRUNC('month', o.order_date) as month,
            COUNT(*) as orders,
            SUM(o.total_amount) as revenue,
            AVG(o.total_amount) as aov
          FROM orders o
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', o.order_date)
          ORDER BY month
        ),
        trend_analysis AS (
          SELECT 
            'Orders' as metric,
            CASE WHEN LAG(orders) OVER (ORDER BY month) IS NOT NULL THEN
              ROUND(((orders - LAG(orders) OVER (ORDER BY month)) * 100.0 / 
              NULLIF(LAG(orders) OVER (ORDER BY month), 0)), 2)
              ELSE 0 END as change_percent,
            '30 days' as period
          FROM monthly_trends
          WHERE month = (SELECT MAX(month) FROM monthly_trends)
        )
        SELECT * FROM trend_analysis WHERE change_percent IS NOT NULL
      `)

      return {
        insights: insights.rows.map((row, index) => ({
          id: `insight_${index + 1}`,
          title: row.insight_title,
          description: row.insight_description,
          impact: index === 0 ? 'high' : 'medium',
          evidence: row.insight_description,
          business_action: row.recommended_action,
          quantitative_effect: row.business_impact
        })),
        trends: trends.rows.map(row => ({
          metric: row.metric,
          direction: row.change_percent > 0 ? 'up' : row.change_percent < 0 ? 'down' : 'stable',
          change_percent: row.change_percent,
          period: row.period
        }))
      }
    } catch (error) {
      console.error('Error generating business insights:', error)
      return { insights: [], trends: [] }
    }
  }

  /**
   * Time-series analysis for trend identification
   */
  async getTimeSeries(metric: string, granularity: 'day' | 'week' | 'month' = 'day', days: number = 30) {
    const dateFormat = granularity === 'day' ? 'YYYY-MM-DD' : 
                      granularity === 'week' ? 'YYYY-"W"WW' : 'YYYY-MM'
    
    return await dbService.executeQuery(`
      SELECT 
        TO_CHAR(o.order_date, '${dateFormat}') as period,
        COUNT(*) as orders,
        SUM(o.total_amount) as revenue,
        AVG(o.total_amount) as aov,
        COUNT(DISTINCT o.customer_id) as unique_customers
      FROM orders o
      WHERE o.order_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY TO_CHAR(o.order_date, '${dateFormat}')
      ORDER BY period
    `)
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
