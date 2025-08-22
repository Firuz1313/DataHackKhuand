# Определения KPI метрик

Подробное описание всех ключевых показателей эффективности (KPI), используемых в аналитическом дашборде.

## 📊 Основные KPI

### 1. Заказы (Orders)

**Определение**: Общее количество заказов за определенный период  
**Единица измерения**: Штуки  
**Частота обновления**: Реальное время  

**Формула SQL:**
```sql
SELECT COUNT(*) as total_orders
FROM orders 
WHERE order_date BETWEEN ? AND ?
```

**Разновидности:**
- **Всего заказов** - все заказы независимо от статуса
- **Завершенные заказы** - только со статусом 'delivered'
- **Оплаченные заказы** - только с payment_status = 'paid'
- **Отмененные заказы** - только со статусом 'cancelled'

**Пример расчета:**
```sql
-- Заказы за текущий месяц
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)
```

---

### 2. Единицы (Units)

**Определение**: Общее количество проданных единиц товаров  
**Единица измерения**: Штуки  
**Частота обновления**: Реальное время  

**Формула SQL:**
```sql
SELECT SUM(oi.quantity) as total_units
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date BETWEEN ? AND ?
  AND o.payment_status = 'paid'
```

**Детализация:**
- По категориям товаров
- По отдельным товарам
- По временным периодам
- По каналам продаж

**Пример расчета:**
```sql
-- Единицы по категориям за последние 30 дней
SELECT 
    p.category,
    SUM(oi.quantity) as units_sold
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
  AND o.payment_status = 'paid'
GROUP BY p.category
ORDER BY units_sold DESC
```

---

### 3. Валовая выручка (Gross Revenue)

**Определение**: Общая сумма всех заказов до вычета возвратов и скидок  
**Единица измерения**: Рубли (RUB)  
**Частота обновления**: Реальное время  

**Формула SQL:**
```sql
SELECT SUM(oi.quantity * oi.unit_price) as gross_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date BETWEEN ? AND ?
```

**Особенности:**
- Включает все заказы независимо от статуса оплаты
- Не учитывает возвраты и отмены
- Используется для оценки потенциального дохода

**Пример расчета:**
```sql
-- Валовая выручка по месяцам
SELECT 
    DATE_TRUNC('month', o.order_date) as month,
    SUM(oi.quantity * oi.unit_price) as gross_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY month
```

---

### 4. Оплаченная выручка (Net Paid Revenue)

**Определение**: Фактически полученная выручка от оплаченных заказов  
**Единица измерения**: Рубли (RUB)  
**Частота обновления**: Реальное время  

**Формула SQL:**
```sql
SELECT SUM(oi.quantity * oi.unit_price) as net_paid_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date BETWEEN ? AND ?
  AND o.payment_status = 'paid'
```

**Особенности:**
- Включает только оплаченные заказы
- Основной показатель для финансовой отчетности
- Исключает возвраты (payment_status != 'refunded')

**Пример расчета:**
```sql
-- Net Paid с детализацией по статусам
SELECT 
    o.payment_status,
    SUM(oi.quantity * oi.unit_price) as revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date BETWEEN ? AND ?
GROUP BY o.payment_status
```

---

### 5. AOV (Average Order Value) - Средняя стоимость заказа

**Определение**: Средняя сумма одного заказа  
**Единица измерения**: Рубли (RUB)  
**Частота обновления**: Реальное время  

**Формула:**
AOV = Общая выручка / Количество заказов

**Формула SQL:**
```sql
SELECT 
    SUM(oi.quantity * oi.unit_price) / COUNT(DISTINCT o.id) as aov
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date BETWEEN ? AND ?
  AND o.payment_status = 'paid'
```

**Варианты расчета:**
- **AOV по валовой выручке** - включает все заказы
- **AOV по оплаченным заказам** - только оплаченные заказы
- **AOV по сегментам клиентов** - B2B vs B2C

**Пример расчета:**
```sql
-- AOV по сегментам клиентов
SELECT 
    CASE 
        WHEN c.company_name IS NOT NULL THEN 'B2B'
        ELSE 'B2C'
    END as segment,
    ROUND(SUM(oi.quantity * oi.unit_price) / COUNT(DISTINCT o.id), 2) as aov
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN customers c ON o.customer_id = c.id
WHERE o.order_date BETWEEN ? AND ?
  AND o.payment_status = 'paid'
GROUP BY segment
```

---

### 6. Конверсия оплаты (Payment Conversion Rate)

**Определение**: Доля заказов, которые были успешно оплачены  
**Единица измерения**: Проценты (%)  
**Частота обновления**: Реальное время  

