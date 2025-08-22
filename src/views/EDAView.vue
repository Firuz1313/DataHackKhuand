<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />

    <div class="ml-64">
      <DashboardHeader />

      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            EDA - Исследовательский анализ данных
          </h1>
          <p class="text-gray-600">
            Профессиональный анализ структуры, качества и паттернов в ваших данных
          </p>
        </div>

        <!-- Data Discovery Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center">
              <div
                class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4"
              >
                <svg
                  class="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ edaMetrics.totalColumns }}</div>
                <div class="text-sm text-gray-600">Столбцов проанализировано</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center">
              <div
                class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mr-4"
              >
                <svg
                  class="w-6 h-6 text-success-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ edaMetrics.dataQualityScore }}%
                </div>
                <div class="text-sm text-gray-600">Оценка качества данных</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center">
              <div
                class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mr-4"
              >
                <svg
                  class="w-6 h-6 text-warning-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ edaMetrics.anomalies }}</div>
                <div class="text-sm text-gray-600">Аномалий найдено</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  class="w-6 h-6 text-info-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ edaMetrics.correlations }}</div>
                <div class="text-sm text-gray-600">Сильных корреляций</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Selection for Analysis -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Выбор таблицы для анализа</h2>
            <button
              @click="refreshTables"
              :disabled="loadingTables"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
            >
              {{ loadingTables ? 'Загрузка...' : '🔄 Обновить' }}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="table in tables"
              :key="table.id"
              @click="selectTableForAnalysis(table.name)"
              :class="
                selectedTable === table.name
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:bg-gray-50'
              "
              class="p-4 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium text-gray-900">{{ table.name }}</div>
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >{{ table.records }} записей</span
                >
              </div>
              <div class="text-sm text-gray-600">{{ table.schema }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ table.lastUpdate }}</div>
            </div>
          </div>
        </div>

        <!-- Data Profiling Results -->
        <div v-if="selectedTable && profileData" class="space-y-6">
          <!-- Column Analysis -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">
                Профилирование столбцов: {{ selectedTable }}
              </h2>
            </div>

            <div class="p-6">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Столбец
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Тип
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Null %
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Уникальные
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Качество
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Распределение
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr
                      v-for="column in profileData.columns"
                      :key="column.name"
                      class="hover:bg-gray-50"
                    >
                      <td class="px-4 py-3">
                        <div class="font-medium text-gray-900">{{ column.name }}</div>
                        <div class="text-sm text-gray-500">{{ column.description }}</div>
                      </td>
                      <td class="px-4 py-3">
                        <span
                          :class="getTypeColor(column.type)"
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        >
                          {{ column.type }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center">
                          <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              :style="{ width: column.nullPercent + '%' }"
                              :class="
                                column.nullPercent > 50
                                  ? 'bg-error-500'
                                  : column.nullPercent > 20
                                    ? 'bg-warning-500'
                                    : 'bg-success-500'
                              "
                              class="h-2 rounded-full"
                            ></div>
                          </div>
                          <span class="text-sm text-gray-600">{{ column.nullPercent }}%</span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-sm text-gray-900">
                          {{ column.uniqueValues.toLocaleString() }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ column.uniquePercent }}% уникальных
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center">
                          <div
                            :class="getQualityColor(column.qualityScore)"
                            class="w-3 h-3 rounded-full mr-2"
                          ></div>
                          <span class="text-sm font-medium">{{ column.qualityScore }}/100</span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex space-x-1">
                          <div
                            v-for="(bar, i) in column.distribution"
                            :key="i"
                            :style="{ height: bar * 20 + 'px' }"
                            class="w-1 bg-primary-400 rounded-sm"
                          ></div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Data Quality Issues -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Проблемы качества данных</h2>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="issue in dataQualityIssues"
                  :key="issue.id"
                  class="p-4 border border-gray-200 rounded-lg"
                >
                  <div class="flex items-center mb-2">
                    <div
                      :class="getSeverityColor(issue.severity)"
                      class="w-3 h-3 rounded-full mr-2"
                    ></div>
                    <div class="font-medium text-gray-900">{{ issue.title }}</div>
                  </div>
                  <div class="text-sm text-gray-600 mb-3">{{ issue.description }}</div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500"
                      >{{ issue.affectedRows }} строк затронуто</span
                    >
                    <span :class="getSeverityTextColor(issue.severity)" class="text-xs font-medium">
                      {{ issue.severity }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Automated Insights -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Автоматические инсайты</h2>
            </div>

            <div class="p-6">
              <div class="space-y-4">
                <div
                  v-for="insight in autoInsights"
                  :key="insight.id"
                  class="flex items-start p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                >
                  <div
                    class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-4"
                  >
                    <svg
                      class="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-gray-900 mb-1">{{ insight.title }}</div>
                    <div class="text-sm text-gray-600 mb-2">{{ insight.description }}</div>
                    <div class="flex items-center">
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                        {{ insight.category }}
                      </span>
                      <span class="text-xs text-gray-500"
                        >Confidence: {{ insight.confidence }}%</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistical Summary -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Статистическое резюме</h2>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-4">
                  <h3 class="font-medium text-gray-900">Описательная статистика</h3>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Общее количество строк:</span>
                      <span class="text-sm font-medium">{{
                        profileData.totalRows.toLocaleString()
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Количество столбцов:</span>
                      <span class="text-sm font-medium">{{ profileData.totalColumns }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Память таблицы:</span>
                      <span class="text-sm font-medium">{{ profileData.memoryUsage }}</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <h3 class="font-medium text-gray-900">Типы данных</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(count, type) in profileData.dataTypes"
                      :key="type"
                      class="flex justify-between"
                    >
                      <span class="text-sm text-gray-600">{{ type }}:</span>
                      <span class="text-sm font-medium">{{ count }}</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <h3 class="font-medium text-gray-900">Рекомендации</h3>
                  <div class="space-y-2">
                    <div
                      v-for="recommendation in profileData.recommendations"
                      :key="recommendation"
                      class="text-sm text-gray-600 flex items-start"
                    >
                      <span class="text-green-500 mr-2">•</span>
                      {{ recommendation }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center">
          <svg
            class="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Выберите таблицу для анализа</h3>
          <p class="text-gray-600 mb-4">
            Выберите таблицу выше, чтобы начать исследовательский анализ данных
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService, type TableInfo } from '@/services/database'

// State
const loadingTables = ref(false)
const selectedTable = ref('')
const tables = ref<TableInfo[]>([])

// EDA Metrics
const edaMetrics = reactive({
  totalColumns: 0,
  dataQualityScore: 0,
  anomalies: 0,
  correlations: 0,
})

// Profile Data
const profileData = ref<{
  totalRows: number
  totalColumns: number
  memoryUsage: string
  dataTypes: Record<string, number>
  recommendations: string[]
  columns: Array<{
    name: string
    description: string
    type: string
    nullPercent: number
    uniqueValues: number
    uniquePercent: number
    qualityScore: number
    distribution: number[]
  }>
} | null>(null)

// Data Quality Issues
const dataQualityIssues = ref([
  {
    id: 1,
    title: 'Высокий процент NULL значений',
    description: 'Столбец user_email содержит 45% пустых значений',
    severity: 'high',
    affectedRows: 4523,
  },
  {
    id: 2,
    title: 'Дублированные записи',
    description: 'Найдено 234 полностью дублированных строки',
    severity: 'medium',
    affectedRows: 234,
  },
  {
    id: 3,
    title: 'Некорректный формат даты',
    description: 'В столбце created_at найдены некорректные значения дат',
    severity: 'low',
    affectedRows: 12,
  },
])

// Auto Insights
const autoInsights = ref([
  {
    id: 1,
    title: 'Сезонная тенденция в данных',
    description:
      'Обнаружена сильная сезонная составляющая в активности пользователей с пиком в декабре',
    category: 'Temporal Pattern',
    confidence: 89,
  },
  {
    id: 2,
    title: 'Корреляция между возрастом и доходом',
    description:
      'Сильная положительная корреляция (r=0.74) между возрастом пользователей и их доходом',
    category: 'Correlation',
    confidence: 74,
  },
  {
    id: 3,
    title: 'Аномальные выбросы в транзакциях',
    description: 'Обнаружено 15 транзакций со значительно отличающимися суммами (>3σ от среднего)',
    category: 'Outlier Detection',
    confidence: 95,
  },
])

// Methods
const refreshTables = async () => {
  loadingTables.value = true
  try {
    tables.value = await dbService.getTables()
  } catch (error) {
    console.error('Failed to load tables:', error)
  } finally {
    loadingTables.value = false
  }
}

const selectTableForAnalysis = async (tableName: string) => {
  selectedTable.value = tableName
  await performEDA(tableName)
}

const performEDA = async (tableName: string) => {
  // Simulate EDA analysis
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Update EDA metrics
  edaMetrics.totalColumns = Math.floor(Math.random() * 20) + 5
  edaMetrics.dataQualityScore = Math.floor(Math.random() * 30) + 70
  edaMetrics.anomalies = Math.floor(Math.random() * 10) + 1
  edaMetrics.correlations = Math.floor(Math.random() * 5) + 2

  // Generate mock profile data
  profileData.value = {
    totalRows: Math.floor(Math.random() * 100000) + 10000,
    totalColumns: edaMetrics.totalColumns,
    memoryUsage: `${(Math.random() * 50 + 10).toFixed(1)} MB`,
    dataTypes: {
      VARCHAR: Math.floor(edaMetrics.totalColumns * 0.4),
      INTEGER: Math.floor(edaMetrics.totalColumns * 0.3),
      TIMESTAMP: Math.floor(edaMetrics.totalColumns * 0.2),
      BOOLEAN: Math.floor(edaMetrics.totalColumns * 0.1),
    },
    recommendations: [
      'Добавить индекс на столбец user_id для улучшения производительности',
      'Рассмотреть нормализацию столбца address',
      'Очистить NULL значения в critical полях',
      'Применить data validation для email столбцов',
    ],
    columns: generateMockColumns(edaMetrics.totalColumns),
  }
}

const generateMockColumns = (count: number) => {
  const columns = []
  const types = ['VARCHAR', 'INTEGER', 'TIMESTAMP', 'BOOLEAN', 'DECIMAL']
  const names = [
    'id',
    'user_id',
    'email',
    'name',
    'created_at',
    'updated_at',
    'status',
    'amount',
    'description',
    'category',
  ]

  for (let i = 0; i < count; i++) {
    columns.push({
      name: names[i % names.length] + (i > names.length - 1 ? `_${i}` : ''),
      description: `Описание столбца ${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      nullPercent: Math.floor(Math.random() * 60),
      uniqueValues: Math.floor(Math.random() * 10000) + 100,
      uniquePercent: Math.floor(Math.random() * 100),
      qualityScore: Math.floor(Math.random() * 40) + 60,
      distribution: Array.from({ length: 10 }, () => Math.random()),
    })
  }

  return columns
}

const getTypeColor = (type: string) => {
  const colors = {
    VARCHAR: 'bg-blue-100 text-blue-800',
    INTEGER: 'bg-green-100 text-green-800',
    TIMESTAMP: 'bg-purple-100 text-purple-800',
    BOOLEAN: 'bg-yellow-100 text-yellow-800',
    DECIMAL: 'bg-red-100 text-red-800',
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getQualityColor = (score: number) => {
  if (score >= 80) return 'bg-success-500'
  if (score >= 60) return 'bg-warning-500'
  return 'bg-error-500'
}

const getSeverityColor = (severity: string) => {
  const colors = {
    high: 'bg-error-500',
    medium: 'bg-warning-500',
    low: 'bg-success-500',
  }
  return colors[severity as keyof typeof colors] || 'bg-gray-500'
}

const getSeverityTextColor = (severity: string) => {
  const colors = {
    high: 'text-error-600',
    medium: 'text-warning-600',
    low: 'text-success-600',
  }
  return colors[severity as keyof typeof colors] || 'text-gray-600'
}

// Lifecycle
onMounted(() => {
  refreshTables()
})
</script>
