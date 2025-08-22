<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />

    <div class="ml-64">
      <DashboardHeader />

      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Оценка качества данных</h1>
          <p class="text-gray-600">
            Комплексный анализ качества, целостности и надежности ваших данных
          </p>
        </div>

        <!-- Overall Quality Score -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white p-8 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">Общая оценка качества данных</h2>
              <p class="text-blue-100">Основана на 7 ключевых измерениях качества</p>
            </div>
            <div class="text-center">
              <div class="text-6xl font-bold mb-2">{{ overallScore }}</div>
              <div class="text-lg">из 100</div>
              <div
                :class="getScoreGrade(overallScore).color"
                class="inline-block px-4 py-2 rounded-full text-sm font-medium mt-2"
              >
                {{ getScoreGrade(overallScore).label }}
              </div>
            </div>
          </div>
        </div>

        <!-- Quality Dimensions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div
            v-for="dimension in qualityDimensions"
            :key="dimension.name"
            class="bg-white rounded-lg shadow-card border border-gray-200 p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center"
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
                  :class="getScoreColor(dimension.score)"
                  class="text-xs font-medium px-2 py-1 rounded-full"
                >
                  {{ getScoreLabel(dimension.score) }}
                </span>
              </div>
              <p class="text-sm text-gray-600">{{ dimension.description }}</p>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :style="{ width: dimension.score + '%' }"
                :class="getScoreBarColor(dimension.score)"
                class="h-2 rounded-full transition-all duration-300"
              ></div>
            </div>
          </div>
        </div>

        <!-- Detailed Quality Report -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Data Completeness -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Полнота данных</h2>
            </div>

            <div class="p-6">
              <div class="space-y-4">
                <div
                  v-for="table in completenessData"
                  :key="table.name"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div class="font-medium text-gray-900">{{ table.name }}</div>
                    <div class="text-sm text-gray-600">
                      {{ table.totalRecords.toLocaleString() }} записей
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="flex items-center">
                      <div class="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          :style="{ width: table.completeness + '%' }"
                          :class="getScoreBarColor(table.completeness)"
                          class="h-2 rounded-full"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-gray-900"
                        >{{ table.completeness }}%</span
                      >
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ table.missingCount }} пропущенных
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Validity -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Валидность данных</h2>
            </div>

            <div class="p-6">
              <div class="space-y-4">
                <div
                  v-for="validation in validationResults"
                  :key="validation.rule"
                  class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div class="flex items-center">
                    <div
                      :class="
                        validation.passed
                          ? 'bg-success-100 text-success-600'
                          : 'bg-error-100 text-error-600'
                      "
                      class="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    >
                      <svg
                        v-if="validation.passed"
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">{{ validation.rule }}</div>
                      <div class="text-sm text-gray-600">{{ validation.description }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      :class="validation.passed ? 'text-success-600' : 'text-error-600'"
                      class="font-medium"
                    >
                      {{ validation.passed ? 'Пройдено' : 'Ошибка' }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ validation.affectedRecords }} записей
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quality Trends -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Тренды качества данных</h2>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-7 gap-4 mb-6">
              <div v-for="(trend, index) in qualityTrends" :key="index" class="text-center">
                <div class="text-xs text-gray-500 mb-2">{{ trend.date }}</div>
                <div class="relative h-32 bg-gray-100 rounded-lg flex items-end justify-center p-1">
                  <div
                    :style="{ height: trend.score + '%' }"
                    :class="getScoreBarColor(trend.score)"
                    class="w-6 rounded-t transition-all duration-300 flex items-end justify-center"
                  >
                    <span class="text-xs text-white font-medium mb-1">{{ trend.score }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-success-600">↗ +5.2%</div>
                <div class="text-sm text-gray-600">Улучшение за неделю</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary-600">94.2%</div>
                <div class="text-sm text-gray-600">Средний показатель</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-warning-600">12</div>
                <div class="text-sm text-gray-600">Активных проблем</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Items -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Рекомендации по улучшению</h2>
          </div>

          <div class="p-6">
            <div class="space-y-4">
              <div
                v-for="action in actionItems"
                :key="action.id"
                class="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div
                  :class="getPriorityColor(action.priority)"
                  class="w-3 h-3 rounded-full mt-2 mr-4 flex-shrink-0"
                ></div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">{{ action.title }}</h3>
                    <span
                      :class="getPriorityBadgeColor(action.priority)"
                      class="text-xs font-medium px-2 py-1 rounded-full"
                    >
                      {{ action.priority }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{{ action.description }}</p>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center text-xs text-gray-500">
                      <svg
                        class="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Ожидаемое время: {{ action.estimatedTime }}
                    </div>
                    <div class="flex items-center text-xs text-gray-500">
                      <svg
                        class="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      Улучшение: +{{ action.expectedImprovement }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'

// Icons as components
const CheckCircleIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
}
const ShieldCheckIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`,
}
const DatabaseIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>`,
}
const ClockIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
}