**Формула:**
Конверсия оплаты = (Оплаченные заказы / Всего заказов) × 100%

**Формула SQL:**
```sql
SELECT 
    ROUND(
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as payment_conversion_rate
FROM orders 
WHERE order_date BETWEEN ? AND ?
```

**Связанные метрики:**
- **Конверсия доставки** - доля доставленных заказов
- **К��нверсия завершения** - доля завершенных заказов

**Пример расчета:**
```sql
-- Конверсии по этапам воронки
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    
    ROUND(COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as payment_conversion,
    ROUND(COUNT(CASE WHEN status = 'delivered' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as delivery_conversion
FROM orders 
WHERE order_date BETWEEN ? AND ?
```

---

### 7. Доля возвратов (Return Rate)

**Определение**: Процент заказов, которые были возвращены  
**Единица измерения**: Проценты (%)  
**Частота обновления**: Ежедневно  

**Формула:**
Доля возвратов = (Возвращенные заказы / Всего заказов) × 100%

**Формула SQL:**
```sql
SELECT 
    ROUND(
        COUNT(CASE WHEN status = 'returned' THEN 1 END)::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as return_rate
FROM orders 
WHERE order_date BETWEEN ? AND ?
```

**Детализация:**
- По товарам
- По категориям
- По временным периодам
- По причинам возврата

**Пример расчета:**
```sql
-- Доля возвратов по категориям товаров
SELECT 
    p.category,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END) as returned_orders,
    ROUND(
        COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END)::numeric / 
        COUNT(DISTINCT o.id)::numeric * 100, 2
    ) as return_rate
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.order_date BETWEEN ? AND ?
GROUP BY p.category
ORDER BY return_rate DESC
```

---

### 8. Доля кошельков (Wallet Share)

**Определение**: Доля расходов клиента, приходящаяся на нашу компанию  
**Единица измерения**: Проценты (%)  
**Частота обновления**: Ежемесячно  

**Примерная формула:**
Доля кошельков = (Потратил у нас / Общий бюджет клиента) × 100%

**Упрощенный расчет SQL:**
```sql
-- Расчет на осно��е изменения покупательской активности
WITH customer_spending AS (
    SELECT 
        c.id,
        c.name,
        SUM(oi.quantity * oi.unit_price) as total_spent,
        COUNT(DISTINCT o.id) as order_count,
        MAX(o.order_date) as last_order_date,
        MIN(o.order_date) as first_order_date
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
      AND o.order_date BETWEEN ? AND ?
    GROUP BY c.id, c.name
)
SELECT 
    name,
    total_spent,
    order_count,
    CASE 
        WHEN total_spent > 50000 THEN 'High Wallet Share'
        WHEN total_spent > 20000 THEN 'Medium Wallet Share'
        ELSE 'Low Wallet Share'
    END as estimated_wallet_share
FROM customer_spending
ORDER BY total_spent DESC
```

---

### 9. Канальный микс (Channel Mix)

**Определение**: Распределение продаж по различным каналам  
**Единица измерения**: Проценты (%)  
**Частота обновления**: Ежедневно  

**Каналы определяются по:**
- Времени заказа (рабочие часы / вечер / ночь)
- Типу клиента (B2B / B2C)
- Дню недели (будни / выходные)

**Формула SQL:**
```sql
SELECT 
    CASE 
        WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 9 AND 18 THEN 'Рабочие часы'
        WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 19 AND 23 THEN 'Вечернее время'
        ELSE 'Ночное время'
    END as time_channel,
    
    COUNT(*) as orders_count,
    SUM(oi.quantity * oi.unit_price) as revenue,
    
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as orders_share,
    ROUND(SUM(oi.quantity * oi.unit_price) / SUM(SUM(oi.quantity * oi.unit_price)) OVER () * 100, 2) as revenue_share
    
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_date BETWEEN ? AND ?
  AND o.payment_status = 'paid'
GROUP BY time_channel
ORDER BY revenue_share DESC
```

---

### 10. Региональное распределение (Geographic Distribution)

**Определение**: Распределение продаж по регионам/районам  
**Единица измерения**: Проценты (%) и абсолютные значения  
**Частота обновления**: Ежедневно  

**Формула SQL:**
```sql
SELECT 
    CASE 
        WHEN shipping_address LIKE '%Москва%' THEN 'Москв��'
        WHEN shipping_address LIKE '%Санкт-Петербург%' THEN 'Санкт-Петербург'
        WHEN shipping_address LIKE '%Екатеринбург%' THEN 'Екатеринбург'
        ELSE 'Другие регионы'
    END as region,
    
    COUNT(*) as orders_count,
    SUM(oi.quantity * oi.unit_price) as revenue,
    
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as orders_share,
    ROUND(SUM(oi.quantity * oi.unit_price) / SUM(SUM(oi.quantity * oi.unit_price)) OVER () * 100, 2) as revenue_share
    
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_date BETWEEN ? AND ?
  AND o.payment_status = 'paid'
GROUP BY region
ORDER BY revenue_share DESC
```

