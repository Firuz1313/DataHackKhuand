<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <DashboardSidebar />
    
    <!-- Main Content -->
    <div class="ml-64">
      <!-- Header -->
      <DashboardHeader page-title="Dashboard" />
      
      <!-- Dashboard Content -->
      <main class="p-6">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать в DataBoard</h2>
          <p class="text-gray-600">
            Управление базами данных: 
            <span class="font-mono text-primary-600">{{ getLegacyDatabase() }}</span> и 
            <span class="font-mono text-primary-600">Neon</span>
          </p>
        </div>

        <!-- Connection Status Banner -->
        <div class="mb-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Neon Status -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">Neon PostgreSQL</h3>
                    <p class="text-sm text-gray-600">Основная база данных</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span class="text-sm font-medium text-success-600">Активна</span>
                </div>
              </div>
            </div>

            <!-- Legacy Status -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">Legacy PostgreSQL</h3>
                    <p class="text-sm text-gray-600">{{ getLegacyHost() }}:{{ getLegacyPort() }}</p>
                  </div>
                </div>
                <span class="badge-warning">Только чтение</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Database Stats Cards -->
        <DatabaseStatsCards />

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Query Activity -->
          <QueryActivityWidget />
          
          <!-- Database Performance -->
          <DatabasePerformanceWidget />
        </div>

        <!-- Secondary Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recent Tables - Takes 2 columns -->
          <div class="lg:col-span-2">
            <RecentTablesWidget />
          </div>
          
          <!-- Database Connection Info -->
          <div class="card p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Детали подключения</h3>
            
            <div class="space-y-4">
              <!-- Neon Connection -->
              <div class="border border-gray-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900">Neon Database</h4>
                  <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 bg-success-500 rounded-full"></div>
                    <span class="text-xs text-success-600">Онлайн</span>
                  </div>
                </div>
                <div class="space-y-1 text-xs text-gray-600">
                  <div><span class="font-medium">База:</span> neondb</div>
                  <div><span class="font-medium">Регион:</span> us-east-2</div>
                  <div><span class="font-medium">Тип:</span> Pooler connection</div>
                </div>
              </div>

              <!-- Legacy Connection -->
              <div class="border border-gray-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900">Legacy PostgreSQL</h4>
                  <span class="badge-info text-xs">SSH требуется</span>
                </div>
                <div class="space-y-1 text-xs text-gray-600">
                  <div><span class="font-medium">Хост:</span> {{ getLegacyHost() }}</div>
                  <div><span class="font-medium">Порт:</span> {{ getLegacyPort() }}</div>
                  <div><span class="font-medium">База:</span> {{ getLegacyDatabase() }}</div>
                  <div><span class="font-medium">Пользователь:</span> {{ getLegacyUser() }}</div>
                  <div><span class="font-medium">Права:</span> SELECT only</div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-6 pt-4 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Быстрые действия</h4>
              <div class="space-y-2">
                <button 
                  @click="openQueryInterface" 
                  class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  🔍 SQL-редактор
                </button>
                <button 
                  @click="viewSchema"
                  class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  📊 Схема базы данных
                </button>
                <button 
                  @click="exportData"
                  class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  📈 Экспорт данных
                </button>
              </div>
            </div>

            <!-- System Info -->
            <div class="mt-6 pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">Версия PostgreSQL</span>
                <span class="text-sm text-gray-600">14+</span>
              </div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-sm font-medium text-gray-900">Время работы</span>
                <span class="text-sm text-gray-600">{{ uptime }}</span>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                Последнее обновление: {{ new Date().toLocaleTimeString('ru-RU') }}
              </div>
            </div>
          </div>
        </div>

        <!-- SQL Query Interface Modal -->
        <div v-if="showQueryInterface" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeQueryInterface">
          <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96" @click.stop>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">SQL Редактор</h3>
              <button @click="closeQueryInterface" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">SQL Запрос (только SELECT)</label>
                <textarea 
                  v-model="sqlQuery"
                  rows="6"
                  class="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SELECT * FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;"
                ></textarea>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                  💡 Попробуйте: 
                  <button @click="setSampleQuery('tables')" class="text-primary-600 hover:underline">список таблиц</button>,
                  <button @click="setSampleQuery('columns')" class="text-primary-600 hover:underline">столбцы</button>,
                  <button @click="setSampleQuery('size')" class="text-primary-600 hover:underline">размер БД</button>
                </div>
                <button 
                  @click="executeQuery"
                  :disabled="!sqlQuery.trim() || executingQuery"
                  class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ executingQuery ? '⏳ Выполнение...' : '▶️ Выполнить' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2024 DataBoard. Профессиональная панель управления базами данных.
            </div>
            <div class="flex items-center space-x-4">
              <button class="hover:text-gray-700">Документация</button>
              <button class="hover:text-gray-700">Поддержка</button>
              <button class="hover:text-gray-700">API</button>
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
import DatabaseStatsCards from '../components/DatabaseStatsCards.vue'
import QueryActivityWidget from '../components/QueryActivityWidget.vue'
import DatabasePerformanceWidget from '../components/DatabasePerformanceWidget.vue'
import RecentTablesWidget from '../components/RecentTablesWidget.vue'
import { dbService } from '../services/database'

