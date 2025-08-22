# SQL Запросы для выгрузки данных

Этот катал��г содержит параметризованные SQL запросы для извлечения данных из базы данных для аналитических целей.

## 📋 Список запросов

### 1. `extract_orders.sql` - Данные заказов

**Описание**: Выгружает данные заказов с расчетными метриками  
**Параметры**:

- `$start_date` - Начальная дата (YYYY-MM-DD)
- `$end_date` - Конечная дата (YYYY-MM-DD)
- `$status_filter` - Фильтр по статусу заказа
- `$limit` - Лимит записей (по умолчанию 1000)

**Метрики**:

- Общая сумма заказа
- Количество позиций
- Оплаченная сумма
- Статус доставки
- Временные метрики (год, месяц, день недели, час)

### 2. `extract_products.sql` - Данные продуктов

**Описание**: Выгружает данные продуктов с метриками продаж  
**Параметры**:

- `$category_filter` - Фильтр по категории
- `$min_stock` - Минимальный остаток на складе
- `$active_only` - Только активные товары (TRUE/FALSE)
- `$limit` - Лимит записей (по умолчанию 1000)

**Метрики**:

- Общие продажи
- Общая выручка
- Прибыль на единицу
- Статус запасов
- Скорость оборота

### 3. `extract_customers.sql` - Данные клиентов

**Описание**: Выгружает данные клиентов с анализом активности  
**Параметры**:

- `$status_filter` - Фильтр по статусу клиента
- `$min_orders` - Минимальное количество заказов
- `$start_date` - Начальная дата регистрации
- `$end_date` - Конечная дата регистрации
- `$limit` - Лимит записей (по умолчанию 1000)

**Метрики**:

- Общее количество заказов
- Общая потраченная сумма
- Средний чек
- Конверсия оплаты
- Сегментация клиентов
- Статус активности

### 4. `extract_kpi_metrics.sql` - KPI метрики

**Описание**: Агрегированные KPI метрики для дашборда  
**Параметры**:

- `$start_date` - Начальная дата (по умолчанию -30 дней)
- `$end_date` - Конечная дата (по умолчанию сегодня)
- `$granularity` - Детализация: 'day', 'week', 'month'

**Метрики**:

- Заказы
- Единицы товаров
- Валовая выручка
- Оплаченная выручка (Net Paid)
- AOV (средняя стоимость заказа)
- Конверсия оплаты
- Доля возвратов
- Уникальные клиенты

### 5. `extract_geography_channels.sql` - География и каналы

**Описание**: Анализ по регионам/районам и каналам продаж  
**Параметры**:

- `$start_date` - Начальная дата
- `$end_date` - Конечная дата
- `$region_filter` - Фильтр по региону
- `$limit` - Лимит записей (по умолчанию 100)

**Анализ**:

- Региональное распределение
- Временные каналы (рабочие часы, вечер, ночь)
- Бизнес каналы (B2B/B2C)
- Типы дней (будни/выходные)

## 🔧 Использование

### Через API

```javascript
// Пример вызова через frontend API
const result = await dbService.executeQuery(
  `
  ${sql_query_content}
`,
  {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    limit: 500,
  },
)
```

### Напрямую в PostgreSQL

```sql
-- Замените параметры на конкретные значения
-- Пример для extract_orders.sql:

-- Установка параметров
\set start_date '2024-01-01'
\set end_date '2024-12-31'
\set status_filter 'completed'
\set limit 1000

-- Выполнение запроса
\i extract_orders.sql
```

### Через psql с параметрами

```bash
psql -h host -d database -U user \
  -v start_date='2024-01-01' \
  -v end_date='2024-12-31' \
  -v limit=1000 \
  -f extract_orders.sql
```

## 📊 Примеры использования

### 1. Месячная отчетность по заказам

```sql
-- Параметры для extract_orders.sql
$start_date = '2024-12-01'
$end_date = '2024-12-31'
$status_filter = NULL
$limit = NULL
```

### 2. Анализ топ-товаров

```sql
-- Параметры для extract_products.sql
$category_filter = NULL
$min_stock = NULL
$active_only = TRUE
$limit = 50
```

### 3. VIP клиенты

```sql
-- Параметры для extract_customers.sql
$status_filter = 'active'
$min_orders = 10
$start_date = NULL
$end_date = NULL
$limit = 100
```

### 4. Недельные KPI

```sql
-- Параметры для extract_kpi_metrics.sql
$start_date = '2024-12-01'
$end_date = '2024-12-31'
$granularity = 'week'
```

### 5. Региональный анализ

```sql
-- Параметры для extract_geography_channels.sql
$start_date = '2024-12-01'
$end_date = '2024-12-31'
$region_filter = 'Москва'
$limit = NULL
```

## 🎯 Оптимизация производительности

### Индексы для быстрых запросов:

```sql
-- Индексы для таблицы orders
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Индексы для таблицы order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Индексы для таблицы customers
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_registration ON customers(registration_date);

-- Индексы для табли��ы products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
```

### Рекомендации:

1. **Используйте временные фильтры** - всегда ограничивайте диапазон дат
2. **Установите разумные лимиты** - для больших выборок используйте пагинацию
3. **Кэшируйте результаты** - для часто используемых запросов
4. **Мониторьте производительность** - используйте EXPLAIN ANALYZE

## ⚠️ Примечания

- Все запросы оптимизированы для PostgreSQL
- Параметры помечены как `$parameter_name`
- NULL параметры игнорируются (не применяют фильтр)
- Все денежные суммы округляются до 2 знаков после запятой
- Проценты округляются до 2 знаков после запятой
- Временные метрики извлекаются в часовом поясе сервера БД

## 🔍 Отл��дка

Для отладки запросов используйте:

```sql
-- Просмотр плана выполнения
EXPLAIN ANALYZE [ваш_запрос];

-- Проверка статистики выполнения
SELECT * FROM pg_stat_statements
WHERE query LIKE '%ваш_запрос%';
```
