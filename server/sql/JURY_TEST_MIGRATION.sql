-- ================================================
-- DATABOARD BUSINESS TABLES - JURY TEST MIGRATION
-- Complete business database setup for testing
-- ================================================

-- Execute this single file to set up all business tables
-- Run: psql "your_database_url" -f JURY_TEST_MIGRATION.sql

\echo 'Starting DataBoard Business Tables Setup...'

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo 'Extensions enabled...'

-- ================================================
-- 1. PRODUCT CATEGORIES
-- ================================================
\echo 'Creating product categories...'

CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    category_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert categories
INSERT INTO product_categories (category_code, name, description, sort_order) VALUES
('ELEC', 'Электроника', 'Электронные устройства и аксессуары', 1),
('COMP', 'Компьютеры', 'Компьютеры и комплектующие', 2),
('MOBL', 'Мобильные устройства', 'Смартфоны и планшеты', 3),
('HOME', 'Для дома', 'Товары для дома и быта', 4),
('FURN', 'Мебель', 'Офисная и домашняя мебель', 5)
ON CONFLICT (category_code) DO NOTHING;

-- ================================================
-- 2. SUPPLIERS TABLE
-- ================================================
\echo 'Creating suppliers table...'

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    address JSONB,
    tax_number VARCHAR(50),
    bank_details JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted', 'pending')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    contract_start_date DATE,
    contract_end_date DATE,
    total_orders INTEGER DEFAULT 0,
    total_purchases DECIMAL(15,2) DEFAULT 0.00,
    supplier_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Insert suppliers
INSERT INTO suppliers (supplier_code, company_name, contact_person, email, phone, website, address, tax_number, status, rating, payment_terms) VALUES
('SUP001', 'ТехПоставка ООО', 'Иванов Петр Сергеевич', 'orders@tehpostavka.ru', '+7-495-123-4567', 'www.tehpostavka.ru', '{"street": "ул. Технологическая 15", "city": "Москва", "postal_code": "123456", "country": "Россия"}', '7743123456', 'active', 5, '30 дней'),
('SUP002', 'КомпТех Трейд', 'Петрова Анна Викторовна', 'supply@komptech.ru', '+7-812-234-5678', 'www.komptech.ru', '{"street": "пр. Технический 42", "city": "Санкт-Петербург", "postal_code": "198765", "country": "Россия"}', '7812234567', 'active', 4, '45 дней'),
('SUP003', 'ЭлектроМир', 'Сидоров Алексей Дмитриевич', 'info@electromir.ru', '+7-495-345-6789', 'www.electromir.ru', '{"street": "ул. Электронная 8", "city": "Москва", "postal_code": "109876", "country": "Россия"}', '7743345678', 'active', 4, '60 дней'),
('SUP004', 'МебельОпт', 'Козлова Елена Александровна', 'sales@mebelopt.ru', '+7-383-456-7890', 'www.mebelopt.ru', '{"street": "ул. Мебельная 25", "city": "Новосибирск", "postal_code": "630000", "country": "Россия"}', '5433456789', 'active', 3, '30 дней'),
('SUP005', 'ДомТехника', 'Морозов Игорь Вячеславович', 'orders@domtehnika.ru', '+7-343-567-8901', 'www.domtehnika.ru', '{"street": "ул. Бытовая 10", "city": "Екатеринбург", "postal_code": "620000", "country": "Россия"}', '6623567890', 'active', 4, '15 дней')
ON CONFLICT (supplier_code) DO NOTHING;

-- ================================================
-- 3. CUSTOMERS TABLE
-- ================================================
\echo 'Creating customers table...'

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    company_name VARCHAR(255),
    address JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'pending')),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    registration_date DATE DEFAULT CURRENT_DATE,
    last_order_date DATE,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0.00,
    customer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Insert customers
