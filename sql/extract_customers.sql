-- Выгрузка данных клиентов с метриками активности
-- Параметры: $status_filter, $min_orders, $start_date, $end_date, $limit

WITH customer_metrics AS (
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company_name,
    c.industry,
    c.status,
    c.registration_date,
    c.last_login,
    c.created_at,
    c.updated_at,
    
    -- Метрики заказов
    COALESCE(
      (SELECT COUNT(*) 
       FROM orders o 
       WHERE o.customer_id = c.id), 0
    ) AS total_orders,
    
    COALESCE(
      (SELECT COUNT(*) 
       FROM orders o 
       WHERE o.customer_id = c.id 
         AND o.payment_status = 'paid'), 0
    ) AS paid_orders,
    
    COALESCE(
      (SELECT SUM(
         (SELECT SUM(oi.quantity * oi.unit_price) 
          FROM order_items oi 
          WHERE oi.order_id = o.id)
       )
       FROM orders o 
       WHERE o.customer_id = c.id 
         AND o.payment_status = 'paid'), 0
    ) AS total_spent,
    
    -- Первый и последний заказ
    (SELECT MIN(o.order_date) 
     FROM orders o 
     WHERE o.customer_id = c.id
    ) AS first_order_date,
    
    (SELECT MAX(o.order_date) 
     FROM orders o 
     WHERE o.customer_id = c.id
    ) AS last_order_date,
    
    -- Средний чек
    COALESCE(
      (SELECT AVG(
         (SELECT SUM(oi.quantity * oi.unit_price) 
          FROM order_items oi 
          WHERE oi.order_id = o.id)
       )
       FROM orders o 
       WHERE o.customer_id = c.id 
         AND o.payment_status = 'paid'), 0
    ) AS avg_order_value

  FROM customers c
  WHERE 1=1
    AND ($status_filter IS NULL OR c.status = $status_filter)
    AND ($start_date IS NULL OR c.registration_date >= $start_date::date)
    AND ($end_date IS NULL OR c.registration_date <= $end_date::date)
)

SELECT 
  id,
  name,
  email,
  phone,
  company_name,
  industry,
  status,
  registration_date,
  last_login,
  total_orders,
  paid_orders,
  total_spent,
  first_order_date,
  last_order_date,
  avg_order_value,
  
  -- Расчетные метрики
  CASE 
    WHEN total_orders > 0 
    THEN ROUND((paid_orders::numeric / total_orders::numeric) * 100, 2)
    ELSE 0 
  END as payment_conversion_rate,
  
  CASE 
    WHEN first_order_date IS NOT NULL AND last_order_date IS NOT NULL
    THEN DATE_PART('day', last_order_date - first_order_date)
    ELSE 0
  END as customer_lifetime_days,
  
  CASE 
    WHEN last_order_date IS NOT NULL 
    THEN DATE_PART('day', CURRENT_DATE - last_order_date)
    ELSE NULL
  END as days_since_last_order,
  
  -- Сегментация клиентов
  CASE 
    WHEN total_spent > 50000 THEN 'VIP'
    WHEN total_spent > 20000 THEN 'Premium'
    WHEN total_spent > 5000 THEN 'Regular'
    WHEN total_orders > 0 THEN 'Occasional'
    ELSE 'New'
  END as customer_segment,
  
  CASE 
    WHEN last_order_date IS NULL THEN 'no_orders'
    WHEN DATE_PART('day', CURRENT_DATE - last_order_date) <= 30 THEN 'active'
    WHEN DATE_PART('day', CURRENT_DATE - last_order_date) <= 90 THEN 'dormant'
    ELSE 'inactive'
  END as activity_status,
  
  -- Временные метрики
  EXTRACT(YEAR FROM registration_date) as registration_year,
  EXTRACT(MONTH FROM registration_date) as registration_month,
  EXTRACT(DOW FROM registration_date) as registration_dow,
  
  created_at,
  updated_at

FROM customer_metrics
WHERE ($min_orders IS NULL OR total_orders >= $min_orders)
ORDER BY total_spent DESC
LIMIT COALESCE($limit, 1000);