---

### 11. Эффект праздников/выходных

**Определение**: Влияние праздников и выходных дней на продажи  
**Единица измерения**: Множитель или проценты изменения  
**Частота обновления**: Еженедельно  

**Формула SQL:**
```sql
WITH daily_stats AS (
    SELECT 
        o.order_date,
        EXTRACT(DOW FROM o.order_date) as day_of_week,
        CASE 
            WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN 'Выход��ые'
            ELSE 'Будни'
        END as day_type,
        COUNT(*) as orders_count,
        SUM(oi.quantity * oi.unit_price) as revenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
      AND o.order_date BETWEEN ? AND ?
    GROUP BY o.order_date, day_of_week, day_type
),
averages AS (
    SELECT 
        day_type,
        AVG(orders_count) as avg_orders,
        AVG(revenue) as avg_revenue
    FROM daily_stats
    GROUP BY day_type
)
SELECT 
    day_type,
    ROUND(avg_orders, 1) as avg_daily_orders,
    ROUND(avg_revenue, 2) as avg_daily_revenue,
    ROUND(avg_revenue / (SELECT avg_revenue FROM averages WHERE day_type = 'Будни'), 2) as revenue_multiplier
FROM averages
```

## 📈 Дополнительные метрики

### Customer Lifetime Value (CLV)

**Определение**: Прогнозируемая прибыль от клиента за весь период сотрудничества  
**Формула:**
CLV = (AOV × Частота покупок × Маржинальность) × Срок жизни клиента

```sql
WITH customer_metrics AS (
    SELECT 
        c.id,
        c.registration_date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity * oi.unit_price) as total_spent,
        DATE_PART('day', CURRENT_DATE - c.registration_date) as customer_age_days,
        MAX(o.order_date) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.payment_status = 'paid'
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY c.id, c.registration_date
)
SELECT 
    id,
    total_orders,
    total_spent,
    customer_age_days,
    CASE 
        WHEN customer_age_days > 0 AND total_orders > 0 
        THEN ROUND((total_spent / customer_age_days) * 365, 2)
        ELSE 0 
    END as estimated_annual_value
FROM customer_metrics
WHERE total_orders > 0
```

### Индекс удовлетворенности клиентов

**Определение**: Метрика на основе поведенческих данных  
**Компоненты:**
- Частота заказов
- Отсутствие возвратов
- Рост суммы заказов

```sql
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT o.id) as order_frequency,
    COUNT(CASE WHEN o.status = 'returned' THEN 1 END) as return_count,
    
    -- Простой индекс удовлетворенности (0-100)
    GREATEST(0, LEAST(100, 
        50 + -- базовое значение
        (COUNT(DISTINCT o.id) * 5) - -- +5 за каждый заказ
        (COUNT(CASE WHEN o.status = 'returned' THEN 1 END) * 20) -- -20 за каждый возврат
    )) as satisfaction_index
    
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.registration_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT o.id) > 0
ORDER BY satisfaction_index DESC
```

## 🎯 Целевые значения KPI

| Метрика | Хорошо | Отлично | Критический уровень |
|---------|--------|---------|-------------------|
| Конверсия оплаты | > 85% | > 95% | < 70% |
| AOV | > 5,000 ₽ | > 10,000 ₽ | < 2,000 ₽ |
| Доля возвратов | < 5% | < 2% | > 10% |
| Рост выручки (месяц к месяцу) | > 10% | > 20% | < 0% |
| Время обработки заказа | < 24 часа | < 12 часов | > 48 часов |

## 📊 Периодичность отчетности

- **Реальное время**: Заказы, Единицы, Выручка
- **Ежедневно**: Конверсии, Возвраты, Региональное распределение
- **Еженедельно**: AOV, Канальный микс, Эффект выходных
- **Ежемесячно**: CLV, Доля кошельк��в, Глубокая аналитика

## 📝 Примечания

1. Все суммы указаны в российских рублях (RUB)
2. Временные расчеты используют часовой пояс сервера БД
3. Проценты округляются до 2 знаков после запятой
4. Суммы округляются до 2 знаков после запятой
5. При отсутствии данных возвращается 0 или NULL
6. Все расчеты учитывают только корректные данные (прошедшие очистку)
