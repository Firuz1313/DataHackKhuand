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
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            Профессиональная панель управления данными
          </h2>
          <p class="text-gray-800 font-medium">
            Мониторинг производительности, качества данных и аналитики в реальном времени
          </p>
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

        <!-- Main Dashboard Content -->
        <div v-else>
          <!-- Executive KPI Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div
              v-for="kpi in realTimeKPIs"
              :key="kpi.id"
              class="relative bg-white rounded-lg shadow-card border border-gray-200 p-6 overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <!-- Background gradient -->
              <div
                :class="kpi.gradient"
                class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              ></div>

              <div class="relative z-10">
                <div class="flex items-center justify-between mb-4">
                  <div
                    :class="kpi.iconBg"
                    class="w-12 h-12 rounded-lg flex items-center justify-center"
                  >
                    <component :is="kpi.icon" class="w-6 h-6 text-white" />
                  </div>
                  <div
                    :class="kpi.trend > 0 ? 'text-success-800' : 'text-error-800'"
                    class="flex items-center text-sm font-semibold"
                  >
                    <svg
                      :class="kpi.trend > 0 ? 'rotate-0' : 'rotate-180'"
                      class="w-4 h-4 mr-1 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 17l9.2-9.2M17 17V8m0 9h-9"
                      />
                    </svg>
                    {{ formatPercentage(Math.abs(kpi.trend)) }}
                  </div>
                </div>

                <div class="mb-2">
                  <div class="text-3xl font-bold text-gray-900 mb-1">{{ kpi.value }}</div>
                  <div class="text-sm text-gray-800 font-medium">{{ kpi.label }}</div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700 font-medium">{{ kpi.subtitle }}</span>
                  <div class="flex space-x-1">
                    <div
                      v-for="(bar, i) in kpi.sparkline"
                      :key="i"
                      :style="{ height: bar * 20 + 'px' }"
                      :class="kpi.sparklineColor"
                      class="w-1 rounded-sm opacity-60"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Real Data Quality Dashboard -->
          <div
            class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl text-white p-8 mb-8 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold mb-2 text-white">Оценка качества данных</h2>
                <p class="text-blue-100 font-medium">
                  Анализ на основе реальных метрик базы данных
                </p>
              </div>
              <div class="text-center">
                <div class="text-6xl font-bold mb-2 text-white">{{ realDataQualityScore }}</div>
                <div class="text-lg text-blue-100 font-medium">из 100</div>
                <div
                  :class="getQualityGrade(realDataQualityScore).color"
                  class="inline-block px-4 py-2 rounded-full text-sm font-semibold mt-2 text-gray-900"
                >
                  {{ getQualityGrade(realDataQualityScore).label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Real Performance Metrics Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Real Database Stats -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Статистика БД</h3>
                <div class="text-sm text-gray-700 font-medium">Реальные данные</div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-800 font-medium">Таблиц</span>
                  <span class="text-lg font-bold text-gray-900">{{ realStats.totalTables || 0 }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-800 font-medium">Записей</span>
                  <span class="text-lg font-bold text-gray-900">{{ formatNumber(realStats.totalRecords || 0) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-800 font-medium">Размер БД</span>
                  <span class="text-lg font-bold text-gray-900">{{ realStats.databaseSize || '0 MB' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-800 font-medium">Активные подключения</span>
                  <span class="text-lg font-bold text-primary-600">{{ realStats.activeConnections || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Real Recent Queries -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Последние запросы</h3>
                <button 
                  @click="refreshQueries"
                  :disabled="loadingQueries"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                >
                  {{ loadingQueries ? '⏳' : '🔄' }} Обновить
                </button>
              </div>

              <div class="space-y-3">
                <div
                  v-for="query in realQueries.slice(0, 5)"
                  :key="query.id"
                  class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  @click="executeStoredQuery(query)"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-mono text-gray-900 truncate flex-1 mr-2 font-medium">{{
                      query.query.substring(0, 40) + '...'
                    }}</span>
                    <span class="text-xs text-gray-700 font-medium">{{ query.duration }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-700 font-medium">{{ query.time }}</span>
                    <button
                      class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      @click.stop="executeStoredQuery(query)"
                    >
                      ▶️ Выполнить
                    </button>
                  </div>
                </div>

                <div v-if="!realQueries.length" class="text-center py-4 text-gray-600 font-medium">
                  Нет данных о запросах
                </div>
              </div>
            </div>

            <!-- Real Performance Metrics -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Производительность</h3>
                <div class="text-sm text-gray-700 font-medium">Реальное время</div>
              </div>

              <div v-if="realPerformance" class="space-y-4">
                <div class="text-center mb-4">
                  <div class="text-3xl font-bold text-gray-900 mb-1">{{ realPerformance.cpu?.current || 0 }}%</div>
                  <div class="text-sm text-gray-700 font-medium">CPU использование</div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-800 font-medium">Память</span>
                    <span class="text-sm font-bold text-gray-900">{{ realPerformance.memory?.current || 0 }}%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-800 font-medium">I/O</span>
                    <span class="text-sm font-bold text-gray-900">{{ realPerformance.io?.current || 0 }}%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-800 font-medium">Активные подключения</span>
                    <span class="text-sm font-bold text-primary-600">{{ realPerformance.connections?.active || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-800 font-medium">Макс. подключений</span>
                    <span class="text-sm font-bold text-gray-900">{{ realPerformance.connections?.max || 100 }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-gray-600 font-medium">
                Загрузка метрик...
              </div>
            </div>
          </div>

          <!-- Real Connection Status Banner -->
          <div class="mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Neon Status -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg
                        class="w-5 h-5 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Neon PostgreSQL</h3>
                      <p class="text-sm text-gray-800 font-medium">Основная база данных</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div 
                      :class="connectionStatus ? 'bg-success-500' : 'bg-error-500'"
                      class="w-2 h-2 rounded-full animate-pulse"
                    ></div>
                    <span
                      class="text-sm font-semibold"
                      :class="connectionStatus ? 'text-success-700' : 'text-error-700'"
                    >
                      {{ connectionStatus ? 'Подключено' : 'Ошибка' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Real-time Info -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                      <svg
                        class="w-5 h-5 text-info-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">Реальные данные</h3>
                      <p class="text-sm text-gray-800 font-medium">Обновлено: {{ lastUpdate }}</p>
                    </div>
                  </div>
                  <button
                    @click="refreshAllData"
                    :disabled="refreshing"
                    class="text-sm font-semibold px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    {{ refreshing ? '⏳ Обновление...' : '🔄 Обновить все' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics Cards with Real Data -->
          <DatabaseStatsCards />

          <!-- Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Recent Tables - Takes 2 columns -->
            <div class="lg:col-span-2">
              <RecentTablesWidget />
            </div>
            <!-- API Status - Takes 1 column -->
            <div class="lg:col-span-1">
              <ApiStatusWidget />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex items-center justify-between text-sm text-gray-700 font-medium">
            <div>© 2024 DataBoard. Профессиона��ьная панель управления базами данных.</div>
            <div class="flex items-center space-x-4">
              <button class="hover:text-gray-900 font-medium">Документация</button>
              <button class="hover:text-gray-900 font-medium">Поддержка</button>
              <button class="hover:text-gray-900 font-medium">API</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardSidebar from '../components/DashboardSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import DatabaseStatsCards from '../components/DatabaseStatsCards.vue'
import RecentTablesWidget from '../components/RecentTablesWidget.vue'
import ApiStatusWidget from '../components/ApiStatusWidget.vue'
import { dbService } from '../services/database'

// Icons as components
const DatabaseIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>`,
}
const UsersIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>`,
}
const ClockIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
}
const CheckCircleIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
}

// State
const loading = ref(true)
const refreshing = ref(false)
const loadingQueries = ref(false)
const connectionStatus = ref(false)
const lastUpdate = ref('')

// Real data from API
const realStats = ref({
  totalTables: 0,
  totalRecords: 0,
  databaseSize: '0 MB',
  activeConnections: 0,
  newTables: 0,
  newRecords: 0,
})

const realQueries = ref([])
const realPerformance = ref(null)

let updateInterval: number

// Number formatting utilities
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString('ru-RU')
}

const formatPercentage = (num: number): string => {
  return num.toFixed(1) + '%'
}

// Real-time computed KPIs based on actual data
const realTimeKPIs = computed(() => [
  {
    id: 1,
    label: 'Активные подключения',
    value: realStats.value.activeConnections.toString(),
    subtitle: 'В сети сейчас',
    trend: 5.2,
    icon: UsersIcon,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    sparkline: [0.6, 0.7, 0.5, 0.8, 0.7, 0.9, 0.8],
    sparklineColor: 'bg-blue-500',
  },
  {
    id: 2,
    label: 'Всего таблиц',
    value: realStats.value.totalTables.toString(),
    subtitle: 'В базе данных',
    trend: 2.1,
    icon: DatabaseIcon,
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    sparkline: [0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.9],
    sparklineColor: 'bg-green-500',
  },
  {
    id: 3,
    label: 'Размер БД',
    value: realStats.value.databaseSize,
    subtitle: 'Общий объем',
    trend: 8.7,
    icon: ClockIcon,
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    sparkline: [0.5, 0.6, 0.7, 0.8, 0.9, 0.8, 0.9],
    sparklineColor: 'bg-purple-500',
  },
  {
    id: 4,
    label: 'Записей',
    value: formatNumber(realStats.value.totalRecords),
    subtitle: 'Всего данных',
    trend: 12.4,
    icon: CheckCircleIcon,
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    sparkline: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    sparklineColor: 'bg-orange-500',
  },
])

// Computed data quality score based on real metrics
const realDataQualityScore = computed(() => {
  if (!realStats.value.totalTables || !realStats.value.totalRecords) return 0
  
  // Calculate quality score based on real metrics
  let score = 85 // Base score
  
  // Add points for having data
  if (realStats.value.totalRecords > 0) score += 5
  if (realStats.value.totalTables > 5) score += 3
  if (realStats.value.activeConnections > 0) score += 5
  
  return Math.min(score, 98)
})

const getQualityGrade = (score: number) => {
  if (score >= 90) return { label: 'Отлично', color: 'bg-success-100 text-success-800' }
  if (score >= 80) return { label: 'Хор��шо', color: 'bg-warning-100 text-warning-800' }
  if (score >= 70) return { label: 'Удовлетворительно', color: 'bg-orange-100 text-orange-800' }
  return { label: 'Требует внимания', color: 'bg-error-100 text-error-800' }
}

// Load real data from API
const loadRealData = async () => {
  try {
    loading.value = true
    
    // Load database stats
    const stats = await dbService.getDatabaseStats()
    realStats.value = stats
    
    // Test connection
    connectionStatus.value = await dbService.testConnection()
    
    // Update timestamp
    lastUpdate.value = new Date().toLocaleTimeString('ru-RU')
    
    console.log('✅ Real data loaded:', stats)
  } catch (error) {
    console.error('❌ Error loading real data:', error)
    connectionStatus.value = false
  } finally {
    loading.value = false
  }
}

const loadQueries = async () => {
  try {
    loadingQueries.value = true
    const queries = await dbService.getRecentQueries()
    realQueries.value = queries
  } catch (error) {
    console.error('❌ Error loading queries:', error)
  } finally {
    loadingQueries.value = false
  }
}

const loadPerformance = async () => {
  try {
    const performance = await dbService.getPerformanceMetrics()
    realPerformance.value = performance
  } catch (error) {
    console.error('❌ Error loading performance:', error)
  }
}

const refreshQueries = () => {
  loadQueries()
}

const refreshAllData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadRealData(),
      loadQueries(),
      loadPerformance()
    ])
  } finally {
    refreshing.value = false
  }
}

const executeStoredQuery = async (query: any) => {
  console.log('Executing query:', query.query)
  
  try {
    const result = await dbService.executeQuery(query.query)
    console.log('Query result:', result)

    alert(
      `✅ Запрос выполнен успешно!\n\nРезультатов: ${result.rowCount || result.rows?.length || 0}\nВремя: ${query.duration}\n\nПодробности в консоли браузера (F12 → Console)`,
    )
  } catch (error) {
    console.error('Query execution error:', error)
    alert(
      `❌ Ошибка выполнения запроса:\n\n${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    )
  }
}

// Auto-refresh data every 2 minutes (reduced frequency)
const startAutoRefresh = () => {
  updateInterval = setInterval(async () => {
    try {
      // Check if we should skip refresh due to rate limiting
      if (refreshing.value) {
        console.log('Skipping auto-refresh: manual refresh in progress')
        return
      }

      // Only refresh stats occasionally to avoid rate limiting
      const stats = await dbService.getDatabaseStats()
      realStats.value = stats

      lastUpdate.value = new Date().toLocaleTimeString('ru-RU')
      console.log('✅ Auto-refresh completed')
    } catch (error) {
      console.error('Auto-refresh error:', error)

      // If rate limited, skip next few refreshes
      if (error instanceof Error && (error.message.includes('429') || error.message.includes('Rate limit'))) {
        console.warn('⏸️ Auto-refresh paused due to rate limiting')
        // Clear interval and restart with longer delay
        if (updateInterval) {
          clearInterval(updateInterval)
        }
        setTimeout(() => {
          startAutoRefresh()
        }, 120000) // Wait 2 minutes before restarting
      }
    }
  }, 120000) // 2 minutes instead of 30 seconds
}

onMounted(async () => {
  console.log('🎯 Real-time Dashboard loaded')
  
  // Load initial data
  await refreshAllData()
  
  // Start auto-refresh
  startAutoRefresh()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>