INSERT INTO customers (customer_code, full_name, email, phone, company_name, address, status, credit_limit, registration_date) VALUES
('CUST001', 'Андреев Михаил Владимирович', 'andreev@email.com', '+7-926-123-4567', 'ИП Андреев М.В.', '{"street": "ул. Рабочая 12", "city": "Москва", "postal_code": "111222", "country": "Россия"}', 'active', 50000.00, '2024-01-15'),
('CUST002', 'Белова Светлана Николаевна', 'belova@email.com', '+7-925-234-5678', NULL, '{"street": "пр. Мира 85", "city": "Санкт-Петербург", "postal_code": "190000", "country": "Россия"}', 'active', 25000.00, '2024-02-20'),
('CUST003', 'ООО "Офис Центр"', 'office@office-center.ru', '+7-495-345-6789', 'ООО "Офис Центр"', '{"street": "ул. Деловая 45", "city": "Москва", "postal_code": "115432", "country": "Россия"}', 'active', 200000.00, '2024-01-10'),
('CUST004', 'Волков Дмитрий Игоревич', 'volkov@email.com', '+7-912-456-7890', NULL, '{"street": "ул. Центральная 78", "city": "Новосибирск", "postal_code": "630001", "country": "Россия"}', 'active', 75000.00, '2024-03-05'),
('CUST005', 'ЗАО "ТехСервис"', 'procurement@tehservice.ru', '+7-343-567-8901', 'ЗАО "ТехСервис"', '{"street": "ул. Промышленная 124", "city": "Екатеринбург", "postal_code": "620100", "country": "Россия"}', 'active', 150000.00, '2024-02-28'),
('CUST006', 'Николаева Ольга Петровна', 'nikolaeva@email.com', '+7-921-678-9012', NULL, '{"street": "ул. Садовая 33", "city": "Санкт-Петербург", "postal_code": "191000", "country": "Россия"}', 'active', 40000.00, '2024-03-12'),
('CUST007', 'ИП Семенов А.В.', 'semenov@email.com', '+7-903-789-0123', 'ИП Семенов А.В.', '{"street": "ул. Торговая 19", "city": "Казань", "postal_code": "420000", "country": "Россия"}', 'active', 80000.00, '2024-01-25'),
('CUST008', 'Федорова Марина Сергеевна', 'fedorova@email.com', '+7-908-890-1234', NULL, '{"street": "пр. Победы 67", "city": "Краснодар", "postal_code": "350000", "country": "Россия"}', 'inactive', 30000.00, '2024-02-14')
ON CONFLICT (customer_code) DO NOTHING;

