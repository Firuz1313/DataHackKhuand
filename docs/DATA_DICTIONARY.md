# 📖 Data Dictionary - DataBoard Analytics

> Comprehensive reference for all database tables, columns, data types, and business definitions used in the DataBoard analytics platform.

## 📋 Table of Contents

- [Database Overview](#database-overview)
- [Core Business Tables](#core-business-tables)
- [Dimension Tables](#dimension-tables)
- [Lookup Tables](#lookup-tables)
- [Data Types Reference](#data-types-reference)
- [Business Rules & Constraints](#business-rules--constraints)

---

## 🗃️ Database Overview

**Database**: PostgreSQL 12+  
**Schema**: public  
**Character Set**: UTF-8  
**Collation**: Russian/English support  
**Total Tables**: 15+  
**Total Records**: 500,000+  

---

## 🏢 Core Business Tables

### 📦 `orders` - Customer Orders

Primary fact table containing all customer order transactions.

| Column | Data Type | Nullable | Description | Example Values | Business Rules |
|--------|-----------|----------|-------------|----------------|----------------|
| `order_id` | bigint | NOT NULL | Unique order identifier | 1, 2, 3... | Primary key, auto-increment |
| `customer_id` | bigint | NOT NULL | Reference to customer | 15991, 29325 | Foreign key → customers.customer_id |
| `order_date` | timestamp | NOT NULL | Order creation date/time | '2025-08-14 00:00:00' | Must be ≤ current date |
| `date_id` | integer | YES | Date dimension key | 20250814 | Format: YYYYMMDD |
| `channel` | varchar(50) | YES | Order acquisition channel | 'web', 'mobile', 'whatsapp' | See channel values below |
| `payment_method_id` | integer | YES | Payment method reference | 1, 2, 3 | Foreign key → dim_payment_methods.id |
| `order_district_id` | integer | YES | Geographic district | 1-50 | Foreign key → dim_districts.id |
| `item_amount` | decimal(12,2) | YES | Total order value | 592.06, 1250.00 | Calculated from order_items |

**Valid Channel Values**:
- `web` - Website orders
- `mobile` - Mobile app orders  
- `whatsapp` - WhatsApp orders
- `telegram` - Telegram orders
- `instagram` - Instagram orders
- `call_center` - Phone orders

**Record Count**: ~105,000 orders  
**Date Range**: 2024-01-01 to 2025-12-31  
**Primary Key**: order_id  
**Indexes**: order_date, customer_id, channel  

---

### 🛒 `order_items` - Order Line Items

Contains individual products within each order (order line items).

| Column | Data Type | Nullable | Description | Example Values | Business Rules |
|--------|-----------|----------|-------------|----------------|----------------|
| `order_id` | bigint | NOT NULL | Reference to parent order | 1, 2, 3... | Foreign key → orders.order_id |
| `product_id` | bigint | NOT NULL | Product identifier | 101, 102, 103 | Foreign key → products.product_id |
| `quantity` | integer | NOT NULL | Number of units ordered | 1, 2, 5 | Must be > 0, typically ≤ 100 |
| `price_per_item` | decimal(10,2) | NOT NULL | Unit price at time of order | 25.99, 150.00 | Must be > 0, stored price snapshot |

**Record Count**: ~160,591 line items  
**Average Items per Order**: 1.53  
**Primary Key**: (order_id, product_id)  
**Indexes**: order_id, product_id  

**Business Logic**:
- Total line value = quantity × price_per_item
- Order total = SUM(line values) for all items in order
- Prices are frozen at order time (historical snapshot)

---

### 👥 `customers` - Customer Master Data

Customer information and demographics.

| Column | Data Type | Nullable | Description | Example Values | Business Rules |
|--------|-----------|----------|-------------|----------------|----------------|
| `customer_id` | bigint | NOT NULL | Unique customer identifier | 15991, 29325 | Primary key, auto-increment |
| `gender` | varchar(10) | YES | Customer gender | 'M', 'F', NULL | Optional demographic field |
| `age` | bigint | YES | Customer age | 25, 45, 67 | Typical range: 18-80 |
| `region_id` | integer | YES | Customer's region | 1, 2, 3 | Foreign key → dim_regions.id |
| `district_id` | integer | YES | Customer's district | 1-50 | Foreign key → dim_districts.id |

**Record Count**: ~34,333 customers  
**Demographics**:
- Age range: 18-75 years
- Gender distribution: ~50/50 M/F
- Geographic spread: All major regions

**Primary Key**: customer_id  
**Indexes**: region_id, district_id, age  

---

### 💳 `payments` - Payment Transactions

Payment processing records for orders.

| Column | Data Type | Nullable | Description | Example Values | Business Rules |
|--------|-----------|----------|-------------|----------------|----------------|
| `order_id` | bigint | NOT NULL | Reference to order | 1, 2, 3... | Foreign key → orders.order_id |
| `attempt` | integer | NOT NULL | Payment attempt number | 1, 2, 3 | Retry sequence for failed payments |
| `status_raw` | varchar(20) | NOT NULL | Payment status | 'paid', 'failed', 'pending' | See status values below |
| `paid_amount` | decimal(12,2) | YES | Successfully paid amount | 592.06, 0.00 | ≤ order total amount |
| `payment_date` | timestamp | YES | Payment processing date | '2025-08-14 10:30:00' | When payment processed |
| `payment_method_id` | integer | YES | Payment method used | 1, 2, 3 | Foreign key → dim_payment_methods.id |

**Valid Status Values**:
- `paid` - Payment successful
- `failed` - Payment failed/declined
- `pending` - Payment in process

**Record Count**: ~113,891 payment attempts  
**Success Rate**: ~85% of payment attempts succeed  
**Primary Key**: (order_id, attempt)  
**Indexes**: status_raw, payment_date  

---

## 🎯 Dimension Tables

### 🗺️ `dim_regions` - Geographic Regions

Regional geographic information.

| Column | Data Type | Nullable | Description | Example Values |
|--------|-----------|----------|-------------|----------------|
| `id` | integer | NOT NULL | Region identifier | 1, 2, 3... |
| `region_name` | varchar(100) | NOT NULL | Region name | 'Москва', 'СПб', 'Регионы' |
| `region_code` | varchar(10) | YES | Region abbreviation | 'MSK', 'SPB', 'REG' |

### 🏙️ `dim_districts` - Geographic Districts

District-level geographic information.

| Column | Data Type | Nullable | Description | Example Values |
|--------|-----------|----------|-------------|----------------|
| `id` | integer | NOT NULL | District identifier | 1, 2, 3... |
| `district_name` | varchar(100) | NOT NULL | District name | 'Центральный', 'Северный' |
| `region_id` | integer | YES | Parent region | Foreign key → dim_regions.id |

### 💰 `dim_payment_methods` - Payment Methods

Payment method lookup table.

| Column | Data Type | Nullable | Description | Example Values |
|--------|-----------|----------|-------------|----------------|
| `id` | integer | NOT NULL | Payment method ID | 1, 2, 3... |
| `method_name` | varchar(50) | NOT NULL | Payment method name | 'Карта', 'Банковский перевод' |
| `method_type` | varchar(20) | YES | Payment category | 'card', 'transfer', 'wallet' |
| `is_active` | boolean | NOT NULL | Method availability | true, false |

### 📅 `dim_dates` - Date Dimension

Date dimension for time-based analysis.

| Column | Data Type | Nullable | Description | Example Values |
|--------|-----------|----------|-------------|----------------|
| `date_id` | integer | NOT NULL | Date key (YYYYMMDD) | 20241201, 20241202 |
| `full_date` | date | NOT NULL | Actual date | '2024-12-01' |
| `year` | integer | NOT NULL | Year | 2024, 2025 |
| `month` | integer | NOT NULL | Month (1-12) | 1, 2, ..., 12 |
| `day` | integer | NOT NULL | Day of month | 1, 2, ..., 31 |
| `day_of_week` | integer | NOT NULL | Day of week (0=Sun) | 0, 1, 2, ..., 6 |
| `day_name` | varchar(20) | NOT NULL | Day name | 'Понедельник', 'Вторник' |
| `is_weekend` | boolean | NOT NULL | Weekend flag | true, false |
| `is_holiday` | boolean | NOT NULL | Holiday flag | true, false |

---

## 📊 Data Types Reference

### PostgreSQL Data Types Used

| Type | Description | Range/Length | Usage |
|------|-------------|--------------|-------|
| `bigint` | 8-byte integer | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 | IDs, large counts |
| `integer` | 4-byte integer | -2,147,483,648 to 2,147,483,647 | Standard numbers |
| `decimal(p,s)` | Exact numeric | Precision p, scale s | Money, precise calculations |
| `varchar(n)` | Variable string | Up to n characters | Text fields |
| `timestamp` | Date + time | 4713 BC to 294276 AD | Date/time values |
| `date` | Date only | 4713 BC to 5874897 AD | Date values |
| `boolean` | True/false | true, false, null | Binary flags |

### Common Precision & Scale

| Field Type | Format | Example | Notes |
|------------|---------|---------|-------|
| Currency | decimal(12,2) | 1234567890.99 | Up to 10 digits + 2 decimal |
| Percentage | decimal(5,2) | 99.99 | Up to 3 digits + 2 decimal |
| Quantity | integer | 999 | Whole numbers only |
| Rate | decimal(10,4) | 0.1234 | High precision rates |

---

## ⚖️ Business Rules & Constraints

### Data Integrity Rules

1. **Referential Integrity**
   - All foreign keys must reference existing records
   - Orphaned records are removed during data cleaning
   - Cascade deletes not allowed (data preservation)

2. **Business Logic Constraints**
   - Order dates cannot be in the future
   - Quantities must be positive integers
   - Prices must be positive decimals
   - Payment amounts cannot exceed order totals

3. **Data Quality Standards**
   - No duplicate primary keys allowed
   - Critical fields (IDs, amounts) cannot be NULL
   - Date formats must be consistent (ISO 8601)
   - Text fields use UTF-8 encoding

### Calculation Rules

1. **Revenue Calculations**
   ```sql
   -- Gross Revenue = Sum of all order line items
   Gross Revenue = SUM(quantity * price_per_item) FROM order_items
   
   -- Net Paid Revenue = Only confirmed payments
   Net Paid Revenue = SUM(paid_amount) WHERE status_raw = 'paid'
   ```

2. **KPI Formulas**
   ```sql
   -- Average Order Value
   AOV = SUM(order_total) / COUNT(DISTINCT order_id)
   
   -- Payment Conversion
   Conversion = COUNT(paid_orders) * 100 / COUNT(total_orders)
   
   -- Units per Order
   UPO = SUM(quantity) / COUNT(DISTINCT order_id)
   ```

3. **Deduplication Logic**
   - Orders: Keep latest by order_date
   - Payments: Keep successful payment, then latest attempt
   - Customers: Keep record with most complete data

---

## 🔧 Data Maintenance

### Regular Operations

1. **Daily Tasks**
   - Data quality validation
   - Referential integrity checks
   - New record validation

2. **Weekly Tasks**
   - Duplicate detection and removal
   - Performance optimization
   - Index maintenance

3. **Monthly Tasks**
   - Full data cleaning pipeline
   - Historical data archival
   - Schema evolution reviews

### Quality Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Missing customer references | < 1% | Monitor |
| Failed payments | < 20% | Investigate |
| Duplicate orders | 0% | Immediate cleanup |
| Data completeness | > 95% | Target standard |

---

## 📞 Support Information

**Data Dictionary Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: DataBoard Analytics Team  
**Contact**: See README.md for support information  

For schema changes or data questions, refer to:
- `sql/` directory for query examples
- `scripts/data_cleaning.py` for validation logic
- `docs/KPI_FORMULAS.md` for calculation details
