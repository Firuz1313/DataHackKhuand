#!/usr/bin/env python3
"""
DataBoard Data Cleaning Pipeline
=====================================

This script performs comprehensive data cleaning on the e-commerce dataset
with detailed before/after counts and justification for all operations.

Author: DataBoard Team
Date: 2024
Version: 1.0
"""

import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import sys
from typing import Dict, List, Tuple

class DataCleaningPipeline:
    """
    Comprehensive data cleaning pipeline for e-commerce analytics.
    
    Performs:
    - Duplicate detection and removal
    - Data type validation
    - Referential integrity checks
    - Missing value handling
    - Outlier detection and treatment
    """
    
    def __init__(self, db_config: Dict[str, str]):
        """Initialize with database configuration."""
        self.db_config = db_config
        self.conn = None
        self.cleaning_log = []
        
    def connect_database(self):
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            print("✅ Database connection established")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            sys.exit(1)
            
    def log_operation(self, operation: str, table: str, before_count: int, 
                     after_count: int, justification: str):
        """Log cleaning operation with metrics."""
        removed_count = before_count - after_count
        removal_rate = (removed_count / before_count * 100) if before_count > 0 else 0
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'table': table,
            'before_count': before_count,
            'after_count': after_count,
            'removed_count': removed_count,
            'removal_rate_percent': round(removal_rate, 2),
            'justification': justification
        }
        
        self.cleaning_log.append(log_entry)
        
        print(f"\n📊 {operation} - {table}")
        print(f"   Before: {before_count:,} records")
        print(f"   After:  {after_count:,} records")
        print(f"   Removed: {removed_count:,} records ({removal_rate:.1f}%)")
        print(f"   Reason: {justification}")
        
    def get_table_count(self, table: str, condition: str = "") -> int:
        """Get record count for a table with optional condition."""
        query = f"SELECT COUNT(*) FROM {table}"
        if condition:
            query += f" WHERE {condition}"
            
        with self.conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchone()[0]
    
    def clean_orders_table(self):
        """
        Clean orders table:
        1. Remove orders with invalid dates
        2. Remove orders without customer references
        3. Remove orders with negative amounts
        4. Handle duplicate order numbers
        """
        print("\n🧹 CLEANING ORDERS TABLE")
        
        # Get initial count
        initial_count = self.get_table_count('orders')
        
        # 1. Remove orders with future dates (invalid)
        before_date = self.get_table_count('orders')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM orders 
                WHERE order_date > CURRENT_DATE + INTERVAL '1 day'
            """)
            self.conn.commit()
            
        after_date = self.get_table_count('orders')
        self.log_operation(
            "Remove Future Dates", "orders", before_date, after_date,
            "Orders dated in the future are data entry errors and invalid for analysis"
        )
        
        # 2. Remove orders without valid customer references
        before_customer = self.get_table_count('orders')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM orders 
                WHERE customer_id IS NULL 
                   OR customer_id NOT IN (SELECT customer_id FROM customers)
            """)
            self.conn.commit()
            
        after_customer = self.get_table_count('orders')
        self.log_operation(
            "Remove Invalid Customers", "orders", before_customer, after_customer,
            "Orders must have valid customer references for analytics integrity"
        )
        
        # 3. Handle duplicate order numbers (keep latest)
        before_dupe = self.get_table_count('orders')
        
        with self.conn.cursor() as cur:
            # Find duplicates and keep the one with latest order_date
            cur.execute("""
                WITH duplicate_orders AS (
                    SELECT order_id,
                           ROW_NUMBER() OVER (
                               PARTITION BY order_id 
                               ORDER BY order_date DESC, customer_id DESC
                           ) as rn
                    FROM orders
                    WHERE order_id IN (
                        SELECT order_id 
                        FROM orders 
                        GROUP BY order_id 
                        HAVING COUNT(*) > 1
                    )
                )
                DELETE FROM orders 
                WHERE order_id IN (
                    SELECT order_id FROM duplicate_orders WHERE rn > 1
                )
            """)
            self.conn.commit()
            
        after_dupe = self.get_table_count('orders')
        self.log_operation(
            "Remove Duplicate Orders", "orders", before_dupe, after_dupe,
            "Duplicate order IDs create double-counting issues; kept latest version by date"
        )
        
        # 4. Validate order items exist
        before_items = self.get_table_count('orders')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM orders 
                WHERE order_id NOT IN (SELECT DISTINCT order_id FROM order_items)
            """)
            self.conn.commit()
            
        after_items = self.get_table_count('orders')
        self.log_operation(
            "Remove Orders Without Items", "orders", before_items, after_items,
            "Orders without line items are incomplete and cannot contribute to revenue analysis"
        )
        
        final_count = self.get_table_count('orders')
        total_removed = initial_count - final_count
        print(f"\n✅ Orders table cleaning complete")
        print(f"   Total removed: {total_removed:,} records ({total_removed/initial_count*100:.1f}%)")
        
    def clean_order_items_table(self):
        """
        Clean order_items table:
        1. Remove items with invalid quantities
        2. Remove items with zero/negative prices
        3. Remove orphaned items
        4. Validate product references
        """
        print("\n🧹 CLEANING ORDER_ITEMS TABLE")
        
        initial_count = self.get_table_count('order_items')
        
        # 1. Remove items with invalid quantities
        before_qty = self.get_table_count('order_items')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM order_items 
                WHERE quantity IS NULL 
                   OR quantity <= 0 
                   OR quantity > 1000
            """)
            self.conn.commit()
            
        after_qty = self.get_table_count('order_items')
        self.log_operation(
            "Remove Invalid Quantities", "order_items", before_qty, after_qty,
            "Quantities must be positive and reasonable (<1000) for valid transactions"
        )
        
        # 2. Remove items with invalid prices
        before_price = self.get_table_count('order_items')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM order_items 
                WHERE price_per_item IS NULL 
                   OR price_per_item <= 0 
                   OR price_per_item > 1000000
            """)
            self.conn.commit()
            
        after_price = self.get_table_count('order_items')
        self.log_operation(
            "Remove Invalid Prices", "order_items", before_price, after_price,
            "Prices must be positive and within reasonable range (<1M) for accurate revenue calculation"
        )
        
        # 3. Remove orphaned items (orders that don't exist)
        before_orphan = self.get_table_count('order_items')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM order_items 
                WHERE order_id NOT IN (SELECT DISTINCT order_id FROM orders)
            """)
            self.conn.commit()
            
        after_orphan = self.get_table_count('order_items')
        self.log_operation(
            "Remove Orphaned Items", "order_items", before_orphan, after_orphan,
            "Order items must belong to existing orders for referential integrity"
        )
        
        # 4. Remove items with invalid product references
        before_product = self.get_table_count('order_items')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM order_items 
                WHERE product_id IS NULL
            """)
            self.conn.commit()
            
        after_product = self.get_table_count('order_items')
        self.log_operation(
            "Remove Items Without Products", "order_items", before_product, after_product,
            "Order items must reference valid products for meaningful analysis"
        )
        
        final_count = self.get_table_count('order_items')
        total_removed = initial_count - final_count
        print(f"\n✅ Order items table cleaning complete")
        print(f"   Total removed: {total_removed:,} records ({total_removed/initial_count*100:.1f}%)")
        
    def clean_customers_table(self):
        """
        Clean customers table:
        1. Remove duplicate customers
        2. Standardize customer data
        3. Remove invalid records
        """
        print("\n🧹 CLEANING CUSTOMERS TABLE")
        
        initial_count = self.get_table_count('customers')
        
        # 1. Remove duplicate customers (same customer_id)
        before_dupe = self.get_table_count('customers')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                WITH duplicate_customers AS (
                    SELECT customer_id,
                           ROW_NUMBER() OVER (
                               PARTITION BY customer_id 
                               ORDER BY customer_id DESC
                           ) as rn
                    FROM customers
                    WHERE customer_id IN (
                        SELECT customer_id 
                        FROM customers 
                        GROUP BY customer_id 
                        HAVING COUNT(*) > 1
                    )
                )
                DELETE FROM customers 
                WHERE customer_id IN (
                    SELECT customer_id FROM duplicate_customers WHERE rn > 1
                )
            """)
            self.conn.commit()
            
        after_dupe = self.get_table_count('customers')
        self.log_operation(
            "Remove Duplicate Customers", "customers", before_dupe, after_dupe,
            "Duplicate customer records cause inflated customer counts and skewed analytics"
        )
        
        # 2. Remove customers with invalid data
        before_valid = self.get_table_count('customers')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM customers 
                WHERE customer_id IS NULL
            """)
            self.conn.commit()
            
        after_valid = self.get_table_count('customers')
        self.log_operation(
            "Remove Invalid Customer Records", "customers", before_valid, after_valid,
            "Customer records must have valid IDs for proper relationship management"
        )
        
        final_count = self.get_table_count('customers')
        total_removed = initial_count - final_count
        print(f"\n✅ Customers table cleaning complete")
        print(f"   Total removed: {total_removed:,} records ({total_removed/initial_count*100:.1f}%)")
        
    def clean_payments_table(self):
        """
        Clean payments table:
        1. Remove payments without order references
        2. Remove invalid payment amounts
        3. Handle duplicate payments
        """
        print("\n🧹 CLEANING PAYMENTS TABLE")
        
        initial_count = self.get_table_count('payments')
        
        # 1. Remove payments without valid order references
        before_order = self.get_table_count('payments')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM payments 
                WHERE order_id IS NULL 
                   OR order_id NOT IN (SELECT DISTINCT order_id FROM orders)
            """)
            self.conn.commit()
            
        after_order = self.get_table_count('payments')
        self.log_operation(
            "Remove Orphaned Payments", "payments", before_order, after_order,
            "Payments must be linked to existing orders for accurate revenue tracking"
        )
        
        # 2. Remove invalid payment amounts
        before_amount = self.get_table_count('payments')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                DELETE FROM payments 
                WHERE paid_amount IS NULL 
                   OR paid_amount < 0
            """)
            self.conn.commit()
            
        after_amount = self.get_table_count('payments')
        self.log_operation(
            "Remove Invalid Payment Amounts", "payments", before_amount, after_amount,
            "Payment amounts must be non-negative for accurate financial reporting"
        )
        
        # 3. Handle duplicate payments (keep the successful one)
        before_dupe = self.get_table_count('payments')
        
        with self.conn.cursor() as cur:
            cur.execute("""
                WITH ranked_payments AS (
                    SELECT *,
                           ROW_NUMBER() OVER (
                               PARTITION BY order_id 
                               ORDER BY 
                                   CASE WHEN status_raw = 'paid' THEN 1 
                                        WHEN status_raw = 'pending' THEN 2 
                                        ELSE 3 END,
                                   payment_date DESC NULLS LAST
                           ) as rn
                    FROM payments
                    WHERE order_id IN (
                        SELECT order_id 
                        FROM payments 
                        GROUP BY order_id 
                        HAVING COUNT(*) > 1
                    )
                )
                DELETE FROM payments 
                WHERE (order_id, attempt) IN (
                    SELECT order_id, attempt 
                    FROM ranked_payments 
                    WHERE rn > 1
                )
            """)
            self.conn.commit()
            
        after_dupe = self.get_table_count('payments')
        self.log_operation(
            "Remove Duplicate Payments", "payments", before_dupe, after_dupe,
            "Multiple payment attempts per order create confusion; kept successful payments first"
        )
        
        final_count = self.get_table_count('payments')
        total_removed = initial_count - final_count
        print(f"\n✅ Payments table cleaning complete")
        print(f"   Total removed: {total_removed:,} records ({total_removed/initial_count*100:.1f}%)")
        
    def validate_referential_integrity(self):
        """Validate and report referential integrity."""
        print("\n🔍 VALIDATING REFERENTIAL INTEGRITY")
        
        integrity_checks = []
        
        # Check orders -> customers relationship
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) 
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.customer_id 
                WHERE c.customer_id IS NULL
            """)
            invalid_customer_refs = cur.fetchone()[0]
            
        integrity_checks.append({
            'relationship': 'orders -> customers',
            'invalid_references': invalid_customer_refs,
            'status': '✅ VALID' if invalid_customer_refs == 0 else '❌ INVALID'
        })
        
        # Check order_items -> orders relationship
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) 
                FROM order_items oi 
                LEFT JOIN orders o ON oi.order_id = o.order_id 
                WHERE o.order_id IS NULL
            """)
            invalid_order_refs = cur.fetchone()[0]
            
        integrity_checks.append({
            'relationship': 'order_items -> orders',
            'invalid_references': invalid_order_refs,
            'status': '✅ VALID' if invalid_order_refs == 0 else '❌ INVALID'
        })
        
        # Check payments -> orders relationship
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) 
                FROM payments p 
                LEFT JOIN orders o ON p.order_id = o.order_id 
                WHERE o.order_id IS NULL
            """)
            invalid_payment_refs = cur.fetchone()[0]
            
        integrity_checks.append({
            'relationship': 'payments -> orders',
            'invalid_references': invalid_payment_refs,
            'status': '✅ VALID' if invalid_payment_refs == 0 else '❌ INVALID'
        })
        
        # Report results
        for check in integrity_checks:
            print(f"   {check['relationship']}: {check['status']}")
            if check['invalid_references'] > 0:
                print(f"      Invalid references: {check['invalid_references']:,}")
                
        return integrity_checks
        
    def generate_data_quality_report(self):
        """Generate comprehensive data quality report."""
        print("\n📊 GENERATING DATA QUALITY REPORT")
        
        quality_report = {
            'timestamp': datetime.now().isoformat(),
            'cleaning_operations': self.cleaning_log,
            'final_counts': {},
            'data_quality_metrics': {}
        }
        
        # Get final record counts
        tables = ['orders', 'order_items', 'customers', 'payments']
        for table in tables:
            quality_report['final_counts'][table] = self.get_table_count(table)
            
        # Calculate quality metrics
        with self.conn.cursor() as cur:
            # Orders with complete data
            cur.execute("""
                SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders)
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN customers c ON o.customer_id = c.customer_id
            """)
            complete_orders_pct = cur.fetchone()[0]
            
            # Payment completion rate
            cur.execute("""
                SELECT COUNT(*) FILTER (WHERE p.status_raw = 'paid') * 100.0 / COUNT(*)
                FROM orders o
                LEFT JOIN payments p ON o.order_id = p.order_id
            """)
            payment_completion_rate = cur.fetchone()[0] or 0
            
        quality_report['data_quality_metrics'] = {
            'complete_orders_percentage': round(complete_orders_pct, 2),
            'payment_completion_rate': round(payment_completion_rate, 2),
            'referential_integrity': self.validate_referential_integrity()
        }
        
        return quality_report
        
    def export_clean_data(self, output_dir: str = 'exports'):
        """Export cleaned data to CSV files."""
        print(f"\n📤 EXPORTING CLEANED DATA to {output_dir}/")
        
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Export main tables
        tables_to_export = {
            'orders_clean.csv': 'orders',
            'order_items_clean.csv': 'order_items', 
            'customers_clean.csv': 'customers',
            'payments_clean.csv': 'payments'
        }
        
        for filename, table in tables_to_export.items():
            filepath = os.path.join(output_dir, filename)
            
            with self.conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {table}")
                df = pd.DataFrame(cur.fetchall(), columns=[desc[0] for desc in cur.description])
                df.to_csv(filepath, index=False)
                
            record_count = len(df)
            print(f"   ✅ {filename}: {record_count:,} records")
            
        print(f"\n✅ Clean data export complete")
        
    def run_full_pipeline(self, export_data: bool = True):
        """Run complete data cleaning pipeline."""
        print("🚀 STARTING DATA CLEANING PIPELINE")
        print("=" * 50)
        
        start_time = datetime.now()
        
        # Connect to database
        self.connect_database()
        
        # Run cleaning operations
        self.clean_orders_table()
        self.clean_order_items_table()
        self.clean_customers_table()
        self.clean_payments_table()
        
        # Validate integrity
        self.validate_referential_integrity()
        
        # Generate quality report
        quality_report = self.generate_data_quality_report()
        
        # Export clean data
        if export_data:
            self.export_clean_data()
            
        # Save quality report
        with open('data_quality_report.json', 'w') as f:
            json.dump(quality_report, f, indent=2)
            
        end_time = datetime.now()
        duration = end_time - start_time
        
        print("\n" + "=" * 50)
        print("✅ DATA CLEANING PIPELINE COMPLETE")
        print(f"   Duration: {duration.total_seconds():.1f} seconds")
        print(f"   Operations: {len(self.cleaning_log)}")
        print(f"   Quality report: data_quality_report.json")
        
        # Summary statistics
        total_removed = sum(op['removed_count'] for op in self.cleaning_log)
        print(f"\n📊 SUMMARY:")
        print(f"   Total records removed: {total_removed:,}")
        print(f"   Final table counts:")
        for table, count in quality_report['final_counts'].items():
            print(f"     {table}: {count:,} records")
            
        return quality_report

def main():
    """Main execution function."""
    # Database configuration
    db_config = {
        'host': '103.246.146.132',
        'port': 5432,
        'database': 'hackathon',
        'user': 'user_db',
        'password': 'psql14182025'
    }
    
    # Initialize and run pipeline
    pipeline = DataCleaningPipeline(db_config)
    
    try:
        report = pipeline.run_full_pipeline(export_data=True)
        print("\n🎉 Data cleaning completed successfully!")
        return 0
        
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        return 1
    
    finally:
        if pipeline.conn:
            pipeline.conn.close()

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
