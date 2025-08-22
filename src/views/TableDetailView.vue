<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />
    
    <div class="ml-64">
      <DashboardHeader />
      
      <main class="p-6">
        <!-- Header with breadcrumb -->
        <div class="mb-6">
          <nav class="flex mb-4" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
              <li>
                <router-link to="/tables" class="text-gray-500 hover:text-gray-700">
                  Таблицы
                </router-link>
              </li>
              <li>
                <span class="text-gray-400 mx-2">/</span>
                <span class="text-gray-900 font-medium">{{ tableName }}</span>
              </li>
            </ol>
          </nav>
          
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Данные таблицы: {{ tableName }}</h1>
              <p class="text-gray-600">Просмотр и навигация по записям таблицы</p>
            </div>
            
            <div class="flex space-x-3">
              <router-link 
                :to="{ name: 'table-schema', params: { tableName } }"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                🏗️ Схема таблицы
              </router-link>
              <button
                @click="refreshData"
                :disabled="loading"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {{ loading ? 'Загрузка...' : '🔄 Обновить' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-4 mb-6">
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                @input="debounceSearch"
                type="text"
                placeholder="Поиск по всем колонкам..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div class="flex gap-2">
              <select
                v-model="pageSize"
                @change="changePageSize"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="25">25 строк</option>
                <option value="50">50 строк</option>
                <option value="100">100 строк</option>
                <option value="250">250 строк</option>
              </select>
              
              <button
                @click="exportData"
                :disabled="!tableData.length"
                class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors duration-200 disabled:opacity-50"
              >
                📥 Экспорт CSV
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Загрузка данных таблицы...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white rounded-lg shadow-card border border-gray-200 p-8">
          <div class="text-center">
            <svg class="w-16 h-16 text-error-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки данных</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button
              @click="refreshData"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Data Table -->
        <div v-else-if="tableData.length > 0" class="bg-white rounded-lg shadow-card border border-gray-200">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                Записи {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalRows) }} из {{ totalRows }}
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                {{ columns.length }} колонок
                {{ searchQuery ? `• Фильтр: "${searchQuery}"` : '' }}
              </p>
            </div>
          </div>
          
          <!-- Table Content -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    #
                  </th>
                  <th
                    v-for="column in columns"
                    :key="column"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                  >
                    <div class="flex items-center space-x-1">
                      <span>{{ column }}</span>
                      <button
                        @click="sortBy(column)"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="(row, index) in tableData" :key="index" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-500 border-r border-gray-100">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td
                    v-for="column in columns"
                    :key="column"
                    class="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                  >
                    <div class="max-w-xs truncate" :title="String(row[column])">
                      {{ formatCellValue(row[column]) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Показано {{ tableData.length }} из {{ totalRows }} записей
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  @click="goToPage(1)"
                  :disabled="currentPage === 1"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ««
                </button>
                
                <button
                  @click="goToPage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                
                <span class="px-3 py-1 text-sm">
                  Страница {{ currentPage }} из {{ totalPages }}
                </span>
                
                <button
                  @click="goToPage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
                
                <button
                  @click="goToPage(totalPages)"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Таблица пуста</h3>
          <p class="text-gray-600 mb-4">
            {{ searchQuery ? 'Не найдено записей, соответствующих поисковому запросу' : 'В таблице нет данных' }}
          </p>
          <button
            @click="clearSearch"
            v-if="searchQuery"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Очистить поиск
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService } from '@/services/database'

const route = useRoute()
const tableName = ref(route.params.tableName as string)

const loading = ref(false)
const error = ref('')
const tableData = ref<any[]>([])
const columns = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(50)
const totalRows = ref(0)
const searchQuery = ref('')
const sortColumn = ref('')
const sortDirection = ref<'ASC' | 'DESC'>('ASC')

let searchTimeout: number

const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value))

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadTableData()
  }, 500)
}

const loadTableData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Build SQL query with pagination and search
    let query = `SELECT * FROM ${tableName.value}`
    
    if (searchQuery.value) {
      // Simple search across all text columns
      query += ` WHERE CAST(${tableName.value} AS TEXT) ILIKE '%${searchQuery.value}%'`
    }
    
    if (sortColumn.value) {
      query += ` ORDER BY ${sortColumn.value} ${sortDirection.value}`
    }
    
    const offset = (currentPage.value - 1) * pageSize.value
    query += ` LIMIT ${pageSize.value} OFFSET ${offset}`
    
    const result = await dbService.executeQuery(query)
    
    if (result.rows.length > 0) {
      tableData.value = result.rows
      columns.value = Object.keys(result.rows[0])
    } else {
      tableData.value = []
      columns.value = []
    }
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName.value}`
    if (searchQuery.value) {
      countQuery += ` WHERE CAST(${tableName.value} AS TEXT) ILIKE '%${searchQuery.value}%'`
    }
    
    const countResult = await dbService.executeQuery(countQuery)
    totalRows.value = countResult.rows[0]?.total || 0
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
    tableData.value = []
    columns.value = []
    totalRows.value = 0
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadTableData()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadTableData()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  loadTableData()
}

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortColumn.value = column
    sortDirection.value = 'ASC'
  }
  currentPage.value = 1
  loadTableData()
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  loadTableData()
}

const formatCellValue = (value: any): string => {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...'
  }
  return String(value)
}

const exportData = () => {
  if (!tableData.value.length) return
  
  // Create CSV content
  const headers = columns.value.join(',')
  const rows = tableData.value.map(row => 
    columns.value.map(col => {
      const value = row[col]
      if (value === null) return 'NULL'
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return String(value)
    }).join(',')
  )
  
  const csvContent = [headers, ...rows].join('\n')
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tableName.value}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch(() => route.params.tableName, (newTableName) => {
  if (newTableName && newTableName !== tableName.value) {
    tableName.value = newTableName as string
    currentPage.value = 1
    searchQuery.value = ''
    sortColumn.value = ''
    loadTableData()
  }
})

onMounted(() => {
  loadTableData()
})
</script>
