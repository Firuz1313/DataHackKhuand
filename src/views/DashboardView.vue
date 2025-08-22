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
                  {{ Math.abs(kpi.trend) }}%
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
                <div class="text-2xl font-bold text-gray-900">30</div>
                <div class="text-xs text-gray-600">Всего запросов</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-success-600">27</div>
                <div class="text-xs text-gray-600">Успешных</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-error-600">0</div>
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
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-mono text-gray-800 truncate flex-1 mr-2">{{ query.sql }}</span>
                  <span class="text-xs text-gray-600">{{ query.duration }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">{{ query.timeAgo }}</span>
                  <button class="text-xs text-primary-600 hover:text-primary-700">▶️ Выполнить</button>
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Recent Tables - Takes full width -->
          <div class="lg:col-span-2">
            <RecentTablesWidget />
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
const dataQualityScore = ref(92)
const performanceScore = ref(87)

let updateInterval: number

// Executive KPIs
const executiveKPIs = ref([
  {
    id: 1,
    label: 'Активные подключения',
    value: '23',
    subtitle: 'В сети сейчас',
    trend: 12.5,
    icon: UsersIcon,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    sparkline: [0.3, 0.7, 0.4, 0.9, 0.6, 1.0, 0.8],
    sparklineColor: 'bg-blue-500',
  },
  {
    id: 2,
    label: 'Запросов в минуту',
    value: '1,247',
    subtitle: 'Средняя нагрузка',
    trend: 8.3,
    icon: DatabaseIcon,
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    sparkline: [0.5, 0.8, 0.6, 0.9, 1.0, 0.7, 0.9],
    sparklineColor: 'bg-green-500',
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
    sparklineColor: 'bg-purple-500',
  },
  {
    id: 4,
    label: 'Качество данных',
    value: '92%',
    subtitle: 'Общая оценка',
    trend: 3.2,
    icon: CheckCircleIcon,
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    sparkline: [0.85, 0.88, 0.87, 0.90, 0.92, 0.89, 0.92],
    sparklineColor: 'bg-orange-500',
  },
])

// Quality Dimensions
const qualityDimensions = ref([
  {
    name: 'Полнота данных',
    description: 'Отсутствие пропущенных значений',
    score: 96,
    icon: CheckCircleIcon,
  },
  {
    name: 'Валидность',
    description: 'Соответствие бизнес-правилам',
    score: 89,
    icon: ShieldCheckIcon,
  },
  {
    name: 'Консистентность',
    description: 'Единообразие форматов',
    score: 93,
    icon: DatabaseIcon,
  },
  {
    name: 'Актуальность',
    description: 'Свежесть данных',
    score: 85,
    icon: ClockIcon,
  },
])

// Performance Breakdown
const performanceBreakdown = ref([
  { name: 'CPU', value: 23, color: 'bg-blue-500' },
  { name: 'Память', value: 67, color: 'bg-green-500' },
  { name: 'I/O', value: 15, color: 'bg-yellow-500' },
  { name: 'Сеть', value: 34, color: 'bg-purple-500' },
])

// Time Data for chart
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

// Recent Queries
const recentQueries = ref([
  {
    id: 1,
    sql: 'SELECT * FROM information_schema.tables LIMIT 10',
    duration: '23ms',
    timeAgo: '2 мин назад',
  },
  {
    id: 2,
    sql: 'SELECT COUNT(*) FROM pg_stat_user_tables',
    duration: '45ms',
    timeAgo: '5 мин назад',
  },
  {
    id: 3,
    sql: 'SELECT table_name FROM information_schema.tables',
    duration: '12ms',
    timeAgo: '8 мин назад',
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
      `✅ Запрос выполнен успешно!\n\nРезультатов: ${result.length}\n\nПодробности в консоли браузера (F12 → Console)`,
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

const updateRealTimeData = () => {
  // Update executive KPIs
  executiveKPIs.value.forEach((kpi) => {
    const variation = (Math.random() - 0.5) * 0.1
    kpi.trend = Math.max(-50, Math.min(50, kpi.trend + variation))
  })

  // Update performance and quality scores
  performanceScore.value = Math.max(
    60,
    Math.min(100, performanceScore.value + (Math.random() - 0.5) * 5),
  )
  
  dataQualityScore.value = Math.max(
    70,
    Math.min(100, dataQualityScore.value + (Math.random() - 0.5) * 3),
  )

  // Update quality dimensions
  qualityDimensions.value.forEach((dimension) => {
    dimension.score = Math.max(70, Math.min(100, dimension.score + (Math.random() - 0.5) * 4))
  })
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
