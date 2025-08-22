<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />
    
    <div class="ml-64">
      <DashboardHeader />
      
      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Таблицы</h1>
          <p class="text-gray-600">Просмотр и управление таблицами базы данных</p>
        </div>

        <!-- Search and Filter Section -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-4 mb-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Поиск таблиц..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              @click="refreshTables"
              :disabled="loading"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
            >
              {{ loading ? 'Загрузка...' : '🔄 Обновить' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-lg shadow-card border border-gray-200 p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Загрузка таблиц...</p>
        </div>

        <!-- Tables List -->
        <div v-else-if="filteredTables.length > 0" class="bg-white rounded-lg shadow-card border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">
              Найдено таблиц: {{ filteredTables.length }}
            </h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Записей
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Последнее обновление
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="table in filteredTables" :key="table.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ table.name }}</div>
                        <div class="text-sm text-gray-500">{{ table.schema }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ table.records }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="getStatusClass(table.status)"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ table.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ table.lastUpdate }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <router-link 
                      :to="{ name: 'table-detail', params: { tableName: table.name } }"
                      class="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-lg transition-colors duration-200"
                    >
                      📊 Данные
                    </router-link>
                    <router-link 
                      :to="{ name: 'table-schema', params: { tableName: table.name } }"
                      class="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors duration-200"
                    >
                      🏗️ Схема
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Таблицы не найдены</h3>
          <p class="text-gray-600 mb-4">
            {{ searchQuery ? 'Попробуйте изменить поисковый запрос' : 'В базе данных нет таблиц' }}
          </p>
          <button
            @click="refreshTables"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Обновить список
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService, type TableInfo } from '@/services/database'

const loading = ref(false)
const searchQuery = ref('')
const tables = ref<TableInfo[]>([])

const filteredTables = computed(() => {
  if (!searchQuery.value) return tables.value
  
  const query = searchQuery.value.toLowerCase()
  return tables.value.filter(table => 
    table.name.toLowerCase().includes(query) ||
    table.schema?.toLowerCase().includes(query)
  )
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Активна':
      return 'bg-success-100 text-success-800'
    case 'Обновляется':
      return 'bg-warning-100 text-warning-800'
    case 'Ошибка':
      return 'bg-error-100 text-error-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const refreshTables = async () => {
  loading.value = true
  try {
    tables.value = await dbService.getTables()
  } catch (error) {
    console.error('Failed to load tables:', error)
    tables.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshTables()
})
</script>
