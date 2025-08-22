#!/usr/bin/env python3
"""
Быстрый экспорт основных таблиц в CSV формат
Упрощенная версия для быстрого получения данных
"""

import pandas as pd
import psycopg2
import os
from datetime import datetime
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Конфигурация БД
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '103.246.146.132'),
    'port': os.getenv('DB_PORT', 5432),
    'database': os.getenv('DB_NAME', 'hackathon'),
    'user': os.getenv('DB_USER', 'user_db'),
    'password': os.getenv('DB_PASSWORD', 'psql14182025')
}

def export_table(conn, table_name, query=None):
    """Экспорт таблицы в CSV"""
    if query is None:
        query = f"SELECT * FROM {table_name}"
    
    print(f"📊 Экспорт таблицы: {table_name}")
    
    try:
        df = pd.read_sql(query, conn)
        
        # Создание имени файла с timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{table_name}_{timestamp}.csv"
        
        # Экспорт в CSV
        df.to_csv(filename, index=False, encoding='utf-8')
        
        print(f"✅ Экспортировано: {filename} ({len(df):,} записей)")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка экспорта {table_name}: {e}")
        return False

def main():
    """Основная функция экспорта"""
    print("🚀 Быстрый экспорт основных таблиц")
    print("=" * 40)
    
    try:
        # Подключение к БД
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Подключение к БД установлено")
        
        # Список таблиц для экспорта
        tables_to_export = [
            ('customers', 'SELECT * FROM customers ORDER BY id'),
            ('orders', 'SELECT * FROM orders ORDER BY order_date DESC'),
            ('order_items', 'SELECT * FROM order_items ORDER BY order_id, id'),
            ('products', 'SELECT * FROM products WHERE is_active = true ORDER BY name'),
        ]
        
        successful_exports = 0
        
        for table_name, query in tables_to_export:
            if export_table(conn, table_name, query):
                successful_exports += 1
            print("-" * 30)
        
        print(f"🎉 Экспорт завершен: {successful_exports}/{len(tables_to_export)} таблиц")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("🔌 Соединение с БД закрыто")

if __name__ == "__main__":
    main()
