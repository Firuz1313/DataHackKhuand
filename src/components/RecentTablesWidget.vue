<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Таблицы в базе данных</h3>
      <button @click="fetchTables" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
        🔄 Обновить
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span class="ml-3 text-gray-600">Загрузка таблиц...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="bg-error-50 border border-error-200 rounded-lg p-4">
        <svg class="w-8 h-8 text-error-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <p class="text-error-700 font-medium">Ошибка загрузки таблиц</p>
        <p class="text-error-600 text-sm mt-1">{{ error }}</p>
        <button @click="fetchTables" class="mt-2 btn-primary text-sm">Повторить</button>
      </div>
    </div>

    <!-- Tables List -->
    <div v-else-if="tables.length > 0" class="space-y-4">
      <div 
        v-for="table in tables" 
        :key="table.id"
        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
        @click="selectTable(table)"
      >
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
          </div>
          <div>
            <h4 class="font-medium text-gray-900">{{ table.name }}</h4>
            <p class="text-sm text-gray-600">
              {{ table.records }} записей 
              <span v-if="table.schema">• схема: {{ table.schema }}</span>
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <span 
            :class="getStatusBadgeClass(table.status)"
            class="px-2 py-1 rounded-full text-xs font-medium"
          >
            {{ table.status }}
          </span>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
      </svg>
      <h3 class="text-lg font-medium text-gray-900">Нет таблиц</h3>
      <p class="text-gray-600 mt-1">В базе данных пока нет таблиц</p>
    </div>

    <!-- Connection Status -->
    <div class="mt-6 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">
          База данных: <span class="font-mono">{{ import.meta.env.VITE_LEGACY_DB_NAME || 'neondb' }}</span>
        </span>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <span class="text-success-600">Подключено</span>
        </div>
      </div>
    </div>

    <!-- Selected Table Details Modal -->
    <div v-if="selectedTable" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeModal">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Таблица: {{ selectedTable.name }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Название таблицы</label>
              <div class="mt-1 p-2 bg-gray-50 rounded border font-mono">{{ selectedTable.name }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Схема</label>
              <div class="mt-1 p-2 bg-gray-50 rounded border">{{ selectedTable.schema || 'public' }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Количество записей</label>
              <div class="mt-1 p-2 bg-gray-50 rounded border">{{ selectedTable.records }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Статус</label>
              <div class="mt-1">
                <span :class="getStatusBadgeClass(selectedTable.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ selectedTable.status }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button @click="queryTable" class="btn-primary">
              🔍 Просмотреть данные
            </button>
            <button @click="closeModal" class="btn-secondary">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbService, type TableInfo } from '../services/database'

const loading = ref(true)
const error = ref<string | null>(null)
const tables = ref<TableInfo[]>([])
const selectedTable = ref<TableInfo | null>(null)

const fetchTables = async () => {
  loading.value = true
  error.value = null
  
  try {
    const dbTables = await dbService.getTables()
    tables.value = dbTables
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки таблиц'
    console.error('Error fetching tables:', err)
  } finally {
    loading.value = false
  }
}

const selectTable = (table: TableInfo) => {
  selectedTable.value = table
}

const closeModal = () => {
  selectedTable.value = null
}

const queryTable = () => {
  if (selectedTable.value) {
    // For now, just log the query - in a full implementation, this would open a query interface
    console.log(`SELECT * FROM ${selectedTable.value.name} LIMIT 100`)
    alert(`Функция просмотра данных будет реализована в следующей версии.\n\nЗапрос: SELECT * FROM ${selectedTable.value.name} LIMIT 100`)
    closeModal()
  }
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'Активна':
      return 'bg-success-100 text-success-700'
    case 'Обновляется':
      return 'bg-warning-100 text-warning-700'
    case 'Ошибка':
      return 'bg-error-100 text-error-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

onMounted(() => {
  fetchTables()
})
</script>
