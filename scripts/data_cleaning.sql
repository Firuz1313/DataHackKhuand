-- Скрипт очистки данных с подсчетом строк до/после операций
-- Запуск: psql -h host -d database -U user -f data_cleaning.sql

\echo '=========================================='
\echo 'НАЧАЛО ОЧИСТКИ ДАННЫХ'
\echo '=========================================='

-- Включение вывода времени выполнения
\timing on

-- Функция для подсчета строк и вывода отчета
CREATE OR REPLACE FUNCTION log_cleaning_operation(
    operation_name TEXT,
    table_name TEXT,
    rows_before BIGINT,
    rows_after BIGINT,
    justification TEXT
) RETURNS void AS $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 ОПЕРАЦИЯ: %', operation_name;
    RAISE NOTICE '   Таблица: %', table_name;
    RAISE NOTICE '   До: % строк', rows_before;
    RAISE NOTICE '   После: % строк', rows_after;
    RAISE NOTICE '   Удалено: % строк', (rows_before - rows_after);
    RAISE NOTICE '   ��боснование: %', justification;
    RAISE NOTICE '----------------------------------------';
END;
$$ LANGUAGE plpgsql;

-- Создание таблицы для отчета очистки
DROP TABLE IF EXISTS data_cleaning_log;
CREATE TABLE data_cleaning_log (
    id SERIAL PRIMARY KEY,
    operation_name TEXT,
    table_name TEXT,
    rows_before BIGINT,
    rows_after BIGINT,
    rows_affected BIGINT,
    justification TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\echo ''
\echo '1. УДАЛЕНИЕ ТЕСТОВЫХ ДАННЫХ'
\echo '------------------------------------------'

-- Подсчет тестовых клиентов
DO $$
DECLARE
    customers_before BIGINT;
    customers_after BIGINT;
BEGIN
    -- Подсчет до удаления
    SELECT COUNT(*) INTO customers_before 
    FROM customers 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR name LIKE '%Test%'
       OR name LIKE '%test%';
    
    -- Удаление тестовых клиентов
    DELETE FROM customers 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR name LIKE '%Test%'
       OR name LIKE '%test%';
    
    -- Подсчет после удаления  
    SELECT COUNT(*) INTO customers_after 
    FROM customers 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR name LIKE '%Test%'
       OR name LIKE '%test%';
    
    -- Логирование
    PERFORM log_cleaning_operation(
        'Удаление тестовых клиентов',
        'customers',
        customers_before,
        customers_after,
        'Тестовые данные искажают реальную аналитику и метрики бизнеса'
    );
    
    -- Запись в лог
    INSERT INTO data_cleaning_log 
    (operation_name, table_name, rows_before, rows_after, rows_affected, justification)
    VALUES (
        'Удаление тестовых клиентов',
        'customers',
        customers_before,
        customers_after,
        customers_before - customers_after,
        'Тестовые данные искажают реальную аналитику и метрики бизнеса'
    );
END $$;

\echo ''
\echo '2. ОЧИСТКА ДУБЛИКАТОВ КЛИЕНТОВ'
\echo '------------------------------------------'

DO $$
DECLARE
    customers_before BIGINT;
    customers_after BIGINT;
BEGIN
    -- Подсчет до очистки
    SELECT COUNT(*) INTO customers_before FROM customers;
    
    -- Удаление дубликатов по email (оставляем запись с минимальным ID)
    DELETE FROM customers 
    WHERE id NOT IN (
        SELECT MIN(id) 
        FROM customers 
        WHERE email IS NOT NULL AND email != ''
        GROUP BY email
    ) AND email IS NOT NULL AND email != '';
    
    -- Подсчет после очистки
    SELECT COUNT(*) INTO customers_after FROM customers;
    
    -- Логирование
    PERFORM log_cleaning_operation(
        'Удаление дубликатов клиентов',
        'customers',
        customers_before,
        customers_after,
        'Дубликаты клиентов искажают аналитику. Оставлены записи с наименьшим ID'
    );
    
    -- Запись в лог
    INSERT INTO data_cleaning_log 
    (operation_name, table_name, rows_before, rows_after, rows_affected, justification)
    VALUES (
        'Удаление дубликатов клиентов',
        'customers',
        customers_before,
        customers_after,
        customers_before - customers_after,
        'Дубликаты клиентов искажают аналитику. Оставлены записи с наименьшим ID'
    );
END $$;

\echo ''
\echo '3. ОЧИС��КА НЕКОРРЕКТНЫХ ЗАКАЗОВ'
\echo '------------------------------------------'

DO $$
DECLARE
    orders_before BIGINT;
    orders_after BIGINT;
BEGIN
    -- Подсчет до очистки
    SELECT COUNT(*) INTO orders_before FROM orders;
    
    -- Удаление заказов без товаров
    DELETE FROM orders 
    WHERE id NOT IN (
        SELECT DISTINCT order_id 
        FROM order_items 
        WHERE order_id IS NOT NULL
    );
    
    -- Удаление заказов с будущими датами
    DELETE FROM orders 
    WHERE order_date > CURRENT_DATE;
    
    -- Удаление заказов с несуществующими клиентами
    DELETE FROM orders 
    WHERE customer_id NOT IN (
        SELECT id FROM customers WHERE id IS NOT NULL
    );
    
    -- Подсчет после очистки
    SELECT COUNT(*) INTO orders_after FROM orders;
    
    -- Логирование
    PERFORM log_cleaning_operation(
        'Очистка некорректных заказов',
        'orders',
        orders_before,
        orders_after,
        'Заказы без товаров не имеют коммерческой ценности. Будущие даты и несуществующие клиенты - ошибки данных'
    );
    
    -- Запись в лог
    INSERT INTO data_cleaning_log 
    (operation_name, table_name, rows_before, rows_after, rows_affected, justification)
    VALUES (
        'Очистка некорректных заказов',
        'orders',
        orders_before,
        orders_after,
        orders_before - orders_after,
        'Заказы без товаров не имеют коммерческой ценности. Будущие даты и несуществующие клиенты - ошибки данных'
    );
END $$;

\echo ''
\echo '4. ОЧИСТКА ПОЗИЦИЙ ЗАКАЗОВ'
\echo '------------------------------------------'

DO $$
DECLARE
    items_before BIGINT;
    items_after BIGINT;
BEGIN
    -- Подсчет до очистки
    SELECT COUNT(*) INTO items_before FROM order_items;
    
    -- Удаление позиций с некорректными данными
    DELETE FROM order_items 
    WHERE quantity <= 0 
       OR unit_price < 0
       OR quantity IS NULL 
       OR unit_price IS NULL
       OR product_id NOT IN (SELECT id FROM products WHERE id IS NOT NULL);
    
    -- Подсчет после очистки
    SELECT COUNT(*) INTO items_after FROM order_items;
    
    -- Логирование
    PERFORM log_cleaning_operation(
        'Очистка позиций заказов',
        'order_items',
        items_before,
        items_after,
        'Позиции с нулевым количеством или отрицательными ценами искажают расчет выручки'
    );
    
    -- Запись в лог
    INSERT INTO data_cleaning_log 
    (operation_name, table_name, rows_before, rows_after, rows_affected, justification)
    VALUES (
        'Очистка позиций заказов',
        'order_items',
        items_before,
        items_after,
        items_before - items_after,
        'Позиции с нулевым количеством или отрицательными ценами искажают расчет выручки'
    );
END $$;

\echo ''
\echo '5. АРХИВИРОВАНИЕ НЕАКТИВНЫХ ТОВАРОВ'
\echo '------------------------------------------'

DO $$
DECLARE
    products_before BIGINT;
    products_after BIGINT;
BEGIN
    -- Подсчет активных товаров до архивирования
    SELECT COUNT(*) INTO products_before FROM products WHERE is_active = true;
    
    -- Деактивация товаров без продаж за последние 12 месяцев
    UPDATE products 
    SET is_active = false, 
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = true 
      AND id NOT IN (
          SELECT DISTINCT oi.product_id 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
            AND oi.product_id IS NOT NULL
      )
      AND created_at < CURRENT_DATE - INTERVAL '12 months';
    
    -- Подсчет активных товаров после архивирования
    SELECT COUNT(*) INTO products_after FROM products WHERE is_active = true;
    
    -- Логирование
    PERFORM log_cleaning_operation(
        'Архивирование товаров',
        'products',
        products_before,
        products_after,
        'Неактивные товары загромождают каталог и усложняют аналитику'
    );
    
    -- Запись в лог
    INSERT INTO data_cleaning_log 
    (operation_name, table_name, rows_before, rows_after, rows_affected, justification)
    VALUES (
        'Архивирование товаров',
        'products',
        products_before,
        products_after,
        products_before - products_after,
        'Неа��тивные товары загромождают каталог и усложняют аналитику'
    );
END $$;

\echo ''
\echo '6. ОБНОВЛЕНИЕ СЛУЖЕБНЫХ ПОЛЕЙ'
\echo '------------------------------------------'

-- Обновление updated_at для измененных записей
UPDATE customers 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at < created_at OR updated_at IS NULL;

UPDATE products 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at < created_at OR updated_at IS NULL;

UPDATE orders 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at < created_at OR updated_at IS NULL;

\echo '✅ Служебные поля обновлены'

\echo ''
\echo '7. ИТОГОВЫЙ ОТЧЕТ'
\echo '------------------------------------------'

-- Вывод финального отчета
DO $$
DECLARE
    rec RECORD;
    total_affected BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 СВОДКА ОПЕРАЦИЙ ОЧИСТКИ:';
    RAISE NOTICE '==========================================';
    
    FOR rec IN 
        SELECT operation_name, table_name, rows_before, rows_after, rows_affected, justification
        FROM data_cleaning_log 
        ORDER BY id 
    LOOP
        RAISE NOTICE '• %: % стро�� удалено из %', 
            rec.operation_name, rec.rows_affected, rec.table_name;
        total_affected := total_affected + rec.rows_affected;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📈 ВСЕГО ОБРАБОТАНО: % строк', total_affected;
    RAISE NOTICE '';
    
    -- Финальные счетчики таблиц
    RAISE NOTICE '📋 ФИНАЛЬНОЕ СОСТОЯНИЕ ТАБЛИЦ:';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '• customers: % строк', (SELECT COUNT(*) FROM customers);
    RAISE NOTICE '• orders: % строк', (SELECT COUNT(*) FROM orders);
    RAISE NOTICE '• order_items: % строк', (SELECT COUNT(*) FROM order_items);
    RAISE NOTICE '• products (активные): % строк', (SELECT COUNT(*) FROM products WHERE is_active = true);
    RAISE NOTICE '• products (всего): % строк', (SELECT COUNT(*) FROM products);
END $$;

-- Создание представления для мониторинга качества данных
CREATE OR REPLACE VIEW data_quality_metrics AS
SELECT 
    'customers' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_email,
    COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_name,
    COUNT(*) - COUNT(DISTINCT email) as duplicate_emails
FROM customers

UNION ALL

SELECT 
    'orders' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as missing_customer_id,
    COUNT(CASE WHEN order_date IS NULL THEN 1 END) as missing_order_date,
    0 as duplicate_emails
FROM orders

UNION ALL

SELECT 
    'order_items' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN quantity IS NULL OR quantity <= 0 THEN 1 END) as invalid_quantity,
    COUNT(CASE WHEN unit_price IS NULL OR unit_price < 0 THEN 1 END) as invalid_price,
    0 as duplicate_emails
FROM order_items

UNION ALL

SELECT 
    'products' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_name,
    COUNT(CASE WHEN selling_price IS NULL OR selling_price <= 0 THEN 1 END) as invalid_price,
    0 as duplicate_emails
FROM products;

\echo ''
\echo '📊 Создано представление data_quality_metrics для мониторинга'

-- Отключение вывода времени
\timing off

\echo ''
\echo '=========================================='
\echo '✅ ОЧИСТКА ДАННЫХ ЗАВЕРШЕНА УСПЕШНО'
\echo '=========================================='
\echo ''
\echo 'Для просмотра детального отчета выполните:'
\echo 'SELECT * FROM data_cleaning_log ORDER BY executed_at;'
\echo ''
\echo 'Для мониторинга качества данных:'
\echo 'SELECT * FROM data_quality_metrics;'
