-- Агрегированные KPI метрики для дашборда
-- Параметры: $start_date, $end_date, $granularity ('day', 'week', 'month')

WITH date_range AS (
  SELECT 
    COALESCE($start_date::date, CURRENT_DATE - INTERVAL '30 days') as start_date,
    COALESCE($end_date::date, CURRENT_DATE) as end_date,
    COALESCE($granularity, 'day') as granularity
),

order_metrics AS (
  SELECT 
    -- Временная группировка
    CASE 
      WHEN dr.granularity = 'day' THEN o.order_date
      WHEN dr.granularity = 'week' THEN DATE_TRUNC('week', o.order_date)::date
      WHEN dr.granularity = 'month' THEN DATE_TRUNC('month', o.order_date)::date
      ELSE o.order_date
    END as period_date,
    
    -- Основные метрики заказов
    COUNT(*) as total_orders,
    COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
    COUNT(CASE WHEN o.status = 'returned' THEN 1 END) as returned_orders,
    
    -- Метрики по товарам
    SUM(
      (SELECT SUM(oi.quantity) 
       FROM order_items oi 
       WHERE oi.order_id = o.id)
    ) as total_units,
    
    -- Финансовые метрики
    SUM(
      CASE WHEN o.payment_status = 'paid' THEN 
        (SELECT SUM(oi.quantity * oi.unit_price) 
         FROM order_items oi 
         WHERE oi.order_id = o.id)
      ELSE 0 END
    ) as net_paid_revenue,
    
    SUM(
      (SELECT SUM(oi.quantity * oi.unit_price) 
       FROM order_items oi 
       WHERE oi.order_id = o.id)
    ) as gross_revenue,
    
    -- Уникальные клиенты
    COUNT(DISTINCT o.customer_id) as unique_customers
    
  FROM orders o
  CROSS JOIN date_range dr
  WHERE o.order_date BETWEEN dr.start_date AND dr.end_date
  GROUP BY 1
),

customer_metrics AS (
  SELECT 
    om.period_date,
    
    -- Новые клиенты в периоде
    COUNT(CASE WHEN c.registration_date BETWEEN dr.start_date AND dr.end_date THEN 1 END) as new_customers,
    
    -- Активные клиенты (делали заказы)
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM orders o2 
        WHERE o2.customer_id = c.id 
          AND o2.order_date = om.period_date
      ) THEN c.id 
    END) as active_customers
    
  FROM order_metrics om
  CROSS JOIN date_range dr
  LEFT JOIN customers c ON c.registration_date <= dr.end_date
  GROUP BY om.period_date
)

SELECT 
  om.period_date,
  
  -- Основные KPI
  om.total_orders as "Заказы",
  om.total_units as "Единицы",
  ROUND(om.gross_revenue, 2) as "Валовая выручка",
  ROUND(om.net_paid_revenue, 2) as "Оплаченная выручка (Net Paid)",
  
  -- AOV (средняя стоимость заказа)
  CASE 
    WHEN om.paid_orders > 0 
    THEN ROUND(om.net_paid_revenue / om.paid_orders, 2)
    ELSE 0 
  END as "AOV",
  
  -- Конверсия оплаты
  CASE 
    WHEN om.total_orders > 0 
    THEN ROUND((om.paid_orders::numeric / om.total_orders::numeric) * 100, 2)
    ELSE 0 
  END as "Конверсия оплаты (%)",
  
  -- Доля возвратов
  CASE 
    WHEN om.total_orders > 0 
    THEN ROUND((om.returned_orders::numeric / om.total_orders::numeric) * 100, 2)
    ELSE 0 
  END as "Доля возвратов (%)",
  
  -- Метрики клиентов
  om.unique_customers as "Уникальные клиенты",
  cm.new_customers as "Новые клиенты",
  cm.active_customers as "Активные клиенты",
  
  -- Дополнительные метрики
  om.delivered_orders as "Доставленные заказы",
  om.cancelled_orders as "Отмененные заказы",
  
  -- Эффективность
  CASE 
    WHEN om.total_orders > 0 
    THEN ROUND((om.delivered_orders::numeric / om.total_orders::numeric) * 100, 2)
    ELSE 0 
  END as "Доля успешных доставок (%)"
  
FROM order_metrics om
LEFT JOIN customer_metrics cm ON om.period_date = cm.period_date
ORDER BY om.period_date;
