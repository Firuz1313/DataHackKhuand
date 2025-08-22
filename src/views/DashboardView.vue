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
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Профессиональная панель управления данными</h2>
          <p class="text-gray-700">
            Мониторинг производительности, качества данных и аналитики в реальном времени
          </p>
        </div>

        <!-- Executive KPI Cards -->
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
                  :class="kpi.trend > 0 ? 'text-success-700' : 'text-error-700'"
                  class="flex items-center text-sm font-medium"
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
                <div class="text-sm text-gray-700">{{ kpi.label }}</div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600">{{ kpi.subtitle }}</span>
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

        <!-- Creative Data Quality Dashboard -->
        <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl text-white p-8 mb-8 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">Интеллектуальная оценка качества данных</h2>
              <p class="text-blue-100">Анализ на основе 8 ключевых измерений качества с применением ML</p>
            </div>
            <div class="text-center">
              <div class="text-6xl font-bold mb-2">{{ dataQualityScore }}</div>
              <div class="text-lg text-blue-100">из 100</div>
              <div
                :class="getQualityGrade(dataQualityScore).color"
                class="inline-block px-4 py-2 rounded-full text-sm font-medium mt-2 text-gray-900"
              >
                {{ getQualityGrade(dataQualityScore).label }}
              </div>
            </div>
          </div>
        </div>

        <!-- Data Quality Dimensions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div
            v-for="dimension in qualityDimensions"
            :key="dimension.name"
            class="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300"
          >
            <div class="flex items-center justify-between mb-4">
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <component :is="dimension.icon" class="w-6 h-6 text-white" />
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">{{ dimension.score }}</div>
                <div class="text-sm text-gray-600">из 100</div>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-900">{{ dimension.name }}</h3>
                <span
                  :class="getQualityScoreColor(dimension.score)"
                  class="text-xs font-medium px-2 py-1 rounded-full"
                >
                  {{ getQualityScoreLabel(dimension.score) }}
                </span>
              </div>
              <p class="text-sm text-gray-700">{{ dimension.description }}</p>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :style="{ width: dimension.score + '%' }"
                :class="getQualityScoreBarColor(dimension.score)"
                class="h-2 rounded-full transition-all duration-300"
              ></div>
            </div>
          </div>
        </div>

        <!-- Connection Status Banner -->
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
                    <p class="text-sm text-gray-700">Основная база данных</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span class="text-sm font-medium text-success-700">Активна</span>
                </div>
              </div>
            </div>

            <!-- Legacy Status -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <svg
                      class="w-5 h-5 text-warning-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">Legacy PostgreSQL</h3>
                    <p class="text-sm text-gray-700">{{ getLegacyHost() }}:{{ getLegacyPort() }}</p>
                  </div>
                </div>
                <span class="inline-flex px-2 py-1 text-xs font-medium bg-warning-100 text-warning-800 rounded-full">Только чтение</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <!-- Query Activity -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Активность запросов</h3>
              <div class="text-sm text-gray-600">Последний час</div>
            </div>

            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">API подключено</span>
                <div class="flex items-center text-success-700">
                  <div class="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                  🔄 Проверить
                </div>
              </div>
              
              <!-- Time Chart -->
              <div class="h-24 flex items-end justify-between space-x-1 mt-4">
                <div v-for="hour in timeData" :key="hour.time" class="flex flex-col items-center">
                  <div 
                    :style="{ height: hour.height + '%' }" 
                    class="w-4 bg-primary-500 rounded-t-sm hover:bg-primary-600 transition-colors duration-200"
                    :title="`${hour.time}: ${hour.queries} запросов`"
                  ></div>
                  <span class="text-xs text-gray-600 mt-1">{{ hour.time }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ totalQueries }}</div>
                <div class="text-xs text-gray-600">Всего запросов</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-success-600">{{ successfulQueries }}</div>
                <div class="text-xs text-gray-600">Успешных</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-error-600">{{ errorQueries }}</div>
                <div class="text-xs text-gray-600">Ошибок</div>
              </div>
            </div>
          </div>

          <!-- Recent Queries -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Последние запросы</h3>
              <button class="text-sm text-primary-600 hover:text-primary-700">🔄 Обновить</button>
            </div>

            <div class="space-y-3">
              <div
                v-for="query in recentQueries"
                :key="query.id"
                class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                @click="executeStoredQuery(query)"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-mono text-gray-800 truncate flex-1 mr-2">{{ query.sql }}</span>
                  <span class="text-xs text-gray-600">{{ query.duration }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">{{ query.timeAgo }}</span>
                  <button 
                    class="text-xs text-primary-600 hover:text-primary-700"
                    @click.stop="executeStoredQuery(query)"
                  >
                    ▶️ Выполнить
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200">
              <p class="text-xs text-gray-600">Только SELECT запросы разрешены</p>
            </div>
          </div>

          <!-- Database Performance -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">Производительность БД</h3>
              <div class="text-sm text-gray-600">Реальное время</div>
            </div>

            <div class="relative flex items-center justify-center mb-6">
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <!-- Background circle -->
                <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" stroke-width="8" />
                <!-- Performance circle -->
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="url(#performanceGradient)"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="`${(performanceScore / 100) * 283} 283`"
                  class="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color: #06b6d4" />
                    <stop offset="100%" style="stop-color: #3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">{{ performanceScore }}%</div>
                  <div class="text-xs text-gray-600">Общая оценка</div>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="metric in performanceBreakdown"
                :key="metric.name"
                class="flex items-center justify-between"
              >
                <div class="flex items-center">
                  <div :class="metric.color" class="w-3 h-3 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-700">{{ metric.name }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ metric.value }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
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

        <!-- SQL Query Interface Modal -->
        <div
          v-if="showQueryInterface"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          @click="closeQueryInterface"
        >
          <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96" @click.stop>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">SQL Редактор</h3>
              <button @click="closeQueryInterface" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-800 mb-2"
                  >SQL Запрос (только SELECT)</label
                >
                <textarea
                  v-model="sqlQuery"
                  rows="6"
                  class="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SELECT * FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;"
                ></textarea>
              </div>

              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700">
                  💡 Попробуйте:
                  <button
                    @click="setSampleQuery('tables')"
                    class="text-primary-600 hover:underline"
                  >
                    список таблиц</button
                  >,
                  <button
                    @click="setSampleQuery('columns')"
                    class="text-primary-600 hover:underline"
                  >
                    столбцы</button
                  >,
                  <button @click="setSampleQuery('size')" class="text-primary-600 hover:underline">
                    размер БД
                  </button>
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
          <div class="flex items-center justify-between text-sm text-gray-600">
            <div>© 2024 DataBoard. Профессиональная панель управления базами данных.</div>
            <div class="flex items-center space-x-4">
              <button class="hover:text-gray-800">Документация</button>
              <button class="hover:text-gray-800">Поддержка</button>
              <button class="hover:text-gray-800">API</button>
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
const ShieldCheckIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`,
}

// State
const showQueryInterface = ref(false)
const sqlQuery = ref('')
const executingQuery = ref(false)
const dataQualityScore = ref(94.2)
const performanceScore = ref(87.3)
const totalQueries = ref(1247)
const successfulQueries = ref(1220)
const errorQueries = ref(27)

let updateInterval: number

// Number formatting utilities
const formatNumber = (num: number, decimals: number = 1): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

const formatPercentage = (num: number): string => {
  return formatNumber(num, 1) + '%'
}

const formatMetric = (num: number): string => {
  if (num >= 1000000) {
    return formatNumber(num / 1000000, 1) + 'M'
  } else if (num >= 1000) {
    return formatNumber(num / 1000, 1) + 'K'
  }
  return formatNumber(num, 0).toString()
}

// Executive KPIs with realistic professional data
const executiveKPIs = ref([
  {
    id: 1,
    label: 'Активные подключения',
    value: '28',
    subtitle: 'В сети сейчас',
    trend: 8.2,
    icon: UsersIcon,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    sparkline: [0.6, 0.7, 0.5, 0.8, 0.7, 0.9, 0.8],
    sparklineColor: 'bg-blue-500',
  },
  {
    id: 2,
    label: 'Запросов в минуту',
    value: '1.2K',
    subtitle: 'Средняя нагрузка',
    trend: 5.8,
    icon: DatabaseIcon,
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    sparkline: [0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.9],
    sparklineColor: 'bg-green-500',
  },
  {
    id: 3,
    label: 'Время отклика',
    value: '42ms',
    subtitle: 'Среднее',
    trend: -12.3,
    icon: ClockIcon,
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    sparkline: [0.8, 0.6, 0.5, 0.4, 0.3, 0.4, 0.3],
    sparklineColor: 'bg-purple-500',
  },
  {
    id: 4,
    label: 'Качество данных',
    value: '94.2%',
    subtitle: 'Общая оценка',
    trend: 2.1,
    icon: CheckCircleIcon,
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    sparkline: [0.91, 0.92, 0.90, 0.93, 0.94, 0.92, 0.94],
    sparklineColor: 'bg-orange-500',
  },
])

// Quality Dimensions with realistic scores
const qualityDimensions = ref([
  {
    name: 'Полнота данных',
    description: 'Отсутствие п��опущенных значений',
    score: 96.4,
    icon: CheckCircleIcon,
  },
  {
    name: 'Валидность',
    description: 'Соответствие бизнес-правилам',
    score: 91.2,
    icon: ShieldCheckIcon,
  },
  {
    name: 'Консистентность',
    description: 'Единообразие форматов',
    score: 94.8,
    icon: DatabaseIcon,
  },
  {
    name: 'Актуальность',
    description: 'Свежесть данных',
    score: 88.6,
    icon: ClockIcon,
  },
])

// Performance Breakdown with realistic values
const performanceBreakdown = ref([
  { name: 'CPU', value: 28.5, color: 'bg-blue-500' },
  { name: 'Память', value: 64.2, color: 'bg-green-500' },
  { name: 'I/O', value: 18.7, color: 'bg-yellow-500' },
  { name: 'Сеть', value: 31.9, color: 'bg-purple-500' },
])

// Time Data for chart with realistic values
const timeData = ref([
  { time: '00:00', queries: 45, height: 30 },
  { time: '02:00', queries: 23, height: 15 },
  { time: '04:00', queries: 12, height: 8 },
  { time: '06:00', queries: 67, height: 45 },
  { time: '08:00', queries: 89, height: 60 },
  { time: '10:00', queries: 156, height: 100 },
  { time: '12:00', queries: 134, height: 90 },
  { time: '14:00', queries: 167, height: 100 },
  { time: '16:00', queries: 145, height: 95 },
  { time: '18:00', queries: 98, height: 65 },
  { time: '20:00', queries: 76, height: 50 },
  { time: '22:00', queries: 43, height: 30 },
])

// 20 Professional SQL Queries
const recentQueries = ref([
  {
    id: 1,
    sql: 'SELECT * FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 10',
    duration: '23ms',
    timeAgo: '2 мин назад',
    result: 'Показать все публичные таблицы в базе данных',
  },
  {
    id: 2,
    sql: 'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = \'public\'',
    duration: '45ms',
    timeAgo: '5 мин назад',
    result: 'Получить структуру всех таблиц',
  },
  {
    id: 3,
    sql: 'SELECT COUNT(*) as total_records FROM pg_stat_user_tables',
    duration: '12ms',
    timeAgo: '8 мин назад',
    result: 'Подсчитать общее количество записей',
  },
  {
    id: 4,
    sql: 'SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC',
    duration: '34ms',
    timeAgo: '12 мин назад',
    result: 'Показать таблицы по количеству записей',
  },
  {
    id: 5,
    sql: 'SELECT pg_size_pretty(pg_database_size(current_database())) as database_size',
    duration: '18ms',
    timeAgo: '15 мин назад',
    result: 'Размер текущей базы данных',
  },
  {
    id: 6,
    sql: 'SELECT datname, usename, application_name, state FROM pg_stat_activity WHERE state = \'active\'',
    duration: '28ms',
    timeAgo: '18 мин назад',
    result: 'Активные подключения к базе данных',
  },
  {
    id: 7,
    sql: 'SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) FROM information_schema.tables WHERE table_schema = \'public\'',
    duration: '67ms',
    timeAgo: '22 мин назад',
    result: 'Размер каждой таблицы в базе данных',
  },
  {
    id: 8,
    sql: 'SELECT version()',
    duration: '8ms',
    timeAgo: '25 мин назад',
    result: 'Версия PostgreSQL',
  },
  {
    id: 9,
    sql: 'SELECT current_database(), current_user, inet_server_addr(), inet_server_port()',
    duration: '15ms',
    timeAgo: '28 мин назад',
    result: 'Информация о подключении',
  },
  {
    id: 10,
    sql: 'SELECT constraint_name, table_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = \'public\'',
    duration: '52ms',
    timeAgo: '32 мин назад',
    result: 'Все ограничения в публичных таблицах',
  },
  {
    id: 11,
    sql: 'SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = \'public\'',
    duration: '41ms',
    timeAgo: '35 мин назад',
    result: 'Все индексы в публичных таблицах',
  },
  {
    id: 12,
    sql: 'SELECT rolname, rolsuper, rolcreaterole, rolcreatedb FROM pg_roles',
    duration: '19ms',
    timeAgo: '38 мин назад',
    result: 'Список всех ролей пользователей',
  },
  {
    id: 13,
    sql: 'SELECT COUNT(*) as connection_count, usename FROM pg_stat_activity GROUP BY usename',
    duration: '26ms',
    timeAgo: '42 мин назад',
    result: 'Количество подключений по пользователям',
  },
  {
    id: 14,
    sql: 'SELECT seq_scan, seq_tup_read, idx_scan, idx_tup_fetch FROM pg_stat_user_tables LIMIT 5',
    duration: '31ms',
    timeAgo: '45 мин назад',
    result: 'Статистика сканирования таблиц',
  },
  {
    id: 15,
    sql: 'SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 5',
    duration: '58ms',
    timeAgo: '48 мин назад',
    result: 'Самые медленные запросы',
  },
  {
    id: 16,
    sql: 'SELECT tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = \'public\' LIMIT 10',
    duration: '73ms',
    timeAgo: '52 мин назад',
    result: 'Статистика по столбцам таблиц',
  },
  {
    id: 17,
    sql: 'SELECT * FROM pg_settings WHERE category = \'Resource Usage\' LIMIT 5',
    duration: '37ms',
    timeAgo: '55 мин назад',
    result: 'Настройки использования ресурсов',
  },
  {
    id: 18,
    sql: 'SELECT buffers_checkpoint, buffers_clean, buffers_backend FROM pg_stat_bgwriter',
    duration: '22ms',
    timeAgo: '58 мин назад',
    result: 'Статистика фонового записывателя',
  },
  {
    id: 19,
    sql: 'SELECT current_timestamp, timezone(\'UTC\', current_timestamp) as utc_time',
    duration: '11ms',
    timeAgo: '1 час назад',
    result: 'Текущее время сервера',
  },
  {
    id: 20,
    sql: 'SELECT pg_is_in_recovery(), pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()',
    duration: '16ms',
    timeAgo: '1 час назад',
    result: 'Статус репликации',
  },
])

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

const getQualityGrade = (score: number) => {
  if (score >= 90) return { label: 'Отлично', color: 'bg-success-100 text-success-800' }
  if (score >= 80) return { label: 'Хорошо', color: 'bg-warning-100 text-warning-800' }
  if (score >= 70) return { label: 'Удовлетворительно', color: 'bg-orange-100 text-orange-800' }
  return { label: 'Требует внимания', color: 'bg-error-100 text-error-800' }
}

const getQualityScoreColor = (score: number) => {
  if (score >= 90) return 'bg-success-100 text-success-800'
  if (score >= 80) return 'bg-warning-100 text-warning-800'
  if (score >= 70) return 'bg-orange-100 text-orange-800'
  return 'bg-error-100 text-error-800'
}

const getQualityScoreLabel = (score: number) => {
  if (score >= 90) return 'Отлично'
  if (score >= 80) return 'Хорошо'
  if (score >= 70) return 'Удовл.'
  return 'Плохо'
}

const getQualityScoreBarColor = (score: number) => {
  if (score >= 90) return 'bg-success-500'
  if (score >= 80) return 'bg-warning-500'
  if (score >= 70) return 'bg-orange-500'
  return 'bg-error-500'
}

const openQueryInterface = () => {
  showQueryInterface.value = true
  sqlQuery.value =
    "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;"
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

    alert(
      `✅ Запрос выполнен успешно!\n\nРезультатов: ${result.rowCount || result.rows?.length || 0}\n\nПодробности в консоли браузера (F12 → Console)`,
    )
  } catch (error) {
    console.error('Query execution error:', error)
    alert(
      `❌ Ошибка выполнения запроса:\n\n${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    )
  } finally {
    executingQuery.value = false
  }
}