-- ================================================
-- 4. PRODUCTS TABLE
-- ================================================
\echo 'Creating products table...'

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES product_categories(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    barcode VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    purchase_price DECIMAL(12,2) NOT NULL CHECK (purchase_price >= 0),
    selling_price DECIMAL(12,2) NOT NULL CHECK (selling_price >= 0),
    discount_price DECIMAL(12,2) CHECK (discount_price >= 0),
    cost_price DECIMAL(12,2) CHECK (cost_price >= 0),
    margin_percent DECIMAL(5,2) CHECK (margin_percent >= 0 AND margin_percent <= 100),
    tax_rate DECIMAL(5,2) DEFAULT 20.00,
    unit_of_measure VARCHAR(20) DEFAULT 'шт',
    weight DECIMAL(8,3),
    dimensions JSONB,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER DEFAULT 0,
    warehouse_location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_digital BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,
    product_images JSONB,
    specifications JSONB,
    warranty_period INTEGER,
    manufacturer VARCHAR(255),
    manufacture_date DATE,
    expiry_date DATE,
    tags TEXT[],
    seo_title VARCHAR(255),
    seo_description TEXT,
    view_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Insert products
INSERT INTO products (product_code, name, description, category_id, supplier_id, barcode, sku, purchase_price, selling_price, cost_price, margin_percent, stock_quantity, min_stock_level, warehouse_location, specifications, manufacturer, tags) VALUES
('PROD001', 'Ноутбук ASUS VivoBook 15', 'Ноутбук 15.6" FHD, Intel Core i5, 8GB RAM, 512GB SSD', 2, 1, '4711081752893', 'ASUS-VB15-I5-8-512', 45000.00, 65000.00, 42000.00, 44.62, 15, 5, 'A-1-15', '{"cpu": "Intel Core i5-1135G7", "ram": "8GB DDR4", "storage": "512GB SSD", "display": "15.6 FHD", "os": "Windows 11"}', 'ASUS', ARRAY['ноутбук', 'офис', 'учеба', 'intel']),
('PROD002', 'Смартфон Samsung Galaxy A54', 'Смартфон с экраном 6.4", 128GB, камера 50MP', 3, 1, '8806094559589', 'SAM-A54-128-BLK', 28000.00, 39900.00, 26500.00, 42.52, 25, 10, 'B-2-08', '{"display": "6.4 Super AMOLED", "storage": "128GB", "camera": "50MP + 12MP + 5MP", "battery": "5000mAh", "os": "Android 13"}', 'Samsung', ARRAY['смартфон', 'андроид', 'камера', 'samsung']),
('PROD003', 'Монитор LG 27" 4K UHD', 'Монитор 27 дюймов, разрешение 3840x2160, IPS', 2, 2, '8806098671824', 'LG-27UK850-W', 32000.00, 45000.00, 30800.00, 40.63, 8, 3, 'A-2-22', '{"size": "27 inch", "resolution": "3840x2160", "panel": "IPS", "refresh_rate": "60Hz", "connectivity": "USB-C, HDMI, DisplayPort"}', 'LG', ARRAY['монитор', '4k', 'ips', 'lg']),
('PROD004', 'Клавиатура механическая Logitech MX', 'Беспроводная механическая клавиатура с подсветкой', 2, 3, '097855152633', 'LOG-MX-MECH-BLK', 8500.00, 12900.00, 8200.00, 51.85, 20, 8, 'C-1-05', '{"type": "Механическая", "connection": "Wireless/USB-C", "backlight": "RGB", "keys": "87 клавиш", "battery": "10 дней"}', 'Logitech', ARRAY['клавиатура', 'механическая', 'беспроводная', 'rgb']),
('PROD005', 'Стул офисный ErgoMax Pro', 'Эргономичный офисный стул с поясничной поддержкой', 5, 4, '2000000001234', 'ERGO-MAX-PRO-BLK', 12000.00, 18500.00, 11500.00, 54.05, 12, 4, 'D-3-12', '{"material": "Сетка + кожзам", "adjustments": "Высота, подлокотники, наклон", "max_weight": "120kg", "warranty": "24 месяца"}', 'ErgoMax', ARRAY['стул', 'офис', 'эргономика', 'кожзам']),
('PROD006', 'Холодильник Bosch KGN39VI35', 'Двухкамерный холодильник NoFrost 366л', 4, 5, '4242005184651', 'BOSCH-KGN39VI35', 55000.00, 78900.00, 53000.00, 43.49, 6, 2, 'E-1-08', '{"capacity": "366л", "type": "Двухкамерный", "energy_class": "A++", "nofrost": "Да", "dimensions": "203x60x66 см"}', 'Bosch', ARRAY['холодильник', 'nofrost', 'bosch', 'бытовая_техника']),
('PROD007', 'Планшет iPad Air 5th Gen', 'Планшет Apple iPad Air 64GB Wi-Fi', 3, 1, '190199585958', 'APPLE-IPAD-AIR5-64', 48000.00, 68900.00, 46500.00, 43.55, 10, 4, 'B-1-15', '{"screen": "10.9 Liquid Retina", "storage": "64GB", "chip": "Apple M1", "camera": "12MP", "os": "iPadOS 15"}', 'Apple', ARRAY['планшет', 'ipad', 'apple', 'm1']),
('PROD008', 'Наушники Sony WH-1000XM5', 'Беспроводные наушники с шумоподавлением', 1, 3, '4548736141853', 'SONY-WH1000XM5-BLK', 22000.00, 32900.00, 21200.00, 49.54, 18, 6, 'C-2-18', '{"type": "Накладные", "connection": "Bluetooth 5.2", "anc": "Активное шумоподавление", "battery": "30 часов", "quick_charge": "3 мин = 3 часа"}', 'Sony', ARRAY['наушники', 'беспроводные', 'шумоподавление', 'sony'])
ON CONFLICT (product_code) DO NOTHING;

-- ================================================
-- 5. ORDERS TABLE
-- ================================================
\echo 'Creating orders table...'

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    required_date DATE,
    shipped_date DATE,
    delivery_date DATE,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    payment_status VARCHAR(30) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'failed')),
    payment_method VARCHAR(50),
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'RUB',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    shipping_address JSONB,
    billing_address JSONB,
    tracking_number VARCHAR(100),
    courier_service VARCHAR(100),
    estimated_delivery_time INTEGER,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    source VARCHAR(50) DEFAULT 'website',
    discount_code VARCHAR(50),
    customer_notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Insert orders