// State
const overallScore = ref(87)

const qualityDimensions = ref([
  {
    name: 'Полнота',
    description: 'Отсутствие пропущенных значений',
    score: 92,
    icon: CheckCircleIcon,
  },
  {
    name: 'Валидность',
    description: 'Соответствие бизнес-правилам',
    score: 85,
    icon: ShieldCheckIcon,
  },
  {
    name: 'Согласованность',
    description: '��динообразие форматов данных',
    score: 89,
    icon: DatabaseIcon,
  },
  {
    name: 'Актуальность',
    description: 'Свежесть и релевантность данных',
    score: 78,
    icon: ClockIcon,
  },
])

const completenessData = ref([
  {
    name: 'users',
    totalRecords: 15420,
    completeness: 94,
    missingCount: 925,
  },
  {
    name: 'orders',
    totalRecords: 8634,
    completeness: 89,
    missingCount: 950,
  },
  {
    name: 'products',
    totalRecords: 2341,
    completeness: 96,
    missingCount: 94,
  },
  {
    name: 'transactions',
    totalRecords: 45123,
    completeness: 91,
    missingCount: 4061,
  },
])

const validationResults = ref([
  {
    rule: 'Email Format Validation',
    description: 'Проверка корректности email адресов',
    passed: true,
    affectedRecords: 0,
  },
  {
    rule: 'Date Range Validation',
    description: 'Даты находятся в допустимом диапазоне',
    passed: false,
    affectedRecords: 23,
  },
  {
    rule: 'Foreign Key Integrity',
    description: 'Целостность внешних ключей',
    passed: true,
    affectedRecords: 0,
  },
  {
    rule: 'Business Rules Check',
    description: 'Соответствие бизнес-логике',
    passed: false,
    affectedRecords: 156,
  },
])

const qualityTrends = ref([
  { date: '16.08', score: 82 },
  { date: '17.08', score: 85 },
  { date: '18.08', score: 83 },
  { date: '19.08', score: 87 },
  { date: '20.08', score: 89 },
  { date: '21.08', score: 86 },
  { date: '22.08', score: 87 },
])

const actionItems = ref([
  {
    id: 1,
    title: 'Исправить валидацию дат в таблице events',
    description: 'Обнаружены некорректные значения дат будущего времени',
    priority: 'high',
    estimatedTime: '2 часа',
    expectedImprovement: 3,
  },
  {
    id: 2,
    title: 'Добавить constraint для email полей',
    description: 'Улучшить валидацию email адресов на уровне БД',
    priority: 'medium',
    estimatedTime: '1 день',
    expectedImprovement: 5,
  },
  {
    id: 3,
    title: 'Очистить дублированные записи в users',
    description: 'Найдено 234 полностью дублированных пользователя',
    priority: 'low',
    estimatedTime: '4 часа',
    expectedImprovement: 2,
  },
])

// Methods
const getScoreGrade = (score: number) => {
  if (score >= 90) return { label: 'Отлично', color: 'bg-success-100 text-success-800' }
  if (score >= 80) return { label: 'Хорошо', color: 'bg-warning-100 text-warning-800' }
  if (score >= 70) return { label: 'Удовлетворительно', color: 'bg-orange-100 text-orange-800' }
  return { label: 'Требует внимания', color: 'bg-error-100 text-error-800' }
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'bg-success-100 text-success-800'
  if (score >= 80) return 'bg-warning-100 text-warning-800'
  if (score >= 70) return 'bg-orange-100 text-orange-800'
  return 'bg-error-100 text-error-800'
}

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Отлично'
  if (score >= 80) return 'Хорошо'
  if (score >= 70) return 'Удовл.'
  return 'Плохо'
}

const getScoreBarColor = (score: number) => {
  if (score >= 90) return 'bg-success-500'
  if (score >= 80) return 'bg-warning-500'
  if (score >= 70) return 'bg-orange-500'
  return 'bg-error-500'
}

const getPriorityColor = (priority: string) => {
  const colors = {
    high: 'bg-error-500',
    medium: 'bg-warning-500',
    low: 'bg-success-500',
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-500'
}

const getPriorityBadgeColor = (priority: string) => {
  const colors = {
    high: 'bg-error-100 text-error-800',
    medium: 'bg-warning-100 text-warning-800',
    low: 'bg-success-100 text-success-800',
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  // Simulate loading data quality metrics
  console.log('🔍 Анализ качества данных загружен')
})
</script>
