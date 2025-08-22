-- ====================================
-- PARAMETERIZED KPI CALCULATIONS
-- DataBoard Analytics - SQL Queries
-- ====================================

-- Parameters that can be substituted:
-- :start_date - Start date for analysis period (e.g., '2024-01-01')
-- :end_date - End date for analysis period (e.g., '2024-12-31')
-- :channel - Specific channel filter (e.g., 'web', 'mobile')
-- :region_id - Geographic region filter
-- :customer_segment - Customer tier filter ('VIP', 'Premium', etc.)

-- ====================================
-- 1. ORDERS KPI CALCULATION
-- ====================================

-- Total Orders with Growth Calculation
WITH current_period AS (
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) / GREATEST(EXTRACT(DAY FROM (:end_date::date - :start_date::date)), 1) as avg_orders_per_day,
        :start_date::date as period_start,
        :end_date::date as period_end
    FROM orders o
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
),
previous_period AS (
    SELECT COUNT(*) as prev_orders
    FROM orders o
    WHERE o.order_date >= (:start_date::date - (:end_date::date - :start_date::date))
      AND o.order_date < :start_date::date
)
SELECT 
    c.total_orders,
    c.avg_orders_per_day,
    ROUND(
        CASE WHEN p.prev_orders > 0 
        THEN ((c.total_orders - p.prev_orders) * 100.0 / p.prev_orders)
        ELSE 0 END, 2
    ) as orders_growth_percent,
    c.period_start,
    c.period_end
FROM current_period c, previous_period p;

-- ====================================
-- 2. UNITS SOLD KPI CALCULATION  
-- ====================================

-- Total Units with Average per Order
WITH units_data AS (
    SELECT 
        SUM(oi.quantity) as total_units,
        COUNT(DISTINCT o.order_id) as total_orders,
        AVG(oi.quantity) as avg_units_per_item
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
)
SELECT 
    total_units,
    ROUND(total_units::decimal / NULLIF(total_orders, 0), 2) as avg_units_per_order,
    ROUND(avg_units_per_item, 2) as avg_units_per_line_item,
    total_orders
FROM units_data;

-- ====================================
-- 3. REVENUE KPI CALCULATIONS
-- ====================================

-- Gross Revenue and Net Paid Revenue
WITH revenue_data AS (
    SELECT 
        o.order_id,
        SUM(oi.quantity * oi.price_per_item) as order_total,
        p.status_raw as payment_status,
        p.paid_amount
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY o.order_id, p.status_raw, p.paid_amount
)
SELECT 
    SUM(order_total) as gross_revenue,
    SUM(CASE WHEN payment_status = 'paid' THEN paid_amount ELSE 0 END) as net_paid_revenue,
    ROUND(
        (SUM(CASE WHEN payment_status = 'paid' THEN paid_amount ELSE 0 END) * 100.0 / 
         NULLIF(SUM(order_total), 0)), 2
    ) as payment_collection_rate_percent,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
FROM revenue_data;

-- ====================================
-- 4. AOV (AVERAGE ORDER VALUE) CALCULATION
-- ====================================

-- AOV Overall and by Channel
WITH order_values AS (
    SELECT 
        o.order_id,
        o.channel,
        SUM(oi.quantity * oi.price_per_item) as order_value
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
      AND (:channel = 'ALL' OR o.channel = :channel)
    GROUP BY o.order_id, o.channel
)
SELECT 
    ROUND(AVG(order_value), 2) as average_order_value,
    MIN(order_value) as min_order_value,
    MAX(order_value) as max_order_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY order_value) as median_order_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY order_value) as p95_order_value,
    COUNT(*) as total_orders
FROM order_values;