INSERT INTO orders (order_number, customer_id, order_date, status, payment_status, payment_method, subtotal, tax_amount, shipping_cost, total_amount, shipping_address, priority, source) VALUES
('ORD-2024-001', 1, '2024-03-15 10:30:00', 'delivered', 'paid', 'card', 65000.00, 13000.00, 500.00, 78500.00, '{"street": "ул. Рабочая 12", "city": "Москва", "postal_code": "111222", "country": "Россия"}', 'normal', 'website'),
('ORD-2024-002', 3, '2024-03-16 14:15:00', 'processing', 'paid', 'bank_transfer', 157800.00, 31560.00, 0.00, 189360.00, '{"street": "ул. Деловая 45", "city": "Москва", "postal_code": "115432", "country": "Россия"}', 'high', 'phone'),
('ORD-2024-003', 2, '2024-03-18 09:45:00', 'shipped', 'paid', 'card', 39900.00, 7980.00, 350.00, 48230.00, '{"street": "пр. Мира 85", "city": "Санкт-Петербург", "postal_code": "190000", "country": "Россия"}', 'normal', 'website'),
('ORD-2024-004', 4, '2024-03-20 16:20:00', 'confirmed', 'paid', 'cash', 90900.00, 18180.00, 800.00, 109880.00, '{"street": "ул. Центральная 78", "city": "Новосибирск", "postal_code": "630001", "country": "Россия"}', 'normal', 'website'),
('ORD-2024-005', 5, '2024-03-21 11:10:00', 'pending', 'unpaid', 'bank_transfer', 124400.00, 24880.00, 0.00, 149280.00, '{"street": "ул. Промышленная 124", "city": "Екатеринбург", "postal_code": "620100", "country": "Россия"}', 'urgent', 'email')
ON CONFLICT (order_number) DO NOTHING;

