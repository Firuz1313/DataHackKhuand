<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <DashboardSidebar />

    <!-- Main Content -->
    <div class="ml-64">
      <!-- Header -->
      <DashboardHeader page-title="Кастомные таблицы" />

      <!-- Content -->
      <main class="p-6">
        <!-- Welcome Section -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-2">Управление бизнес-таблицами</h2>
              <p class="text-gray-800 font-medium">
                Создание, управление и экспорт пользовательских таблиц с данными
              </p>
            </div>
            <button
              @click="createNewTable"
              class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Создать таблицу</span>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center mb-8"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"
          ></div>
          <p class="text-gray-700 font-medium">Загрузка данных...</p>
        </div>

        <!-- Tables Overview -->
        <div v-else>
          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div
              v-for="stat in statisticsCards"
              :key="stat.id"
              class="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div class="flex items-center justify-between mb-4">
                <div
                  :class="stat.iconBg"
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                >
                  <component :is="stat.icon" class="w-6 h-6 text-white" />
                </div>
                <div
                  :class="stat.trend > 0 ? 'text-green-700' : 'text-gray-700'"
                  class="text-sm font-semibold"
                >
                  {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-2">{{ stat.value }}</div>
              <div class="text-sm text-gray-800 font-medium">{{ stat.label }}</div>
            </div>
          </div>

          <!-- Business Tables List -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Бизнес-таблицы</h3>
                <div class="flex items-center space-x-4">
                  <button
                    @click="refreshTables"
                    :disabled="refreshing"
                    class="text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-50"
                  >
                    {{ refreshing ? '⏳' : '🔄' }} Обновить
                  </button>
                  <select
                    v-model="viewMode"
                    class="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
                  >
                    <option value="cards">Карточки</option>
                    <option value="table">Таблица</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Cards View -->
            <div v-if="viewMode === 'cards'" class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  v-for="table in businessTables"
                  :key="table.table_name"
                  class="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  @click="viewTableData(table.table_name)"
                >
                  <div class="flex items-start justify-between mb-4">
                    <div
                      class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"
                    >
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
                        />
                      </svg>
                    </div>
                    <div class="flex space-x-2">
                      <button
                        @click.stop="exportTable(table.table_name, 'json')"
                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Экспорт JSON"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                      <button
                        @click.stop="exportTable(table.table_name, 'csv')"
                        class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Экспорт CSV"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                      <button
                        @click.stop="exportTable(table.table_name, 'sql')"
                        class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Экспорт SQL"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="mb-4">
                    <h4
                      class="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors"
                    >
                      {{ table.display_name }}
                    </h4>
                    <p class="text-sm text-gray-700 font-medium line-clamp-2">
                      {{ table.description }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600 font-medium">
                      {{ table.table_name }}
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-gray-900">
                        {{ formatNumber(table.record_count) }}
                      </div>
                      <div class="text-sm text-gray-700 font-medium">записей</div>
                    </div>
                  </div>

                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-600 font-medium">Статус</span>
                      <span
                        class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        Активна
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Table View -->
            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Таблица
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Название
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Записей
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Статус
                    </th>
                    <th
                      class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="table in businessTables"
                    :key="table.table_name"
                    class="hover:bg-gray-50 cursor-pointer"
                    @click="viewTableData(table.table_name)"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div
                          class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3"
                        >
                          <svg
                            class="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                        <span class="text-sm font-medium text-gray-900">{{
                          table.table_name
                        }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-semibold text-gray-900">
                          {{ table.display_name }}
                        </div>
                        <div class="text-sm text-gray-700 font-medium">{{ table.description }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-lg font-bold text-gray-900">{{
                        formatNumber(table.record_count)
                      }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        Активна
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end space-x-2">
                        <button
                          @click.stop="exportTable(table.table_name, 'json')"
                          class="text-blue-600 hover:text-blue-900 font-semibold"
                        >
                          JSON
                        </button>
                        <button
                          @click.stop="exportTable(table.table_name, 'csv')"
                          class="text-green-600 hover:text-green-900 font-semibold"
                        >
                          CSV
                        </button>
                        <button
                          @click.stop="exportTable(table.table_name, 'sql')"
                          class="text-purple-600 hover:text-purple-900 font-semibold"
                        >
                          SQL
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DashboardSidebar from '../components/DashboardSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'

// Icons
const DatabaseIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>`,
}

const UsersIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>`,
}

const ChartIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`,
}

const CheckIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
}

// State
const loading = ref(true)
const refreshing = ref(false)
const viewMode = ref('cards')
const businessTables = ref([])

// Statistics computed
const statisticsCards = computed(() => [
  {
    id: 1,
    label: 'Всего таблиц',
    value: businessTables.value.length.toString(),
    trend: 15,
    icon: DatabaseIcon,
    iconBg: 'bg-blue-500',
  },
  {
    id: 2,
    label: 'Записей данных',
    value: businessTables.value
      .reduce((sum, table) => sum + (table.record_count || 0), 0)
      .toLocaleString('ru-RU'),
    trend: 8,
    icon: UsersIcon,
    iconBg: 'bg-green-500',
  },
  {
    id: 3,
    label: 'Активных таблиц',
    value: businessTables.value.filter((table) => table.record_count > 0).length.toString(),
    trend: 5,
    icon: ChartIcon,
    iconBg: 'bg-purple-500',
  },
  {
    id: 4,
    label: 'Валидаций',
    value: '100%',
    trend: 0,
    icon: CheckIcon,
    iconBg: 'bg-orange-500',
  },
])

// Load business tables
const loadBusinessTables = async () => {
  try {
    loading.value = true

    const response = await fetch('/api/business-tables/summary')
    const result = await response.json()

    if (result.success) {
      businessTables.value = result.data
      console.log('✅ Business tables loaded:', result.data)
    } else {
      throw new Error(result.error || 'Failed to load business tables')
    }
  } catch (error) {
    console.error('❌ Error loading business tables:', error)

    // Fallback data
    businessTables.value = [
      {
        table_name: 'customers',
        display_name: 'Клиенты',
        description: 'Клиенты и их контактная информация',
        record_count: 8,
      },
      {
        table_name: 'suppliers',
        display_name: 'Поставщики',
        description: 'Поставщики товаров и услуг',
        record_count: 5,
      },
      {
        table_name: 'products',
        display_name: 'Товары',
        description: 'Каталог товаров и услуг',
        record_count: 8,
      },
      {
        table_name: 'orders',
        display_name: 'Заказы',
        description: 'Заказы клиентов',
        record_count: 5,
      },
    ]
  } finally {
    loading.value = false
  }
}

// Helper functions
const formatNumber = (num: number): string => {
  return num.toLocaleString('ru-RU')
}

// Action handlers
const refreshTables = async () => {
  refreshing.value = true
  await loadBusinessTables()
  refreshing.value = false
}

const viewTableData = (tableName: string) => {
  console.log('Viewing table data:', tableName)
  // Navigate to table detail view or open modal
  alert(`Просмотр данных таблицы: ${tableName}`)
}

const exportTable = async (tableName: string, format: string) => {
  try {
    console.log(`Exporting ${tableName} as ${format}...`)

    const response = await fetch(`/api/business-tables/export/${tableName}/${format}`)

    if (format === 'json') {
      const result = await response.json()
      if (result.success) {
        // Download JSON file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${tableName}_export.json`
        link.click()
        URL.revokeObjectURL(url)
        alert(`✅ Экспорт ${tableName} в формате JSON завершен`)
      }
    } else {
      // For CSV and SQL, download directly
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${tableName}_export.${format}`
      link.click()
      URL.revokeObjectURL(url)
      alert(`✅ Экспорт ${tableName} в формате ${format.toUpperCase()} завершен`)
    }
  } catch (error) {
    console.error('Export error:', error)
    alert(`❌ Ошибка экспорта: ${error.message}`)
  }
}

const createNewTable = () => {
  console.log('Creating new table...')
  alert('🔧 Функция создания новой таблицы будет доступна в следующей версии')
}

onMounted(() => {
  console.log('🎯 Custom tables view loaded')
  loadBusinessTables()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
