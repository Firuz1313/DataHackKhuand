-- Анализ по регионам/районам и каналам продаж
-- Параметры: $start_date, $end_date, $region_filter, $limit

WITH geographic_analysis AS (
  SELECT 
    -- Извлечение региона из адреса доставки
    CASE 
      WHEN o.shipping_address LIKE '%Москва%' OR o.shipping_address LIKE '%Moscow%' THEN 'Москва'
      WHEN o.shipping_address LIKE '%Санкт-Петербург%' OR o.shipping_address LIKE '%СПб%' THEN 'Санкт-Петербург'
      WHEN o.shipping_address LIKE '%Екатеринбург%' THEN 'Екатеринбург'
      WHEN o.shipping_address LIKE '%Новосибирск%' THEN 'Новосибирск'
      WHEN o.shipping_address LIKE '%Казань%' THEN 'Казань'
      WHEN o.shipping_address LIKE '%Нижний Новгород%' THEN 'Нижний Новгород'
      WHEN o.shipping_address LIKE '%Челябинск%' THEN 'Челябинск'
      WHEN o.shipping_address LIKE '%Самара%' THEN 'Самара'
      WHEN o.shipping_address LIKE '%Омск%' THEN 'Омск'
      WHEN o.shipping_address LIKE '%Ростов%' THEN 'Ростов-на-Дону'
      ELSE 'Другие регионы'
    END as region,
    
    -- Определение канала (условно, по времени заказа или другим признакам)
    CASE 
      WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 9 AND 18 THEN 'Рабочие часы'
      WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 19 AND 23 THEN 'Вечернее время'
      WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 0 AND 8 THEN 'Ночное время'
      ELSE 'Неопределенное время'
    END as time_channel,
    
    -- Канал по типу клиента
    CASE 
      WHEN c.company_name IS NOT NULL AND c.company_name != '' THEN 'B2B'
      ELSE 'B2C'
    END as business_channel,
    
    -- Канал по дню недели
    CASE 
      WHEN EXTRACT(DOW FROM o.order_date) IN (1,2,3,4,5) THEN 'Будни'
      WHEN EXTRACT(DOW FROM o.order_date) IN (0,6) THEN 'Выходные'
    END as day_type_channel,
    
    o.id as order_id,
    o.order_date,
    o.payment_status,
    o.status,
    
    (SELECT SUM(oi.quantity * oi.unit_price) 
     FROM order_items oi 
     WHERE oi.order_id = o.id) as order_value,
     
    (SELECT SUM(oi.quantity) 
     FROM order_items oi 
     WHERE oi.order_id = o.id) as order_quantity

  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  WHERE 1=1
    AND ($start_date IS NULL OR o.order_date >= $start_date::date)
    AND ($end_date IS NULL OR o.order_date <= $end_date::date)
)

-- Агрегация по регионам
SELECT 
  'region' as analysis_type,
  region as segment,
  
  COUNT(*) as total_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) as total_revenue,
  SUM(order_quantity) as total_units,
  
  -- Средние значения
  ROUND(AVG(order_value), 2) as avg_order_value,
  ROUND(AVG(order_quantity), 1) as avg_units_per_order,
  
  -- Конверсия
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  
  -- Доля от общего объема
  ROUND(
    (COUNT(*)::numeric / (SELECT COUNT(*) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_orders,
  
  ROUND(
    (SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END)::numeric / 
     (SELECT SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_revenue

FROM geographic_analysis
WHERE ($region_filter IS NULL OR region = $region_filter)
GROUP BY region

UNION ALL

-- Агрегация по временным каналам
SELECT 
  'time_channel' as analysis_type,
  time_channel as segment,
  
  COUNT(*) as total_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) as total_revenue,
  SUM(order_quantity) as total_units,
  
  ROUND(AVG(order_value), 2) as avg_order_value,
  ROUND(AVG(order_quantity), 1) as avg_units_per_order,
  
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  
  ROUND(
    (COUNT(*)::numeric / (SELECT COUNT(*) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_orders,
  
  ROUND(
    (SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END)::numeric / 
     (SELECT SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_revenue

FROM geographic_analysis
GROUP BY time_channel

UNION ALL

-- Агрегация по бизнес каналам
SELECT 
  'business_channel' as analysis_type,
  business_channel as segment,
  
  COUNT(*) as total_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) as total_revenue,
  SUM(order_quantity) as total_units,
  
  ROUND(AVG(order_value), 2) as avg_order_value,
  ROUND(AVG(order_quantity), 1) as avg_units_per_order,
  
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  
  ROUND(
    (COUNT(*)::numeric / (SELECT COUNT(*) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_orders,
  
  ROUND(
    (SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END)::numeric / 
     (SELECT SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_revenue

FROM geographic_analysis
GROUP BY business_channel

UNION ALL

-- Агрегация по типу дня
SELECT 
  'day_type_channel' as analysis_type,
  day_type_channel as segment,
  
  COUNT(*) as total_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) as total_revenue,
  SUM(order_quantity) as total_units,
  
  ROUND(AVG(order_value), 2) as avg_order_value,
  ROUND(AVG(order_quantity), 1) as avg_units_per_order,
  
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  
  ROUND(
    (COUNT(*)::numeric / (SELECT COUNT(*) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_orders,
  
  ROUND(
    (SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END)::numeric / 
     (SELECT SUM(CASE WHEN payment_status = 'paid' THEN order_value ELSE 0 END) FROM geographic_analysis)::numeric) * 100, 2
  ) as share_of_total_revenue

FROM geographic_analysis
GROUP BY day_type_channel

ORDER BY analysis_type, total_revenue DESC
LIMIT COALESCE($limit, 100);