-- ================================================
-- 6. ORDER ITEMS TABLE
-- ================================================
\echo 'Creating order items table...'

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    discount_percent DECIMAL(5,2) DEFAULT 0.00 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 20.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    line_total DECIMAL(15,2) NOT NULL CHECK (line_total >= 0),
    product_snapshot JSONB,
    warranty_expires_at DATE,
    return_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, product_id)
);

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, tax_rate, tax_amount, line_total, product_snapshot) VALUES
(1, 1, 1, 65000.00, 20.00, 13000.00, 65000.00, '{"name": "Ноутбук ASUS VivoBook 15", "sku": "ASUS-VB15-I5-8-512"}'),
(2, 3, 2, 45000.00, 20.00, 18000.00, 90000.00, '{"name": "Монитор LG 27\" 4K UHD", "sku": "LG-27UK850-W"}'),
(2, 4, 3, 12900.00, 20.00, 7740.00, 38700.00, '{"name": "Клавиатура механическая Logitech MX", "sku": "LOG-MX-MECH-BLK"}'),
(2, 5, 2, 18500.00, 20.00, 7400.00, 37000.00, '{"name": "Стул офисный ErgoMax Pro", "sku": "ERGO-MAX-PRO-BLK"}'),
(3, 2, 1, 39900.00, 20.00, 7980.00, 39900.00, '{"name": "Смартфон Samsung Galaxy A54", "sku": "SAM-A54-128-BLK"}'),
(4, 7, 1, 68900.00, 20.00, 13780.00, 68900.00, '{"name": "Планшет iPad Air 5th Gen", "sku": "APPLE-IPAD-AIR5-64"}'),
(4, 8, 1, 32900.00, 20.00, 6580.00, 32900.00, '{"name": "Наушники Sony WH-1000XM5", "sku": "SONY-WH1000XM5-BLK"}'),
(5, 6, 1, 78900.00, 20.00, 15780.00, 78900.00, '{"name": "Холодильник Bosch KGN39VI35", "sku": "BOSCH-KGN39VI35"}'),
(5, 1, 1, 65000.00, 20.00, 13000.00, 65000.00, '{"name": "Ноутбук ASUS VivoBook 15", "sku": "ASUS-VB15-I5-8-512"})
ON CONFLICT (order_id, product_id) DO NOTHING;

-- ================================================
-- 7. INVENTORY MOVEMENTS TABLE
-- ================================================
\echo 'Creating inventory movements table...'

CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    warehouse_location VARCHAR(100),
    reason TEXT,
    document_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Insert inventory movements
INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, reason, created_by) VALUES
(1, 'in', 20, 0, 20, 'purchase', 1, 'Поступление товара от поставщика', 'admin'),
(1, 'out', 2, 20, 18, 'order', 1, 'Продажа по заказу ORD-2024-001', 'system'),
(1, 'out', 1, 18, 17, 'order', 5, 'Продажа по заказу ORD-2024-005', 'system'),
(2, 'in', 30, 0, 30, 'purchase', 2, 'Поступление товара от поставщика', 'admin'),
(2, 'out', 1, 30, 29, 'order', 3, 'Продажа по заказу ORD-2024-003', 'system'),
(3, 'in', 12, 0, 12, 'purchase', 3, 'Поступление товара от поставщика', 'admin'),
(3, 'out', 2, 12, 10, 'order', 2, 'Продажа по заказу ORD-2024-002', 'system'),
(4, 'in', 25, 0, 25, 'purchase', 4, 'Поступление товара от поставщика', 'admin'),
(4, 'out', 3, 25, 22, 'order', 2, 'Продажа по заказу ORD-2024-002', 'system'),
(5, 'in', 15, 0, 15, 'purchase', 5, 'Поступление товара от поставщика', 'admin')
ON CONFLICT DO NOTHING;

-- ================================================
-- 8. AUDIT AND TRACKING TABLES
-- ================================================
\echo 'Creating audit and tracking tables...'

CREATE TABLE IF NOT EXISTS data_audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    validation_status VARCHAR(20) DEFAULT 'success' CHECK (validation_status IN ('success', 'warning', 'error')),
    validation_messages TEXT[],
    user_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deduplication_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    original_record_id INTEGER NOT NULL,
    duplicate_record_id INTEGER NOT NULL,
    matching_fields TEXT[] NOT NULL,
    confidence_score DECIMAL(5,4) DEFAULT 0.0000,
    resolution_action VARCHAR(50),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 9. VALIDATION FUNCTIONS
-- ================================================
\echo 'Creating validation functions...'

CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_valid_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone ~* '^\+?[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql;

-- Add validation constraints
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_valid;
ALTER TABLE customers ADD CONSTRAINT customers_email_valid 
    CHECK (is_valid_email(email));

ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_email_valid;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_email_valid 
    CHECK (is_valid_email(email));

-- ================================================
-- 10. UPDATE STATISTICS
-- ================================================
\echo 'Updating statistics...'

-- Update customer totals
UPDATE customers SET 
    total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id),
    total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customers.id AND payment_status = 'paid'),
    last_order_date = (SELECT MAX(order_date::date) FROM orders WHERE customer_id = customers.id);