-- AOV by Channel Breakdown
WITH order_values AS (
    SELECT 
        o.channel,
        SUM(oi.quantity * oi.price_per_item) as order_value
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY o.order_id, o.channel
)
SELECT 
    channel,
    ROUND(AVG(order_value), 2) as avg_order_value,
    COUNT(*) as orders,
    SUM(order_value) as total_revenue,
    ROUND(
        (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2
    ) as orders_percentage
FROM order_values
GROUP BY channel
ORDER BY total_revenue DESC;

-- ====================================
-- 5. PAYMENT CONVERSION ANALYSIS
-- ====================================

-- Payment Success Rate Calculation
WITH payment_analysis AS (
    SELECT 
        o.order_id,
        o.channel,
        o.order_date,
        CASE WHEN p.status_raw = 'paid' THEN 1 ELSE 0 END as is_paid,
        p.status_raw,
        SUM(oi.quantity * oi.price_per_item) as order_value
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY o.order_id, o.channel, o.order_date, p.status_raw
)
SELECT 
    COUNT(*) as total_orders,
    SUM(is_paid) as paid_orders,
    ROUND((SUM(is_paid) * 100.0 / COUNT(*)), 2) as payment_conversion_rate,
    ROUND(AVG(CASE WHEN is_paid = 1 THEN order_value END), 2) as avg_paid_order_value,
    ROUND(AVG(CASE WHEN is_paid = 0 THEN order_value END), 2) as avg_unpaid_order_value
FROM payment_analysis;

-- Payment Conversion by Channel
SELECT 
    channel,
    COUNT(*) as total_orders,
    SUM(is_paid) as paid_orders,
    ROUND((SUM(is_paid) * 100.0 / COUNT(*)), 2) as conversion_rate,
    ROUND(AVG(order_value), 2) as avg_order_value
FROM payment_analysis
GROUP BY channel
ORDER BY conversion_rate DESC;

-- ====================================
-- 6. CHANNEL MIX ANALYSIS
-- ====================================

-- Revenue and Order Distribution by Channel
WITH channel_performance AS (
    SELECT 
        o.channel,
        COUNT(DISTINCT o.order_id) as orders,
        SUM(oi.quantity * oi.price_per_item) as revenue,
        SUM(oi.quantity) as units_sold,
        AVG(oi.quantity * oi.price_per_item) as avg_order_value
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY o.channel
),
total_metrics AS (
    SELECT 
        SUM(orders) as total_orders,
        SUM(revenue) as total_revenue
    FROM channel_performance
)
SELECT 
    cp.channel,
    cp.orders,
    cp.revenue,
    cp.units_sold,
    ROUND(cp.avg_order_value, 2) as avg_order_value,
    ROUND((cp.orders * 100.0 / tm.total_orders), 2) as orders_percentage,
    ROUND((cp.revenue * 100.0 / tm.total_revenue), 2) as revenue_percentage,
    ROUND((cp.revenue / cp.orders), 2) as revenue_per_order
FROM channel_performance cp, total_metrics tm
ORDER BY cp.revenue DESC;

-- ====================================
-- 7. GEOGRAPHIC ANALYSIS
-- ====================================

-- Performance by District/Region
WITH geo_performance AS (
    SELECT 
        CASE 
            WHEN o.order_district_id <= 10 THEN 'Центральный район'
            WHEN o.order_district_id <= 20 THEN 'Северный район'
            WHEN o.order_district_id <= 30 THEN 'Южный район'
            ELSE 'Прочие районы'
        END as district,
        o.order_district_id,
        COUNT(DISTINCT o.order_id) as orders,
        SUM(oi.quantity * oi.price_per_item) as revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY 
        CASE 
            WHEN o.order_district_id <= 10 THEN 'Центральный район'
            WHEN o.order_district_id <= 20 THEN 'Северный район'  
            WHEN o.order_district_id <= 30 THEN 'Южный район'
            ELSE 'Прочие районы'
        END, o.order_district_id
),
total_metrics AS (
    SELECT SUM(revenue) as total_revenue FROM geo_performance
)
SELECT 
    gp.district,
    gp.orders,
    gp.revenue,
    gp.unique_customers,
    ROUND((gp.revenue / gp.orders), 2) as avg_order_value,
    ROUND((gp.revenue * 100.0 / tm.total_revenue), 2) as revenue_percentage,
    ROUND((gp.orders::decimal / gp.unique_customers), 2) as orders_per_customer
FROM geo_performance gp, total_metrics tm
ORDER BY gp.revenue DESC;

-- ====================================
-- 8. SEASONALITY & TIMING ANALYSIS
-- ====================================

-- Daily Patterns Analysis
WITH daily_analysis AS (
    SELECT 
        EXTRACT(DOW FROM o.order_date) as day_of_week,
        CASE EXTRACT(DOW FROM o.order_date)
            WHEN 0 THEN 'Воскресенье'
            WHEN 1 THEN 'Понедельник'
            WHEN 2 THEN 'Вторник'
            WHEN 3 THEN 'Среда'
            WHEN 4 THEN 'Четверг'
            WHEN 5 THEN 'Пятница'
            WHEN 6 THEN 'Суббота'
        END as day_name,
        CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN 'weekend' ELSE 'weekday' END as period_type,
        COUNT(DISTINCT o.order_id) as orders,
        SUM(oi.quantity * oi.price_per_item) as revenue
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY EXTRACT(DOW FROM o.order_date), period_type
)
SELECT 
    day_name,
    orders,
    revenue,
    period_type,
    ROUND((revenue / orders), 2) as avg_order_value,
    ROUND(
        (orders * 100.0 / SUM(orders) OVER()), 2
    ) as orders_percentage
FROM daily_analysis
ORDER BY day_of_week;

-- Weekend vs Weekday Effect
WITH period_analysis AS (
    SELECT 
        CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN 'weekend' ELSE 'weekday' END as period_type,
        COUNT(DISTINCT o.order_id) as orders,
        SUM(oi.quantity * oi.price_per_item) as revenue
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN 'weekend' ELSE 'weekday' END
)
SELECT 
    period_type,
    orders,
    revenue,
    ROUND((revenue / orders), 2) as avg_order_value,
    ROUND(
        CASE 
            WHEN LAG(orders) OVER (ORDER BY period_type) IS NOT NULL 
            THEN ((orders - LAG(orders) OVER (ORDER BY period_type)) * 100.0 / 
                  LAG(orders) OVER (ORDER BY period_type))
            ELSE 0 
        END, 2
    ) as orders_difference_percent
FROM period_analysis
ORDER BY period_type;

-- ====================================
-- 9. CUSTOMER SEGMENTATION ANALYSIS
-- ====================================

-- Customer Tiers and Performance
WITH customer_metrics AS (
    SELECT 
        c.customer_id,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(oi.quantity * oi.price_per_item) as total_spent,
        AVG(oi.quantity * oi.price_per_item) as avg_order_value,
        MIN(o.order_date) as first_order_date,
        MAX(o.order_date) as last_order_date
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY c.customer_id
),
customer_tiers AS (
    SELECT 
        *,
        CASE 
            WHEN total_spent >= 100000 THEN 'VIP'
            WHEN total_spent >= 50000 THEN 'Premium'
            WHEN total_spent >= 10000 THEN 'Regular'
            ELSE 'New'
        END as customer_tier
    FROM customer_metrics
)
SELECT 
    customer_tier,
    COUNT(*) as customers_count,
    ROUND(AVG(total_spent), 2) as avg_spent_per_customer,
    ROUND(AVG(total_orders), 2) as avg_orders_per_customer,
    ROUND(AVG(avg_order_value), 2) as avg_order_value,
    SUM(total_spent) as tier_total_revenue,
    ROUND(
        (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2
    ) as customers_percentage,
    ROUND(
        (SUM(total_spent) * 100.0 / SUM(SUM(total_spent)) OVER()), 2
    ) as revenue_percentage
FROM customer_tiers
GROUP BY customer_tier
ORDER BY 
    CASE customer_tier
        WHEN 'VIP' THEN 1
        WHEN 'Premium' THEN 2
        WHEN 'Regular' THEN 3
        WHEN 'New' THEN 4
    END;

-- ====================================
-- 10. COHORT RETENTION ANALYSIS
-- ====================================

-- Monthly Cohort Analysis
WITH customer_cohorts AS (
    SELECT 
        c.customer_id,
        DATE_TRUNC('month', MIN(o.order_date)) as cohort_month,
        DATE_TRUNC('month', o.order_date) as order_month
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    WHERE o.order_date >= :start_date::date 
      AND o.order_date <= :end_date::date
    GROUP BY c.customer_id, DATE_TRUNC('month', o.order_date)
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
        cc.cohort_month,
        cc.order_month,
        COUNT(DISTINCT cc.customer_id) as active_customers,
        cs.cohort_size,
        ROUND(COUNT(DISTINCT cc.customer_id) * 100.0 / cs.cohort_size, 2) as retention_rate,
        EXTRACT(month FROM age(cc.order_month, cc.cohort_month)) as period_number
    FROM customer_cohorts cc
    JOIN cohort_sizes cs ON cc.cohort_month = cs.cohort_month
    GROUP BY cc.cohort_month, cc.order_month, cs.cohort_size
    ORDER BY cc.cohort_month, cc.order_month
)
SELECT 
    TO_CHAR(cohort_month, 'YYYY-MM') as cohort,
    period_number,
    active_customers,
    cohort_size,
    retention_rate
FROM cohort_table
WHERE cohort_month >= DATE_TRUNC('month', :start_date::date)
ORDER BY cohort_month, period_number;

-- ====================================
-- EXAMPLE PARAMETER VALUES
-- ====================================

/*
-- Example usage with parameters:

-- Last 30 days analysis:
:start_date = '2024-11-01'
:end_date = '2024-11-30'
:channel = 'ALL'
:region_id = 'ALL'
:customer_segment = 'ALL'

-- Specific channel analysis:
:start_date = '2024-01-01'
:end_date = '2024-12-31'
:channel = 'web'
:region_id = 'ALL'
:customer_segment = 'ALL'

-- VIP customer analysis:
:start_date = '2024-01-01'
:end_date = '2024-12-31'
:channel = 'ALL'
:region_id = 'ALL'
:customer_segment = 'VIP'
*/
