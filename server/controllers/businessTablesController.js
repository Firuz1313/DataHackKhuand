const { query } = require('../config/database')
const fs = require('fs').promises
const path = require('path')

class BusinessTablesController {
  // Run the business tables migration
  async setupBusinessTables(req, res) {
    try {
      console.log('🚀 Setting up business tables...')

      const sqlPath = path.join(__dirname, '../sql/business_tables_complete.sql')
      const sqlContent = await fs.readFile(sqlPath, 'utf8')

      // Split SQL into statements and execute
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--') && s !== '\n')

      let executedCount = 0
      const results = []

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const result = await query(statement)
            executedCount++
            console.log(`✅ Executed statement ${executedCount}`)
          } catch (error) {
            console.warn(`⚠️ Statement failed (may be expected):`, error.message)
            // Continue with other statements - some may fail due to existing data
          }
        }
      }

      console.log(`✅ Business tables setup completed: ${executedCount} statements executed`)

      res.json({
        success: true,
        data: {
          executed: executedCount,
          total: statements.length,
        },
        message: 'Business tables setup completed successfully',
      })
    } catch (error) {
      console.error('❌ Error setting up business tables:', error)
      res.status(500).json({
        success: false,
        error: 'Error setting up business tables',
        details: error.message,
      })
    }
  }

  // Get all business tables summary
  async getBusinessTablesSummary(req, res) {
    try {
      console.log('📊 Getting business tables summary...')

      const tablesSummary = await query(`
        SELECT 
          schemaname,
          tablename as table_name,
          CASE 
            WHEN tablename = 'customers' THEN 'Клиенты'
            WHEN tablename = 'suppliers' THEN 'Поставщики' 
            WHEN tablename = 'products' THEN 'Товары'
            WHEN tablename = 'product_categories' THEN 'Категории товаров'
            WHEN tablename = 'orders' THEN 'Заказы'
            WHEN tablename = 'order_items' THEN 'Позиции заказов'
            WHEN tablename = 'inventory_movements' THEN 'Движения склада'
            WHEN tablename = 'data_audit_log' THEN 'Журнал аудита'
            WHEN tablename = 'deduplication_log' THEN 'Журнал дедупликации'
            ELSE initcap(tablename)
          END as display_name,
          CASE 
            WHEN tablename = 'customers' THEN 'Клиенты и их контактная информация'
            WHEN tablename = 'suppliers' THEN 'Поставщики товаров и услуг'
            WHEN tablename = 'products' THEN 'Каталог товаров и услуг'
            WHEN tablename = 'product_categories' THEN 'Категории и группы товаров'
            WHEN tablename = 'orders' THEN 'Заказы клиентов'
            WHEN tablename = 'order_items' THEN 'Детализация заказов'
            WHEN tablename = 'inventory_movements' THEN 'История движений товаров на складе'
            WHEN tablename = 'data_audit_log' THEN 'Журнал изменений данных'
            WHEN tablename = 'deduplication_log' THEN 'Журнал обработки дубликатов'
            ELSE 'Business table'
          END as description
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'suppliers', 'products', 'product_categories', 'orders', 'order_items', 'inventory_movements', 'data_audit_log', 'deduplication_log')
        ORDER BY tablename
      `)

      // Get record counts for each table
      const tablesWithCounts = []
      for (const table of tablesSummary.rows) {
        try {
          const countResult = await query(`SELECT COUNT(*) as count FROM ${table.table_name}`)
          tablesWithCounts.push({
            ...table,
            record_count: parseInt(countResult.rows[0].count),
          })
        } catch (error) {
          console.warn(`Could not get count for table ${table.table_name}:`, error.message)
          tablesWithCounts.push({
            ...table,
            record_count: 0,
          })
        }
      }

      res.json({
        success: true,
        data: tablesWithCounts,
      })
    } catch (error) {
      console.error('❌ Error getting business tables summary:', error)
      res.status(500).json({
        success: false,
        error: 'Error getting business tables summary',
        details: error.message,
      })
    }
  }

  // Get customers data
  async getCustomers(req, res) {
    try {
      const { page = 1, limit = 50, search = '', sort = 'id', order = 'ASC' } = req.query
      const offset = (parseInt(page) - 1) * parseInt(limit)

      let whereClause = ''
      let params = []

      if (search) {
        whereClause = 'WHERE (full_name ILIKE $1 OR email ILIKE $1 OR company_name ILIKE $1)'
        params.push(`%${search}%`)
      }

      const dataQuery = `
        SELECT id, customer_code, full_name, email, phone, company_name, 
               status, total_orders, total_spent, registration_date, last_order_date
        FROM customers 
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `

      const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`

      params.push(parseInt(limit), offset)

      const [dataResult, countResult] = await Promise.all([
        query(dataQuery, params),
        query(countQuery, params.slice(0, -2)),
      ])

      const totalRows = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(totalRows / parseInt(limit))

      res.json({
        success: true,
        data: {
          rows: dataResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRows,
            pages: totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1,
          },
        },
      })
    } catch (error) {
      console.error('❌ Error getting customers:', error)
      res.status(500).json({
        success: false,
        error: 'Error getting customers data',
        details: error.message,
      })
    }
  }

  // Get products data
  async getProducts(req, res) {
    try {
      const { page = 1, limit = 50, search = '', sort = 'id', order = 'ASC' } = req.query
      const offset = (parseInt(page) - 1) * parseInt(limit)

      let whereClause = ''
      let params = []

      if (search) {
        whereClause = 'WHERE (p.name ILIKE $1 OR p.product_code ILIKE $1 OR p.description ILIKE $1)'
        params.push(`%${search}%`)
      }

      const dataQuery = `
        SELECT p.id, p.product_code, p.name, p.description, 
               p.selling_price, p.stock_quantity, p.is_active,
               pc.name as category_name, s.company_name as supplier_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY p.${sort} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM products p 
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
      `

      params.push(parseInt(limit), offset)

      const [dataResult, countResult] = await Promise.all([
        query(dataQuery, params),
        query(countQuery, params.slice(0, -2)),
      ])

      const totalRows = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(totalRows / parseInt(limit))

      res.json({
        success: true,
        data: {
          rows: dataResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRows,
            pages: totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1,
          },
        },
      })
    } catch (error) {
      console.error('❌ Error getting products:', error)
      res.status(500).json({
        success: false,
        error: 'Error getting products data',
        details: error.message,
      })
    }
  }

  // Get orders data
  async getOrders(req, res) {
    try {
      const { page = 1, limit = 50, search = '', sort = 'id', order = 'DESC' } = req.query
      const offset = (parseInt(page) - 1) * parseInt(limit)

      let whereClause = ''
      let params = []

      if (search) {
        whereClause =
          'WHERE (o.order_number ILIKE $1 OR c.full_name ILIKE $1 OR c.company_name ILIKE $1)'
        params.push(`%${search}%`)
      }

      const dataQuery = `
        SELECT o.id, o.order_number, o.order_date, o.status, o.payment_status,
               o.total_amount, o.priority, c.full_name as customer_name,
               c.company_name as customer_company
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        ${whereClause}
        ORDER BY o.${sort} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id
        ${whereClause}
      `

      params.push(parseInt(limit), offset)

      const [dataResult, countResult] = await Promise.all([
        query(dataQuery, params),
        query(countQuery, params.slice(0, -2)),
      ])

      const totalRows = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(totalRows / parseInt(limit))

      res.json({
        success: true,
        data: {
          rows: dataResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRows,
            pages: totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1,
          },
        },
      })
    } catch (error) {
      console.error('❌ Error getting orders:', error)
      res.status(500).json({
        success: false,
        error: 'Error getting orders data',
        details: error.message,
      })
    }
  }

  // Get suppliers data
  async getSuppliers(req, res) {
    try {
      const { page = 1, limit = 50, search = '', sort = 'id', order = 'ASC' } = req.query
      const offset = (parseInt(page) - 1) * parseInt(limit)

      let whereClause = ''
      let params = []

      if (search) {
        whereClause = 'WHERE (company_name ILIKE $1 OR contact_person ILIKE $1 OR email ILIKE $1)'
        params.push(`%${search}%`)
      }

      const dataQuery = `
        SELECT id, supplier_code, company_name, contact_person, email, 
               phone, status, rating, total_orders, total_purchases
        FROM suppliers 
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `

      const countQuery = `SELECT COUNT(*) as total FROM suppliers ${whereClause}`

      params.push(parseInt(limit), offset)

      const [dataResult, countResult] = await Promise.all([
        query(dataQuery, params),
        query(countQuery, params.slice(0, -2)),
      ])

      const totalRows = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(totalRows / parseInt(limit))

      res.json({
        success: true,
        data: {
          rows: dataResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalRows,
            pages: totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1,
          },
        },
      })
    } catch (error) {
      console.error('❌ Error getting suppliers:', error)
      res.status(500).json({
        success: false,
        error: 'Error getting suppliers data',
        details: error.message,
      })
    }
  }

  // Get business analytics
  async getBusinessAnalytics(req, res) {
    try {
      console.log('📈 Getting business analytics...')

      // Sales summary
      const salesStats = await query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total_amount) as total_revenue,
          AVG(o.total_amount) as avg_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers
        FROM orders o 
        WHERE o.payment_status = 'paid'
      `)

      // Top products
      const topProducts = await query(`
        SELECT 
          p.name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.line_total) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.payment_status = 'paid'
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 5
      `)

      // Customer tiers
      const customerTiers = await query(`
        SELECT 
          CASE 
            WHEN total_spent >= 100000 THEN 'VIP'
            WHEN total_spent >= 50000 THEN 'Premium'
            WHEN total_spent >= 10000 THEN 'Regular'
            ELSE 'New'
          END as tier,
          COUNT(*) as count
        FROM customers
        GROUP BY tier
        ORDER BY 
          CASE tier
            WHEN 'VIP' THEN 1
            WHEN 'Premium' THEN 2
            WHEN 'Regular' THEN 3
            WHEN 'New' THEN 4
          END
      `)

      // Inventory alerts
      const inventoryAlerts = await query(`
        SELECT 
          COUNT(*) FILTER (WHERE stock_quantity <= 0) as out_of_stock,
          COUNT(*) FILTER (WHERE stock_quantity <= reorder_point AND stock_quantity > 0) as low_stock,
          COUNT(*) FILTER (WHERE stock_quantity <= min_stock_level AND stock_quantity > reorder_point) as below_minimum,
          COUNT(*) FILTER (WHERE stock_quantity > min_stock_level) as in_stock
        FROM products
        WHERE is_active = true
      `)

      res.json({
        success: true,
        data: {
          sales: salesStats.rows[0],
          topProducts: topProducts.rows,
          customerTiers: customerTiers.rows,
          inventory: inventoryAlerts.rows[0],
        },
      })
    } catch (error) {
      console.error('❌ Error getting business analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Error getting business analytics',
        details: error.message,
      })
    }
  }

  // Export table data
  async exportTableData(req, res) {
    try {
      const { tableName, format = 'json' } = req.params
      const { limit = 1000 } = req.query

      console.log(`📤 Exporting ${tableName} data in ${format} format...`)

      // Validate table name
      const allowedTables = [
        'customers',
        'suppliers',
        'products',
        'orders',
        'order_items',
        'inventory_movements',
      ]
      if (!allowedTables.includes(tableName)) {
        return res.status(400).json({
          success: false,
          error: 'Table not allowed for export',
        })
      }

      const result = await query(`SELECT * FROM ${tableName} LIMIT $1`, [parseInt(limit)])

      if (format === 'csv') {
        // Convert to CSV
        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No data to export',
          })
        }

        const headers = Object.keys(result.rows[0]).join(',')
        const csvData = result.rows
          .map((row) =>
            Object.values(row)
              .map((value) =>
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value,
              )
              .join(','),
          )
          .join('\n')

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export.csv"`)
        res.send(headers + '\n' + csvData)
      } else if (format === 'sql') {
        // Generate INSERT statements
        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No data to export',
          })
        }

        const tableCols = Object.keys(result.rows[0])
        const sqlStatements = result.rows
          .map((row) => {
            const values = Object.values(row)
              .map((value) => {
                if (value === null) return 'NULL'
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
                if (value instanceof Date) return `'${value.toISOString()}'`
                return value
              })
              .join(', ')

            return `INSERT INTO ${tableName} (${tableCols.join(', ')}) VALUES (${values});`
          })
          .join('\n')

        res.setHeader('Content-Type', 'application/sql')
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export.sql"`)
        res.send(
          `-- Export of ${tableName} table\n-- Generated: ${new Date().toISOString()}\n\n${sqlStatements}`,
        )
      } else {
        // Return JSON
        res.json({
          success: true,
          data: {
            table: tableName,
            exported_at: new Date().toISOString(),
            record_count: result.rows.length,
            records: result.rows,
          },
        })
      }
    } catch (error) {
      console.error('❌ Error exporting table data:', error)
      res.status(500).json({
        success: false,
        error: 'Error exporting table data',
        details: error.message,
      })
    }
  }
}

module.exports = new BusinessTablesController()
