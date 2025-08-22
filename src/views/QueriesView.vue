<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />
    
    <div class="ml-64">
      <DashboardHeader />
      
      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">SQL Запросы</h1>
          <p class="text-gray-600">Выполнение и мониторинг SQL запросов</p>
        </div>

        <!-- Query Editor Section -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Редактор запросов</h2>
            <div class="flex space-x-2">
              <button
                @click="clearQuery"
                class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Очистить
              </button>
              <button
                @click="executeQuery"
                :disabled="!currentQuery.trim() || executing"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ executing ? 'Выполнение...' : '▶️ Выполнить' }}
              </button>
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <textarea
                v-model="currentQuery"
                placeholder="SELECT * FROM your_table LIMIT 10;"
                class="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              ></textarea>
            </div>
            
            <div class="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <strong>ℹ️ Ограничения безопасности:</strong> Разрешены только SELECT запросы для чтения данных
            </div>
          </div>
        </div>

        <!-- Query Results Section -->
        <div v-if="queryResults || queryError" class="bg-white rounded-lg shadow-card border border-gray-200 mb-6">
          <!-- Success Results -->
          <div v-if="queryResults && !queryError" class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Результаты запроса</h2>
              <div class="text-sm text-gray-600">
                {{ queryResults.rowCount }} строк за {{ queryResults.executionTime }}ms
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table v-if="queryResults.rows.length > 0" class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      v-for="(key, index) in Object.keys(queryResults.rows[0])"
                      :key="index"
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                    >
                      {{ key }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(row, index) in queryResults.rows.slice(0, 100)" :key="index" class="hover:bg-gray-50">
                    <td
                      v-for="(value, key) in row"
                      :key="key"
                      class="px-4 py-2 whitespace-nowrap text-gray-900 border-b border-gray-100"
                    >
                      {{ formatValue(value) }}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div v-else class="text-center py-8 text-gray-500">
                Запрос выполнен успешно, но результатов не найдено
              </div>
            </div>
            
            <div v-if="queryResults.rows.length > 100" class="mt-4 text-sm text-gray-600 text-center">
              Показано первые 100 строк из {{ queryResults.rowCount }}
            </div>
          </div>

          <!-- Error Results -->
          <div v-if="queryError" class="p-6">
            <h2 class="text-lg font-semibold text-red-700 mb-4">Ошибка вы��олнения запроса</h2>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre class="text-red-700 text-sm whitespace-pre-wrap">{{ queryError }}</pre>
            </div>
          </div>
        </div>

        <!-- Recent Queries Section -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">История запросов</h2>
            <button
              @click="refreshHistory"
              :disabled="loadingHistory"
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
            >
              {{ loadingHistory ? 'Загрузка...' : '🔄 Обновить' }}
            </button>
          </div>
          
          <div class="space-y-3">
            <div
              v-for="query in recentQueries"
              :key="query.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <span
                    :class="query.status === 'success' ? 'bg-success-500' : 'bg-error-500'"
                    class="w-2 h-2 rounded-full mr-2"
                  ></span>
                  <span class="text-sm font-medium text-gray-900">{{ query.duration }}</span>
                  <span class="text-xs text-gray-500 ml-2">{{ query.time }}</span>
                </div>
                <code class="text-sm text-gray-700 bg-white px-2 py-1 rounded border">
                  {{ query.query }}
                </code>
              </div>
              <button
                @click="loadQuery(query.query)"
                class="ml-4 px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200"
              >
                Загрузить
              </button>
            </div>
          </div>
          
          <div v-if="recentQueries.length === 0" class="text-center py-8 text-gray-500">
            История запросов пуста
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
import { dbService, type QueryResult, type QueryActivity } from '@/services/database'

const currentQuery = ref('')
const executing = ref(false)
const loadingHistory = ref(false)
const queryResults = ref<QueryResult | null>(null)
const queryError = ref<string | null>(null)
const recentQueries = ref<QueryActivity[]>([])

const clearQuery = () => {
  currentQuery.value = ''
  queryResults.value = null
  queryError.value = null
}

const executeQuery = async () => {
  if (!currentQuery.value.trim()) return
  
  executing.value = true
  queryResults.value = null
  queryError.value = null
  
  try {
    queryResults.value = await dbService.executeQuery(currentQuery.value)
  } catch (error) {
    queryError.value = error instanceof Error ? error.message : 'Неизвестная ошибка'
  } finally {
    executing.value = false
    // Refresh history after query execution
    await refreshHistory()
  }
}

const loadQuery = (query: string) => {
  currentQuery.value = query
  queryResults.value = null
  queryError.value = null
}

const formatValue = (value: any): string => {
  if (value === null) return 'NULL'
  if (value === undefined) return 'UNDEFINED'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  return String(value)
}

const refreshHistory = async () => {
  loadingHistory.value = true
  try {
    recentQueries.value = await dbService.getRecentQueries()
  } catch (error) {
    console.error('Failed to load query history:', error)
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  refreshHistory()
})
</script>
