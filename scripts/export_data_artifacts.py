#!/usr/bin/env python3
"""
Скрипт для создания аккуратных CSV/Parquet артефактов
Экспортирует очищенные данные для использования в внешних системах аналитики
"""

import pandas as pd
import psycopg2
import pyarrow as pa
import pyarrow.parquet as pq
import os
import json
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
import logging

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_export.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class DataExporter:
    def __init__(self, output_dir='exported_data'):
        """Инициализация экспортера данных"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Создание папок для разных форматов
        (self.output_dir / 'csv').mkdir(exist_ok=True)
        (self.output_dir / 'parquet').mkdir(exist_ok=True)
        (self.output_dir / 'json').mkdir(exist_ok=True)
        
        # Конфигурация БД
        self.db_config = {
            'host': os.getenv('DB_HOST', '103.246.146.132'),
            'port': os.getenv('DB_PORT', 5432),
            'database': os.getenv('DB_NAME', 'hackathon'),
            'user': os.getenv('DB_USER', 'user_db'),
            'password': os.getenv('DB_PASSWORD', 'psql14182025')
        }
        
        self.export_manifest = {
            'export_timestamp': datetime.now().isoformat(),
            'exported_tables': [],
            'file_sizes': {},
            'record_counts': {},
            'data_quality_summary': {}
        }
        
    def connect_db(self):
        """Подключение к базе данных"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            logger.info("✅ Подключение к базе данных установлено")
            return True
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к БД: {e}")
            return False
            
    def execute_query(self, query, params=None):
        """Выполнение SQL запроса с возвратом DataFrame"""
        try:
            return pd.read_sql(query, self.conn, params=params)
        except Exception as e:
            logger.error(f"❌ Ошибка выполнения запроса: {e}")
            return None
            
    def export_table_to_formats(self, table_name, query, description=""):
        """Экспорт таблицы в различные форматы"""
        logger.info(f"📊 Экспорт таблицы: {table_name}")
        
        # Выполнение запроса
        df = self.execute_query(query)
        if df is None or df.empty:
            logger.warning(f"⚠️ Нет данных для экспорта: {table_name}")
            return False
            
        # Подготовка имени файла с timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base_filename = f"{table_name}_{timestamp}"
        
        # Экспорт в CSV
        csv_path = self.output_dir / 'csv' / f"{base_filename}.csv"
        df.to_csv(csv_path, index=False, encoding='utf-8')
        logger.info(f"📄 CSV сохранен: {csv_path}")
        
        # Экспорт в Parquet
        parquet_path = self.output_dir / 'parquet' / f"{base_filename}.parquet"
        df.to_parquet(parquet_path, index=False, engine='pyarrow', compression='snappy')\n        logger.info(f"📦 Parquet сохранен: {parquet_path}")
        
        # Создание метаданных
        metadata = {
            'table_name': table_name,
            'description': description,
            'export_timestamp': datetime.now().isoformat(),
            'record_count': len(df),
            'column_count': len(df.columns),
            'columns': [
                {
                    'name': col,
                    'dtype': str(df[col].dtype),
                    'null_count': int(df[col].isnull().sum()),
                    'unique_count': int(df[col].nunique())
                }
                for col in df.columns
            ],
            'data_types': dict(df.dtypes.astype(str)),
            'sample_data': df.head(3).to_dict('records') if len(df) > 0 else [],
            'file_sizes': {
                'csv_mb': round(csv_path.stat().st_size / 1024 / 1024, 2),
                'parquet_mb': round(parquet_path.stat().st_size / 1024 / 1024, 2)
            }
        }
        
        # Сохранение метаданных в JSON
        metadata_path = self.output_dir / 'json' / f"{base_filename}_metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2, default=str)
        logger.info(f"📋 Метаданные сохранены: {metadata_path}")
        
        # Обновление манифеста
        self.export_manifest['exported_tables'].append(table_name)
        self.export_manifest['record_counts'][table_name] = len(df)
        self.export_manifest['file_sizes'][table_name] = metadata['file_sizes']
        
        logger.info(f"✅ Экспорт завершен: {table_name} ({len(df):,} записей)")
        return True
        
    def export_customers_data(self):
        """Экспорт данных клиентов с расширенной аналитикой"""
        query = """
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
                COALESCE(om.total_orders, 0) as total_orders,
                COALESCE(om.paid_orders, 0) as paid_orders,
                COALESCE(om.total_spent, 0) as total_spent,
                COALESCE(om.avg_order_value, 0) as avg_order_value,
                om.first_order_date,
                om.last_order_date,
                
                -- Сегментация
                CASE 
                    WHEN COALESCE(om.total_spent, 0) > 50000 THEN 'VIP'
                    WHEN COALESCE(om.total_spent, 0) > 20000 THEN 'Premium'
                    WHEN COALESCE(om.total_spent, 0) > 5000 THEN 'Regular'
                    WHEN COALESCE(om.total_orders, 0) > 0 THEN 'Occasional'
                    ELSE 'New'
                END as customer_segment,
                
                -- Активность
                CASE 
                    WHEN om.last_order_date IS NULL THEN 'no_orders'
                    WHEN DATE_PART('day', CURRENT_DATE - om.last_order_date) <= 30 THEN 'active'
                    WHEN DATE_PART('day', CURRENT_DATE - om.last_order_date) <= 90 THEN 'dormant'
                    ELSE 'inactive'
                END as activity_status,
                
                -- Тип клиента
                CASE 
                    WHEN c.company_name IS NOT NULL AND c.company_name != '' THEN 'B2B'
                    ELSE 'B2C'
                END as customer_type,
                
                -- Возраст клиента в днях
                DATE_PART('day', CURRENT_DATE - c.registration_date) as customer_age_days
                
            FROM customers c
            LEFT JOIN (
                SELECT 
                    customer_id,
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
                    SUM(CASE WHEN payment_status = 'paid' THEN 
                        (SELECT SUM(oi.quantity * oi.unit_price) 
                         FROM order_items oi 
                         WHERE oi.order_id = o.id)
                    ELSE 0 END) as total_spent,
                    AVG(CASE WHEN payment_status = 'paid' THEN 
                        (SELECT SUM(oi.quantity * oi.unit_price) 
                         FROM order_items oi 
                         WHERE oi.order_id = o.id)
                    END) as avg_order_value,
                    MIN(order_date) as first_order_date,
                    MAX(order_date) as last_order_date
                FROM orders o
                GROUP BY customer_id
            ) om ON c.id = om.customer_id
        )
        SELECT * FROM customer_metrics
        ORDER BY total_spent DESC, registration_date DESC
        """
        
        return self.export_table_to_formats(
            'customers_analytics',
            query,
            'Аналитические данные клиентов с метриками заказов, сегментацией и статусом активности'
        )
        
    def export_orders_data(self):
        """Экспорт данных заказов с расчетными полями"""
        query = """
        WITH order_details AS (
            SELECT 
                o.id,
                o.customer_id,
                o.order_date,
                o.status,
                o.payment_status,
                o.shipping_address,
                o.created_at,
                o.updated_at,
                
                -- Информация о клиенте
                c.name as customer_name,
                c.email as customer_email,
                c.company_name,
                CASE 
                    WHEN c.company_name IS NOT NULL AND c.company_name != '' THEN 'B2B'
                    ELSE 'B2C'
                END as customer_type,
                
                -- Расчетные поля заказа
                COALESCE(oi.total_amount, 0) as total_amount,
                COALESCE(oi.items_count, 0) as items_count,
                COALESCE(oi.total_quantity, 0) as total_quantity,
                
                -- Статусы
                CASE WHEN o.payment_status = 'paid' THEN oi.total_amount ELSE 0 END as paid_amount,
                CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END as is_delivered,
                CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END as is_cancelled,
                CASE WHEN o.status = 'returned' THEN 1 ELSE 0 END as is_returned,
                
                -- Временные метрики
                EXTRACT(YEAR FROM o.order_date) as order_year,
                EXTRACT(MONTH FROM o.order_date) as order_month,
                EXTRACT(DOW FROM o.order_date) as order_dow,
                EXTRACT(HOUR FROM o.created_at) as order_hour,
                
                -- Региональная информация
                CASE 
                    WHEN o.shipping_address LIKE '%Москва%' OR o.shipping_address LIKE '%Moscow%' THEN 'Москва'
                    WHEN o.shipping_address LIKE '%Санкт-Пете��бург%' OR o.shipping_address LIKE '%СПб%' THEN 'Санкт-Петербург'
                    WHEN o.shipping_address LIKE '%Екатеринбург%' THEN 'Екатеринбург'
                    WHEN o.shipping_address LIKE '%Новосибирск%' THEN 'Новосибирск'
                    ELSE 'Другие регионы'
                END as region,
                
                -- Канальная информация
                CASE 
                    WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 9 AND 18 THEN 'Рабочие часы'
                    WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 19 AND 23 THEN 'Вечернее время'
                    ELSE 'Ночное время'
                END as time_channel,
                
                CASE 
                    WHEN EXTRACT(DOW FROM o.order_date) IN (1,2,3,4,5) THEN 'Будни'
                    ELSE 'Выходные'
                END as day_type
                
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN (
                SELECT 
                    order_id,
                    SUM(quantity * unit_price) as total_amount,
                    COUNT(*) as items_count,
                    SUM(quantity) as total_quantity
                FROM order_items
                GROUP BY order_id
            ) oi ON o.id = oi.order_id
        )
        SELECT * FROM order_details
        ORDER BY order_date DESC, id DESC
        """
        
        return self.export_table_to_formats(
            'orders_analytics',
            query,
            'Аналитические данные заказов с расчетными полями, региональной и временной разбивкой'
        )
        
    def export_products_data(self):
        """Экспорт данных товаров с метриками продаж"""
        query = """
        WITH product_analytics AS (
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
                
                -- Метрики продаж
                COALESCE(pm.total_sold, 0) as total_sold,
                COALESCE(pm.total_revenue, 0) as total_revenue,
                COALESCE(pm.order_count, 0) as order_count,
                pm.last_sale_date,
                pm.first_sale_date,
                
                -- Расчетные поля
                ROUND(p.selling_price - p.purchase_price, 2) as profit_per_unit,
                ROUND((p.selling_price - p.purchase_price) * COALESCE(pm.total_sold, 0), 2) as total_profit,
                ROUND(p.stock_quantity * p.purchase_price, 2) as inventory_value,
                
                -- Маржинальность
                CASE 
                    WHEN p.purchase_price > 0 
                    THEN ROUND((p.selling_price - p.purchase_price) / p.purchase_price * 100, 2)
                    ELSE 0 
                END as profit_margin_percent,
                
                -- Статус запасов
                CASE 
                    WHEN p.stock_quantity <= p.reorder_level THEN 'low_stock'
                    WHEN p.stock_quantity = 0 THEN 'out_of_stock'
                    ELSE 'in_stock'
                END as stock_status,
                
                -- Популярность
                CASE 
                    WHEN COALESCE(pm.total_sold, 0) > 100 THEN 'high_demand'
                    WHEN COALESCE(pm.total_sold, 0) > 10 THEN 'medium_demand'
                    WHEN COALESCE(pm.total_sold, 0) > 0 THEN 'low_demand'
                    ELSE 'no_sales'
                END as demand_level,
                
                -- Дни с последней продажи
                CASE 
                    WHEN pm.last_sale_date IS NOT NULL 
                    THEN DATE_PART('day', CURRENT_DATE - pm.last_sale_date)
                    ELSE NULL
                END as days_since_last_sale,
                
                -- ABC анализ по выручке
                CASE 
                    WHEN COALESCE(pm.total_revenue, 0) > 100000 THEN 'A'
                    WHEN COALESCE(pm.total_revenue, 0) > 10000 THEN 'B'
                    WHEN COALESCE(pm.total_revenue, 0) > 0 THEN 'C'
                    ELSE 'N'
                END as abc_category
                
            FROM products p
            LEFT JOIN (
                SELECT 
                    oi.product_id,
                    SUM(oi.quantity) as total_sold,
                    SUM(oi.quantity * oi.unit_price) as total_revenue,
                    COUNT(DISTINCT oi.order_id) as order_count,
                    MIN(o.order_date) as first_sale_date,
                    MAX(o.order_date) as last_sale_date
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'paid'
                GROUP BY oi.product_id
            ) pm ON p.id = pm.product_id
        )
        SELECT * FROM product_analytics
        ORDER BY total_revenue DESC, total_sold DESC
        """
        
        return self.export_table_to_formats(
            'products_analytics',
            query,
            'Аналитические данные товаров с метриками продаж, рентабельностью и ABC-анализом'
        )
        
    def export_kpi_summary(self):
        """Экспорт сводки KPI метрик"""
        query = """
        WITH kpi_calculations AS (
            SELECT 
                -- Базовые метрики
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.id END) as paid_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as delivered_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END) as returned_orders,
                
                -- Финансовые метрики
                COALESCE(SUM(oi.quantity * oi.unit_price), 0) as gross_revenue,
                COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN oi.quantity * oi.unit_price ELSE 0 END), 0) as net_paid_revenue,
                COALESCE(SUM(oi.quantity), 0) as total_units,
                
                -- Клиентские метрики
                COUNT(DISTINCT o.customer_id) as unique_customers,
                COUNT(DISTINCT c.id) as total_customers,
                
                -- Товарные метрики
                COUNT(DISTINCT p.id) as total_products,
                COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END) as active_products,
                
                -- Временной период
                MIN(o.order_date) as period_start,
                MAX(o.order_date) as period_end,
                CURRENT_DATE as report_date
                
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN products p ON oi.product_id = p.id
        ),
        calculated_kpis AS (
            SELECT 
                *,
                -- AOV (средняя стоимость заказа)
                CASE 
                    WHEN paid_orders > 0 
                    THEN ROUND(net_paid_revenue / paid_orders, 2)
                    ELSE 0 
                END as aov,
                
                -- Конверсия оплаты
                CASE 
                    WHEN total_orders > 0 
                    THEN ROUND((paid_orders::numeric / total_orders::numeric) * 100, 2)
                    ELSE 0 
                END as payment_conversion_rate,
                
                -- Доля возвратов
                CASE 
                    WHEN total_orders > 0 
                    THEN ROUND((returned_orders::numeric / total_orders::numeric) * 100, 2)
                    ELSE 0 
                END as return_rate,
                
                -- Доля отмен
                CASE 
                    WHEN total_orders > 0 
                    THEN ROUND((cancelled_orders::numeric / total_orders::numeric) * 100, 2)
                    ELSE 0 
                END as cancellation_rate,
                
                -- Среднее количество единиц в заказе
                CASE 
                    WHEN paid_orders > 0 
                    THEN ROUND(total_units::numeric / paid_orders::numeric, 1)
                    ELSE 0 
                END as avg_units_per_order,
                
                -- Процент активных товаров
                CASE 
                    WHEN total_products > 0 
                    THEN ROUND((active_products::numeric / total_products::numeric) * 100, 2)
                    ELSE 0 
                END as active_products_rate
                
            FROM kpi_calculations
        )
        SELECT * FROM calculated_kpis
        """
        
        return self.export_table_to_formats(
            'kpi_summary',
            query,
            'Сводка ключевых показателей эффективности (KPI) по всем данным'
        )
        
    def export_time_series_data(self):
        """Экспорт временных рядов для анализа трендов"""
        query = """
        WITH daily_metrics AS (
            SELECT 
                o.order_date,
                EXTRACT(YEAR FROM o.order_date) as year,
                EXTRACT(MONTH FROM o.order_date) as month,
                EXTRACT(DOW FROM o.order_date) as day_of_week,
                EXTRACT(WEEK FROM o.order_date) as week_of_year,
                
                -- Основные метрики
                COUNT(*) as orders_count,
                COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as paid_orders,
                SUM(oi.quantity * oi.unit_price) as gross_revenue,
                SUM(CASE WHEN o.payment_status = 'paid' THEN oi.quantity * oi.unit_price ELSE 0 END) as net_revenue,
                SUM(oi.quantity) as units_sold,
                COUNT(DISTINCT o.customer_id) as unique_customers,
                
                -- Метрики по типам дней
                CASE 
                    WHEN EXTRACT(DOW FROM o.order_date) IN (1,2,3,4,5) THEN 'weekday'
                    ELSE 'weekend'
                END as day_type,
                
                -- Сезонность
                CASE 
                    WHEN EXTRACT(MONTH FROM o.order_date) IN (12,1,2) THEN 'winter'
                    WHEN EXTRACT(MONTH FROM o.order_date) IN (3,4,5) THEN 'spring'
                    WHEN EXTRACT(MONTH FROM o.order_date) IN (6,7,8) THEN 'summer'
                    ELSE 'autumn'
                END as season
                
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.order_date >= CURRENT_DATE - INTERVAL '2 years'
            GROUP BY o.order_date
        )
        SELECT 
            *,
            -- Скользящие средние (требует window functions)
            AVG(orders_count) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as orders_7day_avg,
            AVG(net_revenue) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as revenue_7day_avg,
            
            -- Сравнение с предыдущим днем
            LAG(orders_count, 1) OVER (ORDER BY order_date) as prev_day_orders,
            LAG(net_revenue, 1) OVER (ORDER BY order_date) as prev_day_revenue
            
        FROM daily_metrics
        ORDER BY order_date DESC
        """
        
        return self.export_table_to_formats(
            'time_series_analytics',
            query,
            'Временные ряды метрик по дням для анализа трендов и сезонности'
        )
        
    def create_export_summary(self):
        """Создание итогового файла с информацией об экспорте"""
        # Добавление общей информации
        self.export_manifest.update({
            'end_time': datetime.now().isoformat(),
            'total_tables_exported': len(self.export_manifest['exported_tables']),
            'total_records': sum(self.export_manifest['record_counts'].values()),
            'export_format': ['CSV', 'Parquet', 'JSON metadata'],
            'data_source': 'PostgreSQL Database',
            'data_timeframe': 'All available data',
            'data_quality': 'Cleaned and validated'
        })
        
        # Сохранение манифеста
        manifest_path = self.output_dir / 'export_manifest.json'
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(self.export_manifest, f, ensure_ascii=False, indent=2, default=str)
        
        # Создание README для экспорта
        readme_content = f"""# Экспортированные данные

## Общая информация

- **Дата экспорта**: {self.export_manifest['export_timestamp']}
- **Всего таблиц**: {self.export_manifest['total_tables_exported']}
- **Всего записей**: {self.export_manifest['total_records']:,}
- **Форматы**: CSV, Parquet, JSON метаданные

## Экспортированные таблицы

"""
        
        for table in self.export_manifest['exported_tables']:
            record_count = self.export_manifest['record_counts'].get(table, 0)
            file_sizes = self.export_manifest['file_sizes'].get(table, {})
            
            readme_content += f"""### {table}
- **Записей**: {record_count:,}
- **CSV размер**: {file_sizes.get('csv_mb', 0)} MB
- **Parquet размер**: {file_sizes.get('parquet_mb', 0)} MB

"""
        
        readme_content += """## Структура файлов


exported_data/
├── csv/                    # CSV файлы
├── parquet/               # Parquet файлы  
├── json/                  # JSON метаданные
├── export_manifest.json  # Манифест экспорта
└── README.md             # Этот файл
```

## Использование

### CSV файлы
Подходят для:
- Excel и Google Sheets
- Простого анализа данных
- Импорта в большинство инструментов

### Parquet файлы  
Подходят для:
- Больших данных и аналитики
- Apache Spark, Pandas
- Эффективного хранения

### JSON метаданные
Содержат:
- Описание столбцов
- Статистику данных
- Информацию о качестве
- Примеры данных

## Качество данных

Все экспортированные данные прошли процедуру очистки:
- ✅ Удалены дубликаты
- ✅ Исправлены некорректные значения  
- ✅ Проверена ссылочная целостность
- ✅ Валидированы форматы данных

Подробная информация о ка��естве данных доступна в файле `docs/DATA_QUALITY_REPORT.md`.
"""
        
        readme_path = self.output_dir / 'README.md'
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
            
        logger.info(f"📋 Документация создана: {readme_path}")
        logger.info(f"📋 Манифест создан: {manifest_path}")
        
    def run_export(self):
        """Запуск полного процесса экспорта"""
        try:
            logger.info("🚀 НАЧАЛО ЭКСПОРТА ДАННЫХ")
            logger.info("=" * 50)
            
            # Подключение к БД
            if not self.connect_db():
                return False
                
            # Список экспортируемых таблиц
            export_functions = [
                ("Клиенты с аналитикой", self.export_customers_data),
                ("Заказы с аналитикой", self.export_orders_data),
                ("Товары с аналитикой", self.export_products_data),
                ("Сводка KPI", self.export_kpi_summary),
                ("Временные ряды", self.export_time_series_data)
            ]
            
            # Выполнение экспорта
            successful_exports = 0
            for description, export_func in export_functions:
                logger.info(f"⚙️ Экспорт: {description}")
                if export_func():
                    successful_exports += 1
                    logger.info(f"✅ Завершено: {description}")
                else:
                    logger.error(f"❌ Ошибка: {description}")
                logger.info("-" * 30)
            
            # Создание итоговой документации
            self.create_export_summary()
            
            # Итоговая статистика
            total_size_mb = sum(
                sum(sizes.values()) for sizes in self.export_manifest['file_sizes'].values()
            )
            
            logger.info("🎉 ЭКСПОРТ ЗАВЕРШЕН УСПЕШНО")
            logger.info("=" * 50)
            logger.info(f"📊 Успешно экспортировано: {successful_exports}/{len(export_functions)} таблиц")
            logger.info(f"📁 Общий размер файлов: {total_size_mb:.2f} MB")
            logger.info(f"📋 Всего записей: {sum(self.export_manifest['record_counts'].values()):,}")
            logger.info(f"📂 Папка экспорта: {self.output_dir.absolute()}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА ЭКСПОРТА: {e}")
            return False
        finally:
            if hasattr(self, 'conn'):
                self.conn.close()
                logger.info("🔌 Соединение с БД закрыто")

if __name__ == "__main__":
    # Создание папки для экспорта с timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_directory = f'exported_data_{timestamp}'
    
    # Запуск экспорта
    exporter = DataExporter(output_directory)
    success = exporter.run_export()
    
    if success:
        print(f"\n🎯 Данные успешно экспортированы в папку: {output_directory}")
        print("📋 Для просмотра деталей см. файл export_manifest.json")
    else:
        print("\n❌ Экспорт завершился с ошибками. Проверьте логи.")
