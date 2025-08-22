<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />
    
    <div class="ml-64">
      <DashboardHeader />
      
      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Аналитика</h1>
          <p class="text-gray-600">Мониторинг производительности и статистика использования</p>
        </div>

        <!-- Performance Metrics -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">CPU</h3>
              <div class="text-2xl">💻</div>
            </div>
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Использование</span>
                <span class="text-lg font-bold text-primary-600">{{ performance.cpu.current }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  :style="{ width: performance.cpu.current + '%' }"
                  class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                ></div>
              </div>
            </div>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Среднее:</span>
                <span>{{ performance.cpu.average }}%</span>
              </div>
              <div class="flex justify-between">
                <span>Максимум:</span>
                <span>{{ performance.cpu.max }}%</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Память</h3>
              <div class="text-2xl">🧠</div>
            </div>
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Использование</span>
                <span class="text-lg font-bold text-success-600">{{ performance.memory.current }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  :style="{ width: performance.memory.current + '%' }"
                  class="bg-success-500 h-2 rounded-full transition-all duration-300"
                ></div>
              </div>
            </div>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Среднее:</span>
                <span>{{ performance.memory.average }}%</span>
              </div>
              <div class="flex justify-between">
                <span>Доступно:</span>
                <span>{{ performance.memory.available }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">I/O Диск</h3>
              <div class="text-2xl">💾</div>
            </div>
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Активность</span>
                <span class="text-lg font-bold text-warning-600">{{ performance.io.current }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  :style="{ width: performance.io.current + '%' }"
                  class="bg-warning-500 h-2 rounded-full transition-all duration-300"
                ></div>
              </div>
            </div>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Чтение:</span>
                <span>{{ performance.io.read }}</span>
              </div>
              <div class="flex justify-between">
                <span>Запись:</span>
                <span>{{ performance.io.write }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Query Activity Chart -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Активность запросов</h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-600">Последняя неделя</span>
              <button
                @click="refreshAnalytics"
                :disabled="loading"
                class="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200 disabled:opacity-50"
              >
                {{ loading ? 'Загрузка...' : '🔄 Обновить' }}
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-7 gap-4 mb-6">
            <div v-for="(day, index) in weeklyActivity" :key="index" class="text-center">
              <div class="text-xs text-gray-500 mb-2">{{ day.name }}</div>
              <div class="relative h-20 bg-gray-100 rounded-lg flex items-end justify-center p-1">
                <div 
                  :style="{ height: (day.queries / Math.max(...weeklyActivity.map(d => d.queries))) * 100 + '%' }"
                  class="bg-primary-500 w-6 rounded-t transition-all duration-300"
                ></div>
              </div>
              <div class="text-xs text-gray-700 mt-1">{{ day.queries }}</div>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary-600">{{ totalQueries }}</div>
              <div class="text-sm text-gray-600">Всего запросов</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-success-600">{{ successfulQueries }}</div>
              <div class="text-sm text-gray-600">Успешных</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-error-600">{{ errorQueries }}</div>
              <div class="text-sm text-gray-600">Ошибок</div>
            </div>
          </div>
        </div>

        <!-- Real-time Monitoring -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Мониторинг в реальном времени</h2>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span class="text-sm text-gray-600">Обновлено {{ lastUpdate }}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Активные подключения</span>
                <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                </div>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ realTimeStats.activeConnections }}</div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Запросов/мин</span>
                <div class="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center">
                  <div class="w-2 h-2 bg-success-500 rounded-full"></div>
                </div>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ realTimeStats.queriesPerMinute }}</div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Ср. время ответа</span>
                <div class="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center">
                  <div class="w-2 h-2 bg-warning-500 rounded-full"></div>
                </div>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ realTimeStats.avgResponseTime }}ms</div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Размер кэша</span>
                <div class="w-6 h-6 bg-info-100 rounded-full flex items-center justify-center">
                  <div class="w-2 h-2 bg-info-500 rounded-full"></div>
                </div>
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ realTimeStats.cacheSize }}</div>
            </div>
          </div>
        </div>

        <!-- Database Health -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Состояние базы данных</h2>
          
          <div class="space-y-4">
            <div v-for="health in healthChecks" :key="health.name" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center">
                <div 
                  :class="health.status === 'healthy' ? 'bg-success-500' : health.status === 'warning' ? 'bg-warning-500' : 'bg-error-500'"
                  class="w-3 h-3 rounded-full mr-3"
                ></div>
                <div>
                  <div class="font-medium text-gray-900">{{ health.name }}</div>
                  <div class="text-sm text-gray-600">{{ health.description }}</div>
                </div>
              </div>
              <div class="text-sm text-gray-500">{{ health.lastCheck }}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'

const loading = ref(false)
const lastUpdate = ref(new Date().toLocaleTimeString())

const performance = reactive({
  cpu: { current: 23, average: 18, max: 45 },
  memory: { current: 67, average: 62, available: '2.1 GB' },
  io: { current: 15, read: '45 MB/s', write: '12 MB/s' }
})

const weeklyActivity = ref([
  { name: 'Пн', queries: 45 },
  { name: 'Вт', queries: 67 },
  { name: 'Ср', queries: 89 },
  { name: 'Чт', queries: 123 },
  { name: 'Пт', queries: 156 },
  { name: 'Сб', queries: 78 },
  { name: 'Вс', queries: 34 }
])

const totalQueries = ref(592)
const successfulQueries = ref(567)
const errorQueries = ref(25)

const realTimeStats = reactive({
  activeConnections: 12,
  queriesPerMinute: 45,
  avgResponseTime: 124,
  cacheSize: '2.4 GB'
})

const healthChecks = ref([
  {
    name: 'Подключение к БД',
    description: 'Соединение с PostgreSQL стабильно',
    status: 'healthy',
    lastCheck: '30 сек назад'
  },
  {
    name: 'Производительность запросов',
    description: 'Среднее время ответа в пределах нормы',
    status: 'healthy',
    lastCheck: '1 мин назад'
  },
  {
    name: 'Использование памяти',
    description: 'Высокое использование памяти',
    status: 'warning',
    lastCheck: '2 мин назад'
  },
  {
    name: 'Место на диске',
    description: 'Достаточно свободного места',
    status: 'healthy',
    lastCheck: '5 мин назад'
  }
])

let updateInterval: number

const refreshAnalytics = async () => {
  loading.value = true
  
  // Simulate API calls
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Update performance metrics with random variations
  performance.cpu.current = Math.max(0, Math.min(100, performance.cpu.current + (Math.random() - 0.5) * 10))
  performance.memory.current = Math.max(0, Math.min(100, performance.memory.current + (Math.random() - 0.5) * 5))
  performance.io.current = Math.max(0, Math.min(100, performance.io.current + (Math.random() - 0.5) * 15))
  
  lastUpdate.value = new Date().toLocaleTimeString()
  loading.value = false
}

const startRealTimeUpdates = () => {
  updateInterval = setInterval(() => {
    // Update real-time stats
    realTimeStats.activeConnections = Math.max(1, realTimeStats.activeConnections + Math.floor((Math.random() - 0.5) * 3))
    realTimeStats.queriesPerMinute = Math.max(0, realTimeStats.queriesPerMinute + Math.floor((Math.random() - 0.5) * 10))
    realTimeStats.avgResponseTime = Math.max(50, realTimeStats.avgResponseTime + Math.floor((Math.random() - 0.5) * 20))
    
    lastUpdate.value = new Date().toLocaleTimeString()
  }, 5000) // Update every 5 seconds
}

onMounted(() => {
  refreshAnalytics()
  startRealTimeUpdates()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>
