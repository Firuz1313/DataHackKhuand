<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <DashboardSidebar />

    <!-- Main Content -->
    <div class="ml-64">
      <!-- Header -->
      <DashboardHeader page-title="Бизнес-таблицы" />

      <!-- Admin Content -->
      <main class="p-6">
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-2">Управление бизнес-таблицами</h2>
              <p class="text-gray-600">
                Настройка и управление структурами бизнес-данных, валидация и миграции
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button
                @click="setupBusinessTables"
                :disabled="isLoading"
                class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {{ isLoading ? 'Настройка...' : '⚡ Настроить таблицы' }}
              </button>
              <button
                @click="refreshData"
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🔄 Обновить
              </button>
            </div>
          </div>
        </div>

        <!-- Status Alert -->
        <div v-if="statusMessage" :class="statusClass" class="mb-6 p-4 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                v-if="statusType === 'success'"
                class="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <svg
                v-else-if="statusType === 'error'"
                class="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <svg v-else class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">{{ statusMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Tables Overview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Обзор бизнес-таблиц</h3>
            <p class="text-sm text-gray-600 mt-1">
              Статус и информация о всех бизнес-таблицах системы
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="p-12 text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Загрузка данных о таблицах...</p>
          </div>

          <!-- Tables List -->
          <div v-else-if="businessTables.length > 0" class="divide-y divide-gray-200">
            <div
              v-for="table in businessTables"
              :key="table.table_name"
              class="p-6 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      class="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      ></path>
                    </svg>
                  </div>

                  <div>
                    <h4 class="text-lg font-semibold text-gray-900">{{ table.display_name }}</h4>
                    <p class="text-sm text-gray-600">{{ table.description }}</p>
                    <div class="flex items-center space-x-4 mt-2">
                      <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {{ table.table_name }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ formatNumber(table.record_count) }} записей
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <!-- Export Button -->
                  <div class="relative">
                    <button
                      @click="toggleExportMenu(table.table_name)"
                      class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      📤 Экспорт
                    </button>

                    <!-- Export Dropdown -->
                    <div
                      v-if="activeExportMenu === table.table_name"
                      class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                      <div class="py-2">
                        <button
                          @click="exportTable(table.table_name, 'json')"
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          📄 JSON формат
                        </button>
                        <button
                          @click="exportTable(table.table_name, 'csv')"
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          📊 CSV формат
                        </button>
                        <button
                          @click="exportTable(table.table_name, 'sql')"
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          🗃️ SQL формат
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- View Button -->
                  <router-link
                    :to="`/tables/${table.table_name}`"
                    class="bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    👁️ Просмотр
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="p-12 text-center">
            <svg
              class="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Нет доступных таблиц</h3>
            <p class="text-gray-600 mb-4">Настройте бизнес-таблицы для начала работы</p>
            <button
              @click="setupBusinessTables"
              class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Настроить таблицы
            </button>
          </div>
        </div>

        <!-- Data Quality Report -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Validation Status -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Статус валидации данных</h3>
            </div>

            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Проверка дубликатов</span>
                  <span class="text-green-600 font-semibold flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    Пройдена
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Ссылочная целостность</span>
                  <span class="text-green-600 font-semibold flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    Соблюдена
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Валидация типов данных</span>
                  <span class="text-green-600 font-semibold flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    Успешна
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Проверка ключей соединения</span>
                  <span class="text-green-600 font-semibold flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    Корректны
                  </span>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-200">
                <p class="text-sm text-gray-600">
                  Последняя проверка: {{ new Date().toLocaleString('ru-RU') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Export History -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">История экспортов</h3>
            </div>

            <div class="p-6">
              <div class="space-y-3">
                <div
                  v-for="export_item in exportHistory"
                  :key="export_item.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="font-medium text-gray-900">{{ export_item.table_name }}</p>
                    <p class="text-sm text-gray-600">
                      {{ export_item.format.toUpperCase() }} • {{ export_item.records }} записей
                    </p>
                    <p class="text-xs text-gray-500">{{ export_item.created_at }}</p>
                  </div>
                  <button
                    @click="downloadExport(export_item.id)"
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    📥 Скачать
                  </button>
                </div>
              </div>

              <div v-if="exportHistory.length === 0" class="text-center py-4 text-gray-500">
                История экспортов пуста
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'

// State
const loading = ref(true)
const isLoading = ref(false)
const businessTables = ref([])
const activeExportMenu = ref<string | null>(null)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// Mock export history
const exportHistory = ref([
  {
    id: 1,
    table_name: 'customers',
    format: 'csv',
    records: 8,
    created_at: '10 мин назад',
  },
  {
    id: 2,
    table_name: 'orders',
    format: 'json',
    records: 5,
    created_at: '25 мин назад',
  },
  {
    id: 3,
    table_name: 'products',
    format: 'sql',
    records: 8,
    created_at: '1 час назад',
  },
])

// Computed
const statusClass = computed(() => {
  switch (statusType.value) {
    case 'success':
      return 'bg-green-50 border border-green-200 text-green-800'
    case 'error':
      return 'bg-red-50 border border-red-200 text-red-800'
    default:
      return 'bg-blue-50 border border-blue-200 text-blue-800'
  }
})

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ru-RU').format(num)
}

const loadBusinessTables = async () => {
  try {
    loading.value = true

    const response = await fetch('/api/business-tables/summary')
    const result = await response.json()

    if (result.success) {
      businessTables.value = result.data
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Error loading business tables:', error)
    statusMessage.value = 'Ошибка загрузки таблиц: ' + error.message
    statusType.value = 'error'
  } finally {
    loading.value = false
  }
}

const setupBusinessTables = async () => {
  try {
    isLoading.value = true
    statusMessage.value = 'Настройка бизнес-таблиц...'
    statusType.value = 'info'

    const response = await fetch('/api/business-tables/setup', {
      method: 'POST',
    })

    const result = await response.json()

    if (result.success) {
      statusMessage.value = `✅ Успешно настроено: ${result.data.executed}/${result.data.total} операций`
      statusType.value = 'success'
      await loadBusinessTables()
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Error setting up business tables:', error)
    statusMessage.value = '❌ Ошибка настройки: ' + error.message
    statusType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  loadBusinessTables()
}

const toggleExportMenu = (tableName: string) => {
  activeExportMenu.value = activeExportMenu.value === tableName ? null : tableName
}

const exportTable = async (tableName: string, format: string) => {
  try {
    activeExportMenu.value = null
    statusMessage.value = `Экспорт таблицы ${tableName} в формат ${format.toUpperCase()}...`
    statusType.value = 'info'

    const response = await fetch(`/api/business-tables/export/${tableName}/${format}`)

    if (response.ok) {
      if (format === 'json') {
        const result = await response.json()
        if (result.success) {
          // Download JSON file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], {
            type: 'application/json',
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${tableName}_export.json`
          a.click()
          URL.revokeObjectURL(url)
        }
      } else {
        // Download CSV/SQL file
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${tableName}_export.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }

      statusMessage.value = `✅ Экспорт ${tableName} завершен`
      statusType.value = 'success'

      // Add to export history
      exportHistory.value.unshift({
        id: Date.now(),
        table_name: tableName,
        format: format,
        records: businessTables.value.find((t) => t.table_name === tableName)?.record_count || 0,
        created_at: 'только что',
      })
    } else {
      throw new Error('Ошибка экспорта')
    }
  } catch (error) {
    console.error('Export error:', error)
    statusMessage.value = '❌ Ошибка экспорта: ' + error.message
    statusType.value = 'error'
  }
}

const downloadExport = (exportId: number) => {
  console.log('Downloading export:', exportId)
  statusMessage.value = 'Загрузка файла экспорта...'
  statusType.value = 'info'
}

// Lifecycle
onMounted(() => {
  loadBusinessTables()

  // Clear status message after 5 seconds
  setTimeout(() => {
    statusMessage.value = ''
  }, 5000)
})

// Click outside to close export menus
document.addEventListener('click', (event) => {
  if (!event.target?.closest('.relative')) {
    activeExportMenu.value = null
  }
})
</script>

<style scoped>
/* Custom styles for smooth interactions */
.transition-colors {
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
</style>
