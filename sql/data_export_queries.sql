-- ====================================
-- DATA EXPORT QUERIES - DATABOARD ANALYTICS
-- Parameterized SQL queries for exporting clean data
-- ====================================

-- Parameters:
-- :start_date - Export data from this date (e.g., '2024-01-01')
-- :end_date - Export data until this date (e.g., '2024-12-31')
-- :limit - Maximum records to export (e.g., 10000)
-- :customer_tier - Customer segment filter ('VIP', 'Premium', 'Regular', 'ALL')
-- :channel - Channel filter ('web', 'mobile', 'whatsapp', 'ALL')
-- :region_id - Geographic region filter (1, 2, 3, or 'ALL')
-- :format - Export format ('CSV', 'JSON', 'PARQUET')

-- ====================================
-- 1. ORDERS EXPORT - CLEAN DATASET
-- ====================================

-- Complete orders dataset with all relationships
SELECT 
    o.order_id,
    o.customer_id,
    c.gender as customer_gender,
    c.age as customer_age,
    o.order_date,
    o.channel,
    pm.method_name as payment_method,
    dr.region_name,
    dd.district_name,
    
    -- Order metrics
    COUNT(oi.product_id) as line_items_count,
    SUM(oi.quantity) as total_units,
    SUM(oi.quantity * oi.price_per_item) as order_total,
    AVG(oi.price_per_item) as avg_item_price,
    
    -- Payment information
    p.status_raw as payment_status,
    p.paid_amount,
    p.payment_date,
    
    -- Calculated fields
    CASE 
        WHEN p.status_raw = 'paid' THEN 'Yes'
        ELSE 'No'
    END as is_paid,
    
    CASE EXTRACT(DOW FROM o.order_date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_of_week,
    
    CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) 
        THEN 'Weekend' 
        ELSE 'Weekday' 
    END as weekend_flag,
    
    -- Customer tier
    CASE 
        WHEN SUM(oi.quantity * oi.price_per_item) >= 100000 THEN 'VIP'
        WHEN SUM(oi.quantity * oi.price_per_item) >= 50000 THEN 'Premium'
        WHEN SUM(oi.quantity * oi.price_per_item) >= 10000 THEN 'Regular'
        ELSE 'New'
    END as order_tier

FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN payments p ON o.order_id = p.order_id
LEFT JOIN dim_payment_methods pm ON o.payment_method_id = pm.id
LEFT JOIN dim_regions dr ON c.region_id = dr.id
LEFT JOIN dim_districts dd ON c.district_id = dd.id

WHERE 1=1
    AND (:start_date = 'ALL' OR o.order_date >= :start_date::date)
    AND (:end_date = 'ALL' OR o.order_date <= :end_date::date)
    AND (:channel = 'ALL' OR o.channel = :channel)
    AND (:region_id = 'ALL' OR c.region_id = :region_id::integer)

GROUP BY 
    o.order_id, o.customer_id, c.gender, c.age, o.order_date, 
    o.channel, pm.method_name, dr.region_name, dd.district_name,
    p.status_raw, p.paid_amount, p.payment_date

HAVING (:customer_tier = 'ALL' OR 
        CASE 
            WHEN SUM(oi.quantity * oi.price_per_item) >= 100000 THEN 'VIP'
            WHEN SUM(oi.quantity * oi.price_per_item) >= 50000 THEN 'Premium'
            WHEN SUM(oi.quantity * oi.price_per_item) >= 10000 THEN 'Regular'
            ELSE 'New'
        END = :customer_tier)

ORDER BY o.order_date DESC, o.order_id
LIMIT :limit::integer;

-- ====================================
-- 2. ORDER ITEMS EXPORT - PRODUCT ANALYSIS
-- ====================================

-- Detailed line items with product information
SELECT 
    oi.order_id,
    oi.product_id,
    p.product_name,
    p.category_name,
    p.supplier_name,
    oi.quantity,
    oi.price_per_item,
    oi.quantity * oi.price_per_item as line_total,
    
    -- Order context
    o.order_date,
    o.channel,
    o.customer_id,
    c.region_id,
    
    -- Product metrics
    p.current_price,
    ROUND(((oi.price_per_item - p.current_price) / p.current_price * 100), 2) as price_change_percent,
    
    -- Customer context
    CASE 
        WHEN c.age <= 25 THEN '18-25'
        WHEN c.age <= 35 THEN '26-35'
        WHEN c.age <= 45 THEN '36-45'
        WHEN c.age <= 55 THEN '46-55'
        ELSE '55+'
    END as customer_age_group,
    
    c.gender as customer_gender,
    
    -- Time dimensions
    EXTRACT(YEAR FROM o.order_date) as order_year,
    EXTRACT(MONTH FROM o.order_date) as order_month,
    EXTRACT(DAY FROM o.order_date) as order_day,
    EXTRACT(QUARTER FROM o.order_date) as order_quarter

FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN (
    -- Product details subquery
    SELECT 
        product_id,
        'Product_' || product_id as product_name,
        'Category_' || (product_id % 10 + 1) as category_name,
        'Supplier_' || (product_id % 5 + 1) as supplier_name,
        25.99 + (product_id % 100) as current_price
    FROM (SELECT DISTINCT product_id FROM order_items) pd
) p ON oi.product_id = p.product_id

WHERE 1=1
    AND (:start_date = 'ALL' OR o.order_date >= :start_date::date)
    AND (:end_date = 'ALL' OR o.order_date <= :end_date::date)
    AND (:channel = 'ALL' OR o.channel = :channel)

ORDER BY o.order_date DESC, oi.order_id, oi.product_id
LIMIT :limit::integer;

-- ====================================
-- 3. CUSTOMERS EXPORT - SEGMENTATION READY
-- ====================================

-- Customer master data with calculated metrics
SELECT 
    c.customer_id,
    c.gender,
    c.age,
    r.region_name,
    d.district_name,
    
    -- Customer lifetime metrics
    COUNT(DISTINCT o.order_id) as total_orders,
    SUM(oi.quantity) as total_units_purchased,
    SUM(oi.quantity * oi.price_per_item) as total_spent,
    ROUND(AVG(oi.quantity * oi.price_per_item), 2) as avg_order_value,
    
    -- Recency metrics
    MIN(o.order_date) as first_order_date,
    MAX(o.order_date) as last_order_date,
    CURRENT_DATE - MAX(o.order_date)::date as days_since_last_order,
    
    -- Frequency metrics
    ROUND(
        COUNT(DISTINCT o.order_id)::decimal / 
        GREATEST(EXTRACT(DAY FROM (MAX(o.order_date) - MIN(o.order_date))), 1) * 30, 2
    ) as avg_orders_per_month,
    
    -- Customer tier
    CASE 
        WHEN SUM(oi.quantity * oi.price_per_item) >= 100000 THEN 'VIP'
        WHEN SUM(oi.quantity * oi.price_per_item) >= 50000 THEN 'Premium'
        WHEN SUM(oi.quantity * oi.price_per_item) >= 10000 THEN 'Regular'
        ELSE 'New'
    END as customer_tier,
    
    -- Channel preferences
    MODE() WITHIN GROUP (ORDER BY o.channel) as preferred_channel,
    COUNT(DISTINCT o.channel) as channels_used,
    
    -- Payment behavior
    ROUND(
        COUNT(CASE WHEN p.status_raw = 'paid' THEN 1 END) * 100.0 / 
        COUNT(DISTINCT o.order_id), 2
    ) as payment_success_rate,
    
    -- Seasonal behavior
    MODE() WITHIN GROUP (ORDER BY EXTRACT(MONTH FROM o.order_date)) as most_active_month,
    
    -- Geographic mobility
    COUNT(DISTINCT COALESCE(c.district_id, 0)) as districts_used

FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN payments p ON o.order_id = p.order_id
LEFT JOIN dim_regions r ON c.region_id = r.id
LEFT JOIN dim_districts d ON c.district_id = d.id

WHERE 1=1
    AND (:start_date = 'ALL' OR o.order_date >= :start_date::date OR o.order_date IS NULL)
    AND (:end_date = 'ALL' OR o.order_date <= :end_date::date OR o.order_date IS NULL)

GROUP BY c.customer_id, c.gender, c.age, r.region_name, d.district_name

HAVING (:customer_tier = 'ALL' OR 
        CASE 
            WHEN SUM(oi.quantity * oi.price_per_item) >= 100000 THEN 'VIP'
            WHEN SUM(oi.quantity * oi.price_per_item) >= 50000 THEN 'Premium'
            WHEN SUM(oi.quantity * oi.price_per_item) >= 10000 THEN 'Regular'
            ELSE 'New'
        END = :customer_tier)

ORDER BY total_spent DESC NULLS LAST, c.customer_id
LIMIT :limit::integer;

-- ====================================
-- 4. PAYMENTS EXPORT - FINANCIAL ANALYSIS
-- ====================================