const showQueryInterface = ref(false)
const sqlQuery = ref('')
const executingQuery = ref(false)

// Helper functions to safely access environment variables
const getLegacyHost = (): string => {
  return import.meta.env.VITE_LEGACY_DB_HOST || '103.246.146.132'
}

const getLegacyPort = (): string => {
  return import.meta.env.VITE_LEGACY_DB_PORT || '5432'
}

const getLegacyDatabase = (): string => {
  return import.meta.env.VITE_LEGACY_DB_NAME || 'hackathon'
}

const getLegacyUser = (): string => {
  return import.meta.env.VITE_LEGACY_DB_USER || 'user_db'
}

const uptime = computed(() => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return `${hours}ч ${minutes}мин`
})

const openQueryInterface = () => {
  showQueryInterface.value = true
  sqlQuery.value = 'SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 10;'
}

const closeQueryInterface = () => {
  showQueryInterface.value = false
  sqlQuery.value = ''
}

const setSampleQuery = (type: string) => {
  switch (type) {
    case 'tables':
      sqlQuery.value = `SELECT 
  table_name, 
  table_type,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;`
      break
    case 'columns':
      sqlQuery.value = `SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;`
      break
    case 'size':
      sqlQuery.value = `SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  current_database() as database_name;`
      break
  }
}

const executeQuery = async () => {
  if (!sqlQuery.value.trim() || executingQuery.value) return
  
  executingQuery.value = true
  
  try {
    const result = await dbService.executeQuery(sqlQuery.value)
    console.log('Query result:', result)
    
    alert(`✅ Запрос выполнен успешно!\n\nРезультатов: ${result.length}\n\nПодробности в консоли браузера (F12 → Console)`)
  } catch (error) {
    console.error('Query execution error:', error)
    alert(`❌ Ошибка выполнения запроса:\n\n${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  } finally {
    executingQuery.value = false
  }
}

const viewSchema = () => {
  alert('🚀 Функция просмотра схемы будет добавлена в следующей версии!')
}

const exportData = () => {
  alert('🚀 Функция экспорта данных будет добавлена в следующей версии!')
}

onMounted(() => {
  console.log('🎯 DataBoard загружен')
  console.log('📊 Neon подключение:', import.meta.env.VITE_DATABASE_URL ? 'настроено' : 'не настроено')
  console.log('🔒 Legacy подключение:', `${getLegacyUser()}@${getLegacyHost()}:${getLegacyPort()}/${getLegacyDatabase()}`)
})
</script>