-- Update supplier totals
UPDATE suppliers SET 
    total_orders = (SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE p.supplier_id = suppliers.id),
    total_purchases = (SELECT COALESCE(SUM(oi.line_total), 0) FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.supplier_id = suppliers.id);

-- Update product sales counts
UPDATE products SET 
    sales_count = (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.product_id = products.id);

-- ================================================
-- 11. CREATE VIEWS
-- ================================================
\echo 'Creating business views...'

CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id,
    c.customer_code,
    c.full_name,
    c.email,
    c.company_name,
    c.status,
    c.total_orders,
    c.total_spent,
    c.last_order_date,
    c.registration_date,
    CASE 
        WHEN c.total_spent >= 100000 THEN 'VIP'
        WHEN c.total_spent >= 50000 THEN 'Premium'
        WHEN c.total_spent >= 10000 THEN 'Regular'
        ELSE 'New'
    END as customer_tier
FROM customers c;

CREATE OR REPLACE VIEW inventory_status AS
SELECT 
    p.id,
    p.product_code,
    p.name,
    p.stock_quantity,
    p.min_stock_level,
    p.reorder_point,
    CASE 
        WHEN p.stock_quantity <= 0 THEN 'Out of Stock'
        WHEN p.stock_quantity <= p.reorder_point THEN 'Low Stock'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'Below Minimum'
        ELSE 'In Stock'
    END as stock_status,
    p.selling_price * p.stock_quantity as inventory_value
FROM products p
WHERE p.is_active = true;

-- ================================================
-- 12. CREATE INDEXES
-- ================================================
\echo 'Creating performance indexes...'

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON data_audit_log(table_name, record_id);

-- ================================================
-- 13. FINAL SUMMARY
-- ================================================
\echo 'Setup complete! Generating summary...'

-- Show final statistics
SELECT 
    'Setup Complete!' as status,
    'All business tables created with sample data' as message;

SELECT 
    'customers' as table_name, 
    COUNT(*) as record_count,
    'Клиенты с контактной информацией и адресами' as description
FROM customers
UNION ALL
SELECT 
    'suppliers' as table_name, 
    COUNT(*) as record_count,
    'Поставщики с рейтингами и контрактами' as description
FROM suppliers
UNION ALL
SELECT 
    'products' as table_name, 
    COUNT(*) as record_count,
    'Товары с ценами и остатками' as description
FROM products
UNION ALL
SELECT 
    'product_categories' as table_name, 
    COUNT(*) as record_count,
    'Категории товаров' as description
FROM product_categories
UNION ALL
SELECT 
    'orders' as table_name, 
    COUNT(*) as record_count,
    'Заказы клиентов' as description
FROM orders
UNION ALL
SELECT 
    'order_items' as table_name, 
    COUNT(*) as record_count,
    'Позиции в заказах' as description
FROM order_items
UNION ALL
SELECT 
    'inventory_movements' as table_name, 
    COUNT(*) as record_count,
    'Движения товаров на складе' as description
FROM inventory_movements;

-- Business metrics
SELECT 
    'Total Sales Amount' as metric,
    TO_CHAR(SUM(total_amount), 'FM999,999,999.00') || ' RUB' as value
FROM orders WHERE payment_status = 'paid'
UNION ALL
SELECT 
    'Total Inventory Value' as metric,
    TO_CHAR(SUM(selling_price * stock_quantity), 'FM999,999,999.00') || ' RUB' as value
FROM products
UNION ALL
SELECT 
    'Active Customers' as metric,
    COUNT(*)::text as value
FROM customers WHERE status = 'active'
UNION ALL
SELECT 
    'Products in Stock' as metric,
    COUNT(*)::text as value
FROM products WHERE stock_quantity > 0;

\echo '================================================'
\echo 'DATABOARD BUSINESS TABLES SETUP COMPLETE!'
\echo '================================================'
\echo 'Tables created: 7 main tables + 2 audit tables'
\echo 'Sample data: 50+ records with relationships'
\echo 'Features: Validation, constraints, indexes, views'
\echo 'Ready for testing at /admin interface'
\echo '================================================'