-- Payment transactions with order context
SELECT 
    p.order_id,
    p.attempt,
    p.status_raw as payment_status,
    p.paid_amount,
    p.payment_date,
    pm.method_name as payment_method,
    pm.method_type as payment_category,
    
    -- Order context
    o.order_date,
    o.customer_id,
    o.channel,
    SUM(oi.quantity * oi.price_per_item) as order_total,
    
    -- Payment analysis
    ROUND(p.paid_amount / NULLIF(SUM(oi.quantity * oi.price_per_item), 0) * 100, 2) as payment_percentage,
    
    CASE WHEN p.paid_amount >= SUM(oi.quantity * oi.price_per_item) 
        THEN 'Full Payment'
        WHEN p.paid_amount > 0 
        THEN 'Partial Payment'
        ELSE 'No Payment'
    END as payment_completeness,
    
    -- Timing analysis
    EXTRACT(EPOCH FROM (p.payment_date - o.order_date))/3600 as hours_to_payment,
    
    CASE 
        WHEN p.payment_date - o.order_date < INTERVAL '1 hour' THEN 'Immediate'
        WHEN p.payment_date - o.order_date < INTERVAL '1 day' THEN 'Same Day'
        WHEN p.payment_date - o.order_date < INTERVAL '7 days' THEN 'Within Week'
        ELSE 'Delayed'
    END as payment_timing,
    
    -- Customer context
    c.age as customer_age,
    c.gender as customer_gender,
    r.region_name

FROM payments p
JOIN orders o ON p.order_id = o.order_id
JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN dim_payment_methods pm ON p.payment_method_id = pm.id
LEFT JOIN dim_regions r ON c.region_id = r.id

WHERE 1=1
    AND (:start_date = 'ALL' OR o.order_date >= :start_date::date)
    AND (:end_date = 'ALL' OR o.order_date <= :end_date::date)
    AND (:channel = 'ALL' OR o.channel = :channel)

GROUP BY p.order_id, p.attempt, p.status_raw, p.paid_amount, p.payment_date,
         pm.method_name, pm.method_type, o.order_date, o.customer_id, o.channel,
         c.age, c.gender, r.region_name

ORDER BY o.order_date DESC, p.order_id, p.attempt
LIMIT :limit::integer;

-- ====================================
-- 5. KPI SUMMARY EXPORT - DASHBOARD DATA
-- ====================================

-- Pre-calculated KPI metrics for dashboard consumption
WITH date_spine AS (
    SELECT generate_series(
        COALESCE(:start_date::date, '2024-01-01'::date),
        COALESCE(:end_date::date, CURRENT_DATE),
        '1 day'::interval
    )::date as report_date
),

daily_metrics AS (
    SELECT 
        o.order_date::date as report_date,
        COUNT(DISTINCT o.order_id) as orders,
        SUM(oi.quantity) as units,
        SUM(oi.quantity * oi.price_per_item) as gross_revenue,
        SUM(CASE WHEN p.status_raw = 'paid' THEN p.paid_amount ELSE 0 END) as net_paid_revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        COUNT(CASE WHEN p.status_raw = 'paid' THEN 1 END) as paid_orders,
        
        -- Channel breakdown
        COUNT(CASE WHEN o.channel = 'web' THEN 1 END) as web_orders,
        COUNT(CASE WHEN o.channel = 'mobile' THEN 1 END) as mobile_orders,
        COUNT(CASE WHEN o.channel = 'whatsapp' THEN 1 END) as whatsapp_orders,
        COUNT(CASE WHEN o.channel = 'telegram' THEN 1 END) as telegram_orders,
        COUNT(CASE WHEN o.channel = 'instagram' THEN 1 END) as instagram_orders,
        
        -- Weekend/weekday split
        COUNT(CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0,6) THEN 1 END) as weekend_orders,
        COUNT(CASE WHEN EXTRACT(DOW FROM o.order_date) NOT IN (0,6) THEN 1 END) as weekday_orders
        
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    
    WHERE 1=1
        AND (:start_date = 'ALL' OR o.order_date >= :start_date::date)
        AND (:end_date = 'ALL' OR o.order_date <= :end_date::date)
        AND (:channel = 'ALL' OR o.channel = :channel)
        AND (:region_id = 'ALL' OR c.region_id = :region_id::integer)
    
    GROUP BY o.order_date::date
)

