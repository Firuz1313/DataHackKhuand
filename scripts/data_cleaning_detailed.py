#!/usr/bin/env python3
"""
Скрипт очистки данных с детальной отчетностью
Подсчит��вает строки до/после обработки и предоставляет обоснования для всех операций
"""

import psycopg2
import pandas as pd
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple
import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_cleaning.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self):
        """Инициализация подключения к базе данных"""
        self.conn = None
        self.cur = None
        self.cleaning_report = {
            'start_time': datetime.now().isoformat(),
            'operations': [],
            'summary': {},
            'end_time': None
        }
        
    def connect_db(self):
        """Подключение к базе данных"""
        try:
            self.conn = psycopg2.connect(
                host=os.getenv('DB_HOST', '103.246.146.132'),
                port=os.getenv('DB_PORT', 5432),
                database=os.getenv('DB_NAME', 'hackathon'),
                user=os.getenv('DB_USER', 'user_db'),
                password=os.getenv('DB_PASSWORD', 'psql14182025')
            )
            self.cur = self.conn.cursor()
            logger.info("✅ Подключение к базе данных установлено")
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к БД: {e}")
            raise
            
    def disconnect_db(self):
        """Отключение от базы данных"""
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
        logger.info("🔌 Соединение с БД закрыто")
        
    def count_rows(self, table_name: str, condition: str = "") -> int:
        """Подсчет строк в таблице с опциональным условием"""
        query = f"SELECT COUNT(*) FROM {table_name}"
        if condition:
            query += f" WHERE {condition}"
            
        self.cur.execute(query)
        return self.cur.fetchone()[0]
        
    def log_operation(self, operation_name: str, table_name: str, rows_before: int, 
                     rows_after: int, description: str, justification: str):
        """Логирование операции очистки"""
        operation = {
            'operation': operation_name,
            'table': table_name,
            'rows_before': rows_before,
            'rows_after': rows_after,
            'rows_affected': rows_before - rows_after,
            'description': description,
            'justification': justification,
            'timestamp': datetime.now().isoformat()
        }
        
        self.cleaning_report['operations'].append(operation)
        
        logger.info(f"📊 {operation_name} | {table_name}")
        logger.info(f"   До: {rows_before:,} строк")
        logger.info(f"   После: {rows_after:,} строк") 
        logger.info(f"   Удалено: {rows_before - rows_after:,} строк")
        logger.info(f"   Обоснование: {justification}")
        
    def clean_duplicate_customers(self):
        """Очистка дубликатов клиентов"""
        table_name = "customers"
        operation_name = "Удаление дубликатов клиентов"
        
        # Подсчет до очистки
        rows_before = self.count_rows(table_name)
        
        # Поиск дубликатов по email
        duplicate_query = """
        WITH duplicates AS (
            SELECT email, MIN(id) as keep_id, COUNT(*) as count
            FROM customers 
            WHERE email IS NOT NULL AND email != ''
            GROUP BY email 
            HAVING COUNT(*) > 1
        )
        SELECT SUM(count - 1) FROM duplicates
        """
        
        self.cur.execute(duplicate_query)
        duplicates_count = self.cur.fetchone()[0] or 0
        
        if duplicates_count > 0:
            # Удаление дубликатов (оставляем запись с минимальным ID)
            delete_query = """
            DELETE FROM customers 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM customers 
                WHERE email IS NOT NULL AND email != ''
                GROUP BY email
            ) AND email IS NOT NULL AND email != ''
            """
            
            self.cur.execute(delete_query)
            self.conn.commit()
            
        # Подсчет после очистки
        rows_after = self.count_rows(table_name)
        
        self.log_operation(
            operation_name, table_name, rows_before, rows_after,
            f"Удалены дублирующиеся записи клиентов ��о email",
            f"Дубликаты клиентов искажают аналитику и могут приводить к ошибкам в расчетах. "
            f"Оставлены записи с наименьшим ID как наиболее ранние."
        )
        
    def clean_invalid_orders(self):
        """Очистка некорректных заказов"""
        table_name = "orders"
        operation_name = "Очистка некорректных заказов"
        
        # Подсчет до очистки
        rows_before = self.count_rows(table_name)
        
        # Удаление заказов без товаров
        delete_query = """
        DELETE FROM orders 
        WHERE id NOT IN (
            SELECT DISTINCT order_id 
            FROM order_items 
            WHERE order_id IS NOT NULL
        )
        """
        
        self.cur.execute(delete_query)
        
        # Удаление заказов с некорректными датами
        delete_future_orders = """
        DELETE FROM orders 
        WHERE order_date > CURRENT_DATE
        """
        
        self.cur.execute(delete_future_orders)
        
        # Удаление заказов с некорректными customer_id
        delete_orphan_orders = """
        DELETE FROM orders 
        WHERE customer_id NOT IN (
            SELECT id FROM customers WHERE id IS NOT NULL
        )
        """
        
        self.cur.execute(delete_orphan_orders)
        
        self.conn.commit()
        
        # Подсчет после очистки
        rows_after = self.count_rows(table_name)
        
        self.log_operation(
            operation_name, table_name, rows_before, rows_after,
            "Удалены заказы без товаров, с будущими датами и несуществующими клиентами",
            "Некорректные заказы искажают бизнес-метрики и анализ воронки продаж. "
            "Заказы без товаров не имеют коммерческой ценности."
        )
        
    def clean_invalid_order_items(self):
        """Очистка некорректных позиций заказов"""
        table_name = "order_items"
        operation_name = "Очистка некорректных позиций заказов"
        
        # Подсчет до очистки
        rows_before = self.count_rows(table_name)
        
        # Удаление позиций с некорректными количествами или ценами
        delete_query = """
        DELETE FROM order_items 
        WHERE quantity <= 0 
           OR unit_price < 0
           OR quantity IS NULL 
           OR unit_price IS NULL
           OR product_id NOT IN (SELECT id FROM products WHERE id IS NOT NULL)
        """
        
        self.cur.execute(delete_query)
        self.conn.commit()
        
        # Подсчет после очистки
        rows_after = self.count_rows(table_name)
        
        self.log_operation(
            operation_name, table_name, rows_before, rows_after,
            "Удалены позиции с некорректными количествами, ценами или несуществующими товарами",
            "Позиции с нулевым количеством или отрицательными ценами не могут быть реальными "
            "коммерческими операциями и искажают расчет выручки."
        )
        
    def clean_inactive_products(self):
        """Архивирование неактивных товаров"""
        table_name = "products"
        operation_name = "Архивирование устаревших товаров"
        
        # Подсчет до очистки
        rows_before = self.count_rows(table_name, "is_active = true")
        
        # Деактивация товаров без продаж за последние 12 месяцев
        deactivate_query = """
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
          AND created_at < CURRENT_DATE - INTERVAL '12 months'
        """
        
        self.cur.execute(deactivate_query)
        self.conn.commit()
        
        # Подсчет после очистки
        rows_after = self.count_rows(table_name, "is_active = true")
        
        self.log_operation(
            operation_name, table_name, rows_before, rows_after,
            "Деактивированы товары без продаж за последние 12 месяцев",
            "Неа��тивные товары загромождают каталог и усложняют аналитику. "
            "Архивирование помогает сосредоточиться на актуальном ассортименте."
        )
        
    def clean_test_data(self):
        """Удаление тестовых данных"""
        operations = []
        
        # Тестовые клиенты
        test_customers_before = self.count_rows("customers", 
            "email LIKE '%test%' OR email LIKE '%example%' OR name LIKE '%Test%'")
        
        if test_customers_before > 0:
            delete_test_customers = """
            DELETE FROM customers 
            WHERE email LIKE '%test%' 
               OR email LIKE '%example%' 
               OR name LIKE '%Test%'
               OR name LIKE '%test%'
            """
            self.cur.execute(delete_test_customers)
            
            test_customers_after = self.count_rows("customers", 
                "email LIKE '%test%' OR email LIKE '%example%' OR name LIKE '%Test%'")
            
            self.log_operation(
                "Удаление тестовых клиентов", "customers", 
                test_customers_before, test_customers_after,
                "Удалены клиенты с тестовыми email и именами",
                "Тестовые данные искажают реальную аналитику и метрики бизнеса."
            )
        
        # Тестовые заказы (заказы с очень маленькими суммами)
        test_orders_query = """
        SELECT COUNT(*) FROM orders o
        WHERE (
            SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
            FROM order_items oi 
            WHERE oi.order_id = o.id
        ) < 1
        """
        
        self.cur.execute(test_orders_query)
        test_orders_before = self.cur.fetchone()[0]
        
        if test_orders_before > 0:
            delete_test_orders = """
            DELETE FROM orders 
            WHERE id IN (
                SELECT o.id FROM orders o
                WHERE (
                    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
                    FROM order_items oi 
                    WHERE oi.order_id = o.id
                ) < 1
            )
            """
            self.cur.execute(delete_test_orders)
            
            self.cur.execute(test_orders_query)
            test_orders_after = self.cur.fetchone()[0]
            
            self.log_operation(
                "Удаление тестовых заказов", "orders",
                test_orders_before, test_orders_after,
                "Удалены заказы с суммой менее 1 рубля",
                "Заказы с символическими суммами являются тестовыми и не отражают реальные продажи."
            )
        
        self.conn.commit()
        
    def update_computed_fields(self):
        """Обновление вычисляемых полей"""
        logger.info("🔄 Обновление вычисляемых полей...")
        
        # Обновление updated_at для измененных записей
        update_customers = """
        UPDATE customers 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE updated_at < created_at OR updated_at IS NULL
        """
        
        update_products = """
        UPDATE products 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE updated_at < created_at OR updated_at IS NULL
        """
        
        update_orders = """
        UPDATE orders 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE updated_at < created_at OR updated_at IS NULL
        """
        
        self.cur.execute(update_customers)
        self.cur.execute(update_products)
        self.cur.execute(update_orders)
        
        self.conn.commit()
        logger.info("✅ Вычисляемые поля обновлены")
        
    def generate_summary(self):
        """Генерация итогового отчета"""
        total_operations = len(self.cleaning_report['operations'])
        total_rows_affected = sum(op['rows_affected'] for op in self.cleaning_report['operations'])
        
        # Финальные счетчики таблиц
        final_counts = {}
        tables = ['customers', 'orders', 'order_items', 'products']
        
        for table in tables:
            try:
                final_counts[table] = self.count_rows(table)
            except Exception as e:
                logger.warning(f"Не удалось получить количество строк для {table}: {e}")
                final_counts[table] = 0
        
        self.cleaning_report['summary'] = {
            'total_operations': total_operations,
            'total_rows_affected': total_rows_affected,
            'final_table_counts': final_counts,
            'status': 'completed'
        }
        
        self.cleaning_report['end_time'] = datetime.now().isoformat()
        
        # Сохранение отчета в файл
        report_filename = f"data_cleaning_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(self.cleaning_report, f, ensure_ascii=False, indent=2)
            
        logger.info(f"📊 ИТОГОВЫЙ ОТЧЕТ:")
        logger.info(f"   Всего операций: {total_operations}")
        logger.info(f"   Строк обработано: {total_rows_affected:,}")
        logger.info(f"   Отчет сохранен: {report_filename}")
        
        # Вывод финальных счетчиков
        logger.info(f"📈 ФИНАЛЬНЫЕ СЧЕТЧИКИ ТАБЛИЦ:")
        for table, count in final_counts.items():
            logger.info(f"   {table}: {count:,} строк")
            
    def run_cleaning(self):
        """Запуск полного цикла очистки данных"""
        try:
            logger.info("🚀 НАЧАЛО ОЧИСТКИ ДАННЫХ")
            logger.info("=" * 50)
            
            self.connect_db()
            
            # Последовательность операций очистки
            cleaning_operations = [
                ("Удаление тестовых данных", self.clean_test_data),
                ("Очистка дубликатов клиентов", self.clean_duplicate_customers),
                ("Очистка некорректных заказов", self.clean_invalid_orders),
                ("Очистка позиций заказов", self.clean_invalid_order_items),
                ("Архивирование товаров", self.clean_inactive_products),
                ("Обновление полей", self.update_computed_fields)
            ]
            
            for operation_name, operation_func in cleaning_operations:
                logger.info(f"⚙️ Выполнение: {operation_name}")
                operation_func()
                logger.info(f"✅ Завершено: {operation_name}")
                logger.info("-" * 30)
            
            self.generate_summary()
            
            logger.info("🎉 ОЧИСТКА ДАННЫХ ЗАВЕРШЕНА УСПЕШНО")
            logger.info("=" * 50)
            
        except Exception as e:
            logger.error(f"❌ ОШИБКА ПРИ ОЧИСТКЕ ДАННЫХ: {e}")
            self.cleaning_report['summary'] = {
                'status': 'failed',
                'error': str(e)
            }
            raise
        finally:
            self.disconnect_db()

if __name__ == "__main__":
    cleaner = DataCleaner()
    cleaner.run_cleaning()
