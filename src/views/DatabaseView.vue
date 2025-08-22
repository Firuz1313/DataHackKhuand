<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />
    
    <div class="ml-64">
      <DashboardHeader />
      
      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">База данных</h1>
          <p class="text-gray-600">Управление подключениями и настройками базы данных</p>
        </div>

        <!-- Connection Status Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Статус подключения</h2>
              <button
                @click="testConnection"
                :disabled="testing"
                class="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200 disabled:opacity-50"
              >
                {{ testing ? 'Проверка...' : 'Проверить' }}
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                  <div 
                    :class="connectionStatus ? 'bg-success-500' : 'bg-error-500'"
                    class="w-3 h-3 rounded-full mr-3"
                  ></div>
                  <span class="font-medium">PostgreSQL</span>
                </div>
                <span 
                  :class="connectionStatus ? 'text-success-600' : 'text-error-600'"
                  class="text-sm font-medium"
                >
                  {{ connectionStatus ? 'Подключено' : 'Отключено' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Database Stats -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Всего таблиц:</span>
                <span class="font-medium">{{ stats.totalTables }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Размер БД:</span>
                <span class="font-medium">{{ stats.databaseSize }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Активные подключения:</span>
                <span class="font-medium">{{ stats.activeConnections }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Section -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Конфигурация подключения</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Хост</label>
              <input
                type="text"
                :value="dbConfig.host"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Порт</label>
              <input
                type="text"
                :value="dbConfig.port"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">База данных</label>
              <input
                type="text"
                :value="dbConfig.database"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Пользователь</label>
              <input
                type="text"
                :value="dbConfig.user"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Последняя активность</h2>
          
          <div class="space-y-3">
            <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center">
                <div class="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                <span class="text-sm">{{ activity.action }}</span>
              </div>
              <span class="text-xs text-gray-500">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService } from '@/services/database'

const testing = ref(false)
const connectionStatus = ref(false)

const stats = reactive({
  totalTables: 0,
  databaseSize: '0 MB',
  activeConnections: 0
})

const dbConfig = reactive({
  host: '103.246.146.132',
  port: '5432',
  database: 'hackathon',
  user: 'user_db'
})

const recentActivity = ref([
  { id: 1, action: 'Подключение к базе данных установлено', time: '5 мин назад' },
  { id: 2, action: 'Выполнен запрос к таблице users', time: '12 мин назад' },
  { id: 3, action: 'Обновлена схема таблицы products', time: '1 час назад' },
  { id: 4, action: 'Создан бэкап базы данных', time: '3 часа назад' }
])

const testConnection = async () => {
  testing.value = true
  try {
    connectionStatus.value = await dbService.testConnection()
  } catch (error) {
    console.error('Connection test failed:', error)
    connectionStatus.value = false
  } finally {
    testing.value = false
  }
}

const loadStats = async () => {
  try {
    const dbStats = await dbService.getDatabaseStats()
    stats.totalTables = dbStats.totalTables
    stats.databaseSize = dbStats.databaseSize
    stats.activeConnections = dbStats.activeConnections
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

onMounted(async () => {
  await testConnection()
  await loadStats()
})
</script>
