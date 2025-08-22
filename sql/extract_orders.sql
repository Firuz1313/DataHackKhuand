-- Выгрузка данных заказов с основными метриками
-- Параметры: $start_date, $end_date, $status_filter, $limit

WITH order_metrics AS (
  SELECT 
    o.id,
    o.customer_id,
    o.order_date,
    o.status,
    o.payment_status,
    o.shipping_address,
    o.created_at,
    o.updated_at,
    
    -- Расчет общей суммы заказа
    COALESCE(
      (SELECT SUM(oi.quantity * oi.unit_price) 
       FROM order_items oi 
       WHERE oi.order_id = o.id), 0
    ) AS total_amount,
    
    -- Количество позиций в заказе
    COALESCE(
      (SELECT COUNT(*) 
       FROM order_items oi 
       WHERE oi.order_id = o.id), 0
    ) AS items_count,
    
    -- Общее количество товаров
    COALESCE(
      (SELECT SUM(oi.quantity) 
       FROM order_items oi 
       WHERE oi.order_id = o.id), 0
    ) AS total_quantity,
    
    -- Информация о клиенте
    c.name as customer_name,
    c.email as customer_email,
    c.company_name,
    c.registration_date as customer_since
    
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  WHERE 1=1
    AND ($start_date IS NULL OR o.order_date >= $start_date::date)
    AND ($end_date IS NULL OR o.order_date <= $end_date::date)
    AND ($status_filter IS NULL OR o.status = $status_filter)
)

SELECT 
  id,
  customer_id,
  customer_name,
  customer_email,
  company_name,
  customer_since,
  order_date,
  status,
  payment_status,
  shipping_address,
  total_amount,
  items_count,
  total_quantity,
  
  -- Метрики
  CASE 
    WHEN payment_status = 'paid' THEN total_amount 
    ELSE 0 
  END as paid_amount,
  
  CASE 
    WHEN status = 'delivered' THEN 1 
    ELSE 0 
  END as is_delivered,
    
  -- Временные метрики
  EXTRACT(YEAR FROM order_date) as order_year,
  EXTRACT(MONTH FROM order_date) as order_month,
  EXTRACT(DOW FROM order_date) as order_dow,
  EXTRACT(HOUR FROM created_at) as order_hour,
  
  created_at,
  updated_at

FROM order_metrics
ORDER BY order_date DESC
LIMIT COALESCE($limit, 1000);