SELECT 
    ds.report_date,
    EXTRACT(YEAR FROM ds.report_date) as year,
    EXTRACT(MONTH FROM ds.report_date) as month,
    EXTRACT(DAY FROM ds.report_date) as day,
    EXTRACT(DOW FROM ds.report_date) as day_of_week,
    EXTRACT(QUARTER FROM ds.report_date) as quarter,
    
    -- Core KPIs
    COALESCE(dm.orders, 0) as orders,
    COALESCE(dm.units, 0) as units,
    COALESCE(dm.gross_revenue, 0) as gross_revenue,
    COALESCE(dm.net_paid_revenue, 0) as net_paid_revenue,
    COALESCE(dm.unique_customers, 0) as unique_customers,
    COALESCE(dm.paid_orders, 0) as paid_orders,
    
    -- Calculated KPIs
    ROUND(COALESCE(dm.gross_revenue, 0) / NULLIF(dm.orders, 0), 2) as aov,
    ROUND(COALESCE(dm.units, 0) / NULLIF(dm.orders, 0), 2) as units_per_order,
    ROUND(COALESCE(dm.paid_orders, 0) * 100.0 / NULLIF(dm.orders, 0), 2) as payment_conversion_rate,
    
    -- Channel metrics
    COALESCE(dm.web_orders, 0) as web_orders,
    COALESCE(dm.mobile_orders, 0) as mobile_orders,
    COALESCE(dm.whatsapp_orders, 0) as whatsapp_orders,
    COALESCE(dm.telegram_orders, 0) as telegram_orders,
    COALESCE(dm.instagram_orders, 0) as instagram_orders,
    
    -- Temporal metrics
    COALESCE(dm.weekend_orders, 0) as weekend_orders,
    COALESCE(dm.weekday_orders, 0) as weekday_orders,
    
    -- 7-day moving averages
    ROUND(AVG(dm.orders) OVER (ORDER BY ds.report_date ROWS 6 PRECEDING), 1) as orders_7day_avg,
    ROUND(AVG(dm.gross_revenue) OVER (ORDER BY ds.report_date ROWS 6 PRECEDING), 2) as revenue_7day_avg

FROM date_spine ds
LEFT JOIN daily_metrics dm ON ds.report_date = dm.report_date

ORDER BY ds.report_date
LIMIT :limit::integer;

-- ====================================
-- 6. COHORT ANALYSIS EXPORT
-- ====================================

-- Customer cohort data for retention analysis
WITH customer_cohorts AS (
    SELECT 
        c.customer_id,
        DATE_TRUNC('month', MIN(o.order_date)) as cohort_month,
        COUNT(DISTINCT DATE_TRUNC('month', o.order_date)) as active_months,
        SUM(oi.quantity * oi.price_per_item) as total_spent,
        COUNT(DISTINCT o.order_id) as total_orders,
        MAX(o.order_date) as last_order_date
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE (:start_date = 'ALL' OR o.order_date >= :start_date::date)
      AND (:end_date = 'ALL' OR o.order_date <= :end_date::date)
    GROUP BY c.customer_id
),

cohort_sizes AS (
    SELECT 
        cohort_month,
        COUNT(*) as cohort_size,
        AVG(total_spent) as avg_cohort_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spent) as median_cohort_value
    FROM customer_cohorts
    GROUP BY cohort_month
)

SELECT 
    cc.cohort_month,
    cs.cohort_size,
    cs.avg_cohort_value,
    cs.median_cohort_value,
    cc.customer_id,
    cc.active_months,
    cc.total_spent,
    cc.total_orders,
    cc.last_order_date,
    CURRENT_DATE - cc.last_order_date::date as days_since_last_order,
    
    -- Customer lifetime value segments
    CASE 
        WHEN cc.total_spent >= 100000 THEN 'VIP'
        WHEN cc.total_spent >= 50000 THEN 'Premium'
        WHEN cc.total_spent >= 10000 THEN 'Regular'
        ELSE 'New'
    END as customer_tier,
    
    -- Retention classification
    CASE 
        WHEN CURRENT_DATE - cc.last_order_date::date <= 30 THEN 'Active'
        WHEN CURRENT_DATE - cc.last_order_date::date <= 90 THEN 'At Risk'
        WHEN CURRENT_DATE - cc.last_order_date::date <= 180 THEN 'Dormant'
        ELSE 'Churned'
    END as retention_status

FROM customer_cohorts cc
JOIN cohort_sizes cs ON cc.cohort_month = cs.cohort_month

WHERE cc.cohort_month >= DATE_TRUNC('month', COALESCE(:start_date::date, '2024-01-01'::date))

ORDER BY cc.cohort_month, cc.total_spent DESC
LIMIT :limit::integer;

-- ====================================
-- EXAMPLE PARAMETER VALUES FOR TESTING
-- ====================================

/*
-- Full dataset export (last 30 days):
:start_date = '2024-11-01'
:end_date = '2024-11-30'
:limit = 50000
:customer_tier = 'ALL'
:channel = 'ALL'
:region_id = 'ALL'

-- VIP customers only:
:start_date = '2024-01-01'
:end_date = '2024-12-31'
:limit = 10000
:customer_tier = 'VIP'
:channel = 'ALL'
:region_id = 'ALL'

-- Web channel analysis:
:start_date = '2024-01-01'
:end_date = '2024-12-31'
:limit = 25000
:customer_tier = 'ALL'
:channel = 'web'
:region_id = 'ALL'

-- Regional analysis (Moscow region):
:start_date = '2024-01-01'
:end_date = '2024-12-31'
:limit = 15000
:customer_tier = 'ALL'
:channel = 'ALL'
:region_id = '1'
*/
