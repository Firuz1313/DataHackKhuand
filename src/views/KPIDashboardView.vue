<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />
    
    <div class="ml-64">
      <DashboardHeader />
      
      <main class="p-6">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">KPI Дашборд</h1>
              <p class="text-gray-600">Ключевые показатели эффективности и бизнес-метрики в реальном времени</p>
            </div>
            <div class="flex items-center space-x-4">
              <select 
                v-model="selectedTimeframe"
                @change="updateMetrics"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="today">Сегодня</option>
                <option value="week">Эта неделя</option>
                <option value="month">Этот месяц</option>
                <option value="quarter">Квартал</option>
              </select>
              <button
                @click="refreshData"
                :disabled="loading"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {{ loading ? 'Обновление...' : '🔄 Обновить' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div 
            v-for="kpi in executiveKPIs" 
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
                  :class="kpi.trend > 0 ? 'text-success-600' : 'text-error-600'"
                  class="flex items-center text-sm font-medium"
                >
                  <svg 
                    :class="kpi.trend > 0 ? 'rotate-0' : 'rotate-180'"
                    class="w-4 h-4 mr-1 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V8m0 9h-9" />
                  </svg>
                  {{ Math.abs(kpi.trend) }}%
                </div>
              </div>
              
              <div class="mb-2">
                <div class="text-3xl font-bold text-gray-900 mb-1">{{ kpi.value }}</div>
                <div class="text-sm text-gray-600">{{ kpi.label }}</div>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">{{ kpi.subtitle }}</span>
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

        <!-- Main KPI Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <!-- Database Performance Ring Chart -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Производит��льность БД</h3>
              <div class="text-sm text-gray-500">Реальное время</div>
            </div>
            
            <div class="relative flex items-center justify-center">
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <!-- Background circle -->
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="8"
                />
                <!-- Performance circle -->
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="url(#performanceGradient)"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="`${(performanceMetrics.overall / 100) * 283} 283`"
                  class="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#06b6d4" />
                    <stop offset="100%" style="stop-color:#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">{{ performanceMetrics.overall }}%</div>
                  <div class="text-xs text-gray-500">Общая оценка</div>
                </div>
              </div>
            </div>
            
            <div class="mt-6 space-y-3">
              <div v-for="metric in performanceBreakdown" :key="metric.name" class="flex items-center justify-between">
                <div class="flex items-center">
                  <div 
                    :class="metric.color"
                    class="w-3 h-3 rounded-full mr-2"
                  ></div>
                  <span class="text-sm text-gray-600">{{ metric.name }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ metric.value }}%</span>
              </div>
            </div>
          </div>

          <!-- Query Activity Heatmap -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Активность запросов</h3>
              <div class="text-sm text-gray-500">24 часа</div>
            </div>
            
            <div class="grid grid-cols-12 gap-1 mb-4">
              <div 
                v-for="(hour, index) in queryHeatmap" 
                :key="index"
                :title="`${index}:00 - ${hour.queries} запросов`"
                :class="getHeatmapColor(hour.intensity)"
                class="aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-110 cursor-pointer"
              >
                {{ index < 10 ? '0' + index : index }}
              </div>
            </div>
            
            <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>Меньше</span>
              <div class="flex space-x-1">
                <div class="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div class="w-3 h-3 bg-blue-200 rounded-sm"></div>
                <div class="w-3 h-3 bg-blue-400 rounded-sm"></div>
                <div class="w-3 h-3 bg-blue-600 rounded-sm"></div>
                <div class="w-3 h-3 bg-blue-800 rounded-sm"></div>
              </div>
              <span>Больше</span>
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Пиковая нагрузка:</span>
                <span class="font-medium">14:00 ({{ Math.max(...queryHeatmap.map(h => h.queries)) }} запросов)</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Средняя нагрузка:</span>
                <span class="font-medium">{{ Math.round(queryHeatmap.reduce((sum, h) => sum + h.queries, 0) / 24) }} запросов/час</span>
              </div>
            </div>
          </div>

          <!-- Real-time Connections -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Подключения</h3>
              <div class="flex items-center text-sm text-success-600">
                <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse mr-2"></div>
                Live
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="text-center">
                <div class="text-4xl font-bold text-primary-600 mb-2">{{ connectionStats.active }}</div>
                <div class="text-sm text-gray-600">Активных подключений</div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-lg font-semibold text-gray-900">{{ connectionStats.idle }}</div>
                  <div class="text-xs text-gray-600">Ожидающих</div>
                </div>
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-lg font-semibold text-gray-900">{{ connectionStats.max }}</div>
                  <div class="text-xs text-gray-600">Максимум</div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600">Использование пула</span>
                  <span class="font-medium">{{ Math.round((connectionStats.active / connectionStats.max) * 100) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    :style="{ width: (connectionStats.active / connectionStats.max) * 100 + '%' }"
                    class="bg-gradient-to-r from-primary-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Metrics Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Transaction Throughput -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Пропускная способность</h3>
              <select 
                v-model="throughputPeriod"
                class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="hour">Час</option>
                <option value="day">День</option>
                <option value="week">Неделя</option>
              </select>
            </div>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-success-600">{{ throughputMetrics.transactions }}</div>
                <div class="text-sm text-gray-600">Транзакций/сек</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary-600">{{ throughputMetrics.queries }}</div>
                <div class="text-sm text-gray-600">Запросов/мин</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-warning-600">{{ throughputMetrics.avgLatency }}</div>
                <div class="text-sm text-gray-600">мс среднее</div>
              </div>
            </div>
            
            <!-- Throughput Chart -->
            <div class="h-32">
              <div class="flex items-end justify-between h-full space-x-1">
                <div 
                  v-for="(bar, index) in throughputChart" 
                  :key="index"
                  :style="{ height: bar.height + '%' }"
                  :title="`${bar.time}: ${bar.value} TPS`"
                  class="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm hover:from-primary-700 hover:to-primary-500 transition-colors duration-200 cursor-pointer"
                ></div>
              </div>
            </div>
          </div>

          <!-- Resource Utilization -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Использование ресурсов</h3>
              <div class="text-sm text-gray-500">Текущее состояние</div>
            </div>
            
            <div class="space-y-6">
              <div v-for="resource in resourceMetrics" :key="resource.name">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center">
                    <component :is="resource.icon" class="w-4 h-4 text-gray-500 mr-2" />
                    <span class="text-sm font-medium text-gray-900">{{ resource.name }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">{{ resource.current }}{{ resource.unit }}</span>
                    <span 
                      :class="getResourceStatus(resource.current, resource.threshold).color"
                      class="text-xs font-medium px-2 py-1 rounded-full"
                    >
                      {{ getResourceStatus(resource.current, resource.threshold).label }}
                    </span>
                  </div>
                </div>
                
                <div class="relative">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      :style="{ width: resource.current + '%' }"
                      :class="getResourceBarColor(resource.current, resource.threshold)"
                      class="h-2 rounded-full transition-all duration-1000 relative"
                    >
                      <div class="absolute inset-0 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <!-- Threshold indicator -->
                  <div 
                    :style="{ left: resource.threshold + '%' }"
                    class="absolute top-0 bottom-0 w-px bg-red-400 transform -translate-x-px"
                  >
                    <div class="absolute -top-1 -left-1 w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                </div>
                
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>Порог: {{ resource.threshold }}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alert Summary -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Состояние системы и алерты</h3>
            <div class="flex items-center space-x-4">
              <div class="flex items-center text-sm text-success-600">
                <div class="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                Система стабильна
              </div>
              <button class="text-sm text-primary-600 hover:text-primary-700">Все алерты →</button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-success-50 rounded-lg border border-success-200">
              <div class="text-2xl font-bold text-success-600 mb-1">{{ alertStats.resolved }}</div>
              <div class="text-sm text-success-700">Решенные алерты</div>
              <div class="text-xs text-success-600 mt-1">За последние 24ч</div>
            </div>
            
            <div class="text-center p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div class="text-2xl font-bold text-warning-600 mb-1">{{ alertStats.pending }}</div>
              <div class="text-sm text-warning-700">Ожидающие внимания</div>
              <div class="text-xs text-warning-600 mt-1">Требуют действий</div>
            </div>
            
            <div class="text-center p-4 bg-error-50 rounded-lg border border-error-200">
              <div class="text-2xl font-bold text-error-600 mb-1">{{ alertStats.critical }}</div>
              <div class="text-sm text-error-700">Критические</div>
              <div class="text-xs text-error-600 mt-1">Немедленно</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'

// Icons as components
const DatabaseIcon = { 
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>` 
}
const UsersIcon = { 
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>` 
}
const ClockIcon = { 
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` 
}
const CpuChipIcon = { 
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` 
}

// State
const loading = ref(false)
const selectedTimeframe = ref('today')
const throughputPeriod = ref('hour')

let updateInterval: number

// Executive KPIs
const executiveKPIs = ref([
  {
    id: 1,
    label: 'Активные пользователи',
    value: '2,847',
    subtitle: 'В сети сейчас',
    trend: 12.5,
    icon: UsersIcon,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    sparkline: [0.3, 0.7, 0.4, 0.9, 0.6, 1.0, 0.8],
    sparklineColor: 'bg-blue-500'
  },
  {
    id: 2,
    label: 'Запросов в секунду',
    value: '1,247',
    subtitle: 'Пиковая нагрузка',
    trend: 8.3,
    icon: DatabaseIcon,
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    sparkline: [0.5, 0.8, 0.6, 0.9, 1.0, 0.7, 0.9],
    sparklineColor: 'bg-green-500'
  },
  {
    id: 3,
    label: 'Время отклика',
    value: '47ms',
    subtitle: 'Среднее',
    trend: -15.2,
    icon: ClockIcon,
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    sparkline: [1.0, 0.8, 0.6, 0.4, 0.3, 0.2, 0.3],
    sparklineColor: 'bg-purple-500'
  },
  {
    id: 4,
    label: 'Доступность',
    value: '99.98%',
    subtitle: 'Uptime',
    trend: 0.02,
    icon: CpuChipIcon,
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    sparkline: [0.99, 1.0, 0.98, 1.0, 1.0, 0.99, 1.0],
    sparklineColor: 'bg-orange-500'
  }
])

// Performance Metrics
const performanceMetrics = reactive({
  overall: 87
})

const performanceBreakdown = ref([
  { name: 'CPU', value: 23, color: 'bg-blue-500' },
  { name: 'Память', value: 67, color: 'bg-green-500' },
  { name: 'I/O', value: 15, color: 'bg-yellow-500' },
  { name: 'Сеть', value: 34, color: 'bg-purple-500' }
])

// Query Heatmap
const queryHeatmap = ref(
  Array.from({ length: 24 }, (_, i) => ({
    queries: Math.floor(Math.random() * 1000) + 100,
    intensity: Math.random()
  }))
)

// Connection Stats
const connectionStats = reactive({
  active: 23,
  idle: 7,
  max: 100
})

// Throughput Metrics
const throughputMetrics = reactive({
  transactions: 247,
  queries: 1340,
  avgLatency: 47
})

const throughputChart = ref(
  Array.from({ length: 12 }, (_, i) => ({
    height: Math.random() * 100,
    value: Math.floor(Math.random() * 500) + 100,
    time: `${i * 2}:00`
  }))
)

// Resource Metrics
const resourceMetrics = ref([
  {
    name: 'CPU Загрузка',
    current: 23,
    threshold: 80,
    unit: '%',
    icon: CpuChipIcon
  },
  {
    name: 'Использование памяти',
    current: 67,
    threshold: 85,
    unit: '%',
    icon: DatabaseIcon
  },
  {
    name: 'Дисковое пространство',
    current: 42,
    threshold: 90,
    unit: '%',
    icon: DatabaseIcon
  }
])

// Alert Stats
const alertStats = reactive({
  resolved: 24,
  pending: 3,
  critical: 0
})

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    updateRealTimeData()
  } finally {
    loading.value = false
  }
}

const updateMetrics = () => {
  // Update metrics based on selected timeframe
  updateRealTimeData()
}

const updateRealTimeData = () => {
  // Update executive KPIs
  executiveKPIs.value.forEach(kpi => {
    const variation = (Math.random() - 0.5) * 0.1
    kpi.trend = Math.max(-50, Math.min(50, kpi.trend + variation))
  })

  // Update performance metrics
  performanceMetrics.overall = Math.max(60, Math.min(100, performanceMetrics.overall + (Math.random() - 0.5) * 5))
  
  // Update connections
  connectionStats.active = Math.max(1, Math.min(connectionStats.max, connectionStats.active + Math.floor((Math.random() - 0.5) * 5)))
  connectionStats.idle = Math.max(0, connectionStats.max - connectionStats.active - Math.floor(Math.random() * 10))

  // Update throughput
  throughputMetrics.transactions = Math.max(100, throughputMetrics.transactions + Math.floor((Math.random() - 0.5) * 50))
  throughputMetrics.queries = Math.max(500, throughputMetrics.queries + Math.floor((Math.random() - 0.5) * 200))
  throughputMetrics.avgLatency = Math.max(20, Math.min(200, throughputMetrics.avgLatency + Math.floor((Math.random() - 0.5) * 10)))

  // Update resource metrics
  resourceMetrics.value.forEach(resource => {
    resource.current = Math.max(0, Math.min(100, resource.current + (Math.random() - 0.5) * 5))
  })
}

const getHeatmapColor = (intensity: number) => {
  if (intensity < 0.2) return 'bg-gray-100 text-gray-600'
  if (intensity < 0.4) return 'bg-blue-200 text-blue-800'
  if (intensity < 0.6) return 'bg-blue-400 text-white'
  if (intensity < 0.8) return 'bg-blue-600 text-white'
  return 'bg-blue-800 text-white'
}

const getResourceStatus = (current: number, threshold: number) => {
  if (current >= threshold) return { label: 'Критично', color: 'bg-error-100 text-error-800' }
  if (current >= threshold * 0.8) return { label: 'Предупреждение', color: 'bg-warning-100 text-warning-800' }
  return { label: 'Норма', color: 'bg-success-100 text-success-800' }
}

const getResourceBarColor = (current: number, threshold: number) => {
  if (current >= threshold) return 'bg-gradient-to-r from-error-500 to-error-600'
  if (current >= threshold * 0.8) return 'bg-gradient-to-r from-warning-500 to-warning-600'
  return 'bg-gradient-to-r from-success-500 to-success-600'
}

// Lifecycle
onMounted(() => {
  updateRealTimeData()
  // Update every 5 seconds
  updateInterval = setInterval(updateRealTimeData, 5000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>
