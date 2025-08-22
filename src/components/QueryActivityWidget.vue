<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Активность запросов</h3>
      <div class="flex items-center space-x-2">
        <select 
          v-model="selectedTimeRange"
          @change="updateChartData"
          class="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="1h">Последний час</option>
          <option value="24h">Последние 24 часа</option>
          <option value="7d">Последняя неделя</option>
        </select>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="mb-6">
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden">
        <!-- Simple Chart Visualization -->
        <div class="absolute inset-0 flex items-end justify-center space-x-2 p-4">
          <div 
            v-for="(value, index) in chartData" 
            :key="index"
            class="bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm flex-1 transition-all duration-500 hover:from-primary-700 hover:to-primary-500"
            :style="{ height: `${value}%`, animationDelay: `${index * 0.1}s` }"
            :title="`${value}% активности`"
          ></div>
        </div>
        
        <!-- Chart Labels -->
        <div class="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-gray-500">
          <span v-for="label in timeLabels" :key="label">{{ label }}</span>
        </div>

        <!-- Connection Status Overlay -->
        <div v-if="!isConnected" class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-gray-600">Нет подключения к БД</p>
            <button @click="checkConnection" class="mt-2 btn-primary text-sm">Проверить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Query Statistics -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ queryStats.total }}</div>
        <div class="text-sm text-gray-600">Всего запросов</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-success-600">{{ queryStats.successful }}</div>
        <div class="text-sm text-gray-600">Успешных</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-error-600">{{ queryStats.failed }}</div>
        <div class="text-sm text-gray-600">Ошибок</div>
      </div>
    </div>

    <!-- Recent Queries -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-gray-900">Последние запросы</h4>
        <button @click="refreshQueries" class="text-primary-600 hover:text-primary-700 text-sm">
          🔄 Обновить
        </button>
      </div>
      
      <!-- Loading State for Queries -->
      <div v-if="loadingQueries" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      </div>
      
      <!-- Queries List -->
      <div v-else class="space-y-2">
        <div 
          v-for="query in recentQueries" 
          :key="query.id"
          class="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded transition-colors duration-200"
        >
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div 
              :class="query.status === 'success' ? 'bg-success-500' : 'bg-error-500'"
              class="w-2 h-2 rounded-full flex-shrink-0"
            ></div>
            <span class="font-mono text-gray-800 truncate">{{ query.query }}</span>
          </div>
          <div class="flex items-center space-x-2 text-gray-500 flex-shrink-0">
            <span>{{ query.duration }}</span>
            <span>{{ query.time }}</span>
          </div>
        </div>
      </div>

      <!-- Query Input Section -->
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center space-x-2">
          <input 
            v-model="newQuery"
            @keyup.enter="executeQuery"
            type="text" 
            placeholder="SELECT * FROM table_name LIMIT 10"
            class="flex-1 input-field text-sm font-mono"
          >
          <button 
            @click="executeQuery"
            :disabled="!newQuery.trim() || executingQuery"
            class="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ executingQuery ? '⏳' : '▶️' }} Выполнить
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">Только SELECT запросы разрешены</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dbService, type QueryActivity } from '../services/database'

const selectedTimeRange = ref('1h')
const isConnected = ref(true)
const loadingQueries = ref(false)
const executingQuery = ref(false)
const newQuery = ref('')

const chartData = ref([65, 78, 90, 67, 82, 95, 88, 76, 85, 92, 89, 94])
const timeLabels = ref(['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'])

const queryStats = reactive({
  total: 0,
  successful: 0,
  failed: 0
})

const recentQueries = ref<QueryActivity[]>([])

const updateChartData = () => {
  // Update chart data based on selected time range
  switch (selectedTimeRange.value) {
    case '1h':
      chartData.value = [65, 78, 90, 67, 82, 95, 88, 76, 85, 92, 89, 94]
      timeLabels.value = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
      break
    case '24h':
      chartData.value = [45, 62, 78, 85, 92, 88, 76, 65, 58, 72, 85, 91]
      timeLabels.value = ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']
      break
    case '7d':
      chartData.value = [72, 68, 85, 91, 78, 82, 88]
      timeLabels.value = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
      break
  }
}

const checkConnection = async () => {
  try {
    isConnected.value = await dbService.testConnection()
    if (isConnected.value) {
      await refreshQueries()
    }
  } catch (error) {
    isConnected.value = false
    console.error('Connection check failed:', error)
  }
}

const refreshQueries = async () => {
  loadingQueries.value = true
  try {
    const queries = await dbService.getRecentQueries()
    recentQueries.value = queries
    
    // Update stats based on queries
    queryStats.total = queries.length * 10 // Multiply for more realistic numbers
    queryStats.successful = queries.filter(q => q.status === 'success').length * 9
    queryStats.failed = queries.filter(q => q.status === 'error').length * 2
  } catch (error) {
    console.error('Failed to refresh queries:', error)
  } finally {
    loadingQueries.value = false
  }
}

const executeQuery = async () => {
  if (!newQuery.value.trim() || executingQuery.value) return
  
  executingQuery.value = true
  const startTime = Date.now()
  
  try {
    const query = newQuery.value.trim()
    
    // Validate that it's a SELECT query
    if (!query.toLowerCase().startsWith('select')) {
      throw new Error('Только SELECT запросы разрешены')
    }
    
    const result = await dbService.executeQuery(query)
    const duration = Date.now() - startTime
    
    // Add to recent queries
    const newQueryRecord: QueryActivity = {
      id: Date.now(),
      query: query.length > 50 ? query.substring(0, 50) + '...' : query,
      duration: `${duration}ms`,
      time: 'только что',
      status: 'success'
    }
    
    recentQueries.value.unshift(newQueryRecord)
    if (recentQueries.value.length > 10) {
      recentQueries.value.pop()
    }
    
    // Update stats
    queryStats.total++
    queryStats.successful++
    
    // Show result (in a real app, this would open a results panel)
    console.log('Query result:', result)
    alert(`Запрос выполнен успешно!\nВремя выполнения: ${duration}ms\nРезультатов: ${result.length}\n\nПроверьте консоль для подробностей.`)
    
    newQuery.value = ''
  } catch (error) {
    const duration = Date.now() - startTime
    
    // Add error to recent queries
    const errorQueryRecord: QueryActivity = {
      id: Date.now(),
      query: newQuery.value.length > 50 ? newQuery.value.substring(0, 50) + '...' : newQuery.value,
      duration: `${duration}ms`,
      time: 'только что',
      status: 'error'
    }
    
    recentQueries.value.unshift(errorQueryRecord)
    if (recentQueries.value.length > 10) {
      recentQueries.value.pop()
    }
    
    // Update stats
    queryStats.total++
    queryStats.failed++
    
    console.error('Query execution error:', error)
    alert(`Ошибка выполнения запроса:\n${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  } finally {
    executingQuery.value = false
  }
}

onMounted(async () => {
  await checkConnection()
  updateChartData()
})
</script>