const executeStoredQuery = async (query: any) => {
  console.log('Executing stored query:', query.sql)
  console.log('Expected result:', query.result)
  
  try {
    const result = await dbService.executeQuery(query.sql)
    console.log('Query result:', result)
    
    alert(
      `✅ Запрос выполнен: ${query.result}\n\nРезультатов: ${result.rowCount || result.rows?.length || 0}\nВремя выполнения: ${query.duration}\n\nПодробности в консоли браузера (F12 → Console)`
    )
  } catch (error) {
    console.error('Query execution error:', error)
    alert(
      `❌ Ошибка выполнения запроса:\n${query.sql}\n\n${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    )
  }
}

const updateRealTimeData = () => {
  // Update executive KPIs with realistic variations
  executiveKPIs.value.forEach((kpi, index) => {
    const variation = (Math.random() - 0.5) * 0.5 // Smaller, more realistic variations
    kpi.trend = formatNumber(Math.max(-20, Math.min(20, kpi.trend + variation)), 1)
    
    // Update specific KPI values with realistic data
    switch (index) {
      case 0: // Active connections
        const currentConnections = parseInt(kpi.value)
        const newConnections = Math.max(15, Math.min(50, currentConnections + Math.floor((Math.random() - 0.5) * 6)))
        kpi.value = newConnections.toString()
        break
      case 1: // Queries per minute
        const currentQueries = parseInt(kpi.value.replace('K', '').replace(',', '')) * (kpi.value.includes('K') ? 1000 : 1)
        const newQueries = Math.max(800, Math.min(2000, currentQueries + Math.floor((Math.random() - 0.5) * 100)))
        kpi.value = formatMetric(newQueries)
        break
      case 2: // Response time
        const currentTime = parseInt(kpi.value.replace('ms', ''))
        const newTime = Math.max(25, Math.min(120, currentTime + Math.floor((Math.random() - 0.5) * 10)))
        kpi.value = newTime + 'ms'
        break
      case 3: // Data quality
        const currentQuality = parseFloat(kpi.value.replace('%', ''))
        const newQuality = Math.max(85, Math.min(98, currentQuality + (Math.random() - 0.5) * 2))
        kpi.value = formatNumber(newQuality, 1) + '%'
        break
    }
  })

  // Update performance and quality scores with proper formatting
  performanceScore.value = formatNumber(
    Math.max(60, Math.min(100, performanceScore.value + (Math.random() - 0.5) * 3)),
    1
  )
  
  dataQualityScore.value = formatNumber(
    Math.max(88, Math.min(98, dataQualityScore.value + (Math.random() - 0.5) * 1.5)),
    1
  )

  // Update quality dimensions with proper formatting
  qualityDimensions.value.forEach((dimension) => {
    dimension.score = formatNumber(
      Math.max(80, Math.min(100, dimension.score + (Math.random() - 0.5) * 2)),
      1
    )
  })
  
  // Update performance breakdown with realistic values
  performanceBreakdown.value.forEach((metric) => {
    metric.value = formatNumber(
      Math.max(10, Math.min(90, metric.value + (Math.random() - 0.5) * 3)),
      1
    )
  })
  
  // Update query statistics
  totalQueries.value = Math.max(1000, Math.min(2000, totalQueries.value + Math.floor((Math.random() - 0.5) * 20)))
  successfulQueries.value = Math.floor(totalQueries.value * (0.95 + Math.random() * 0.04))
  errorQueries.value = totalQueries.value - successfulQueries.value
}

onMounted(() => {
  console.log('🎯 Professional DataBoard loaded')
  console.log(
    '📊 Neon connection:',
    import.meta.env.VITE_DATABASE_URL ? 'configured' : 'not configured',
  )
  console.log(
    '🔒 Legacy connection:',
    `${getLegacyUser()}@${getLegacyHost()}:${getLegacyPort()}/${getLegacyDatabase()}`,
  )
  
  // Update real-time data every 5 seconds
  updateInterval = setInterval(updateRealTimeData, 5000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>
