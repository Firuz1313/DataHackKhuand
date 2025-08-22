-- Выгрузка данных продуктов с расширенными метриками
-- Параметры: $category_filter, $min_stock, $active_only, $limit

WITH product_sales AS (
  SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.supplier_id,
    p.purchase_price,
    p.selling_price,
    p.stock_quantity,
    p.reorder_level,
    p.is_active,
    p.created_at,
    p.updated_at,
    
    -- Расчет продаж
    COALESCE(
      (SELECT SUM(oi.quantity) 
       FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = p.id 
         AND o.payment_status = 'paid'), 0
    ) AS total_sold,
    
    COALESCE(
      (SELECT SUM(oi.quantity * oi.unit_price) 
       FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = p.id 
         AND o.payment_status = 'paid'), 0
    ) AS total_revenue,
    
    -- Последний заказ
    (SELECT MAX(o.order_date) 
     FROM order_items oi 
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.product_id = p.id
    ) AS last_order_date,
    
    -- Количество заказов
    COALESCE(
      (SELECT COUNT(DISTINCT o.id) 
       FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = p.id), 0
    ) AS order_count
    
  FROM products p
  WHERE 1=1
    AND ($category_filter IS NULL OR p.category = $category_filter)
    AND ($min_stock IS NULL OR p.stock_quantity >= $min_stock)
    AND ($active_only IS NULL OR $active_only = FALSE OR p.is_active = TRUE)
)

SELECT 
  id,
  name,
  description,
  category,
  supplier_id,
  purchase_price,
  selling_price,
  stock_quantity,
  reorder_level,
  is_active,
  total_sold,
  total_revenue,
  order_count,
  last_order_date,
  
  -- Расчетные метрики
  CASE 
    WHEN total_sold > 0 THEN selling_price - purchase_price 
    ELSE 0 
  END as profit_per_unit,
  
  CASE 
    WHEN total_sold > 0 THEN (selling_price - purchase_price) * total_sold 
    ELSE 0 
  END as total_profit,
  
  stock_quantity * purchase_price as inventory_value,
  
  CASE 
    WHEN stock_quantity <= reorder_level THEN 'low_stock'
    WHEN stock_quantity = 0 THEN 'out_of_stock' 
    ELSE 'in_stock'
  END as stock_status,
  
  -- Скорость оборота (дни)
  CASE 
    WHEN total_sold > 0 AND last_order_date IS NOT NULL 
    THEN DATE_PART('day', CURRENT_DATE - last_order_date)
    ELSE NULL
  END as days_since_last_sale,
  
  -- Временные метрики
  EXTRACT(YEAR FROM created_at) as created_year,
  EXTRACT(MONTH FROM created_at) as created_month,
  
  created_at,
  updated_at

FROM product_sales
ORDER BY total_revenue DESC
LIMIT COALESCE($limit, 1000);
