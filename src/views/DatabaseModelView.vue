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
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Модель данных</h1>
              <p class="text-gray-600">Схема базы данных и связи между таблицами</p>
            </div>

            <div class="flex space-x-3">
              <button
                @click="refreshDataModel"
                :disabled="loading"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {{ loading ? 'Загрузка...' : '🔄 Обновить' }}
              </button>
              <button
                @click="exportDataModel"
                :disabled="!dataModel.tables.length"
                class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors duration-200 disabled:opacity-50"
              >
                📥 Экспорт JSON
              </button>
              <button
                @click="toggleView"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                {{ viewMode === 'diagram' ? '📋 Список таблиц' : '🗺️ Диаграмма' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"
          ></div>
          <p class="text-gray-600">Загрузка модели данных...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white rounded-lg shadow-card border border-gray-200 p-8">
          <div class="text-center">
            <svg
              class="w-16 h-16 text-error-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки модели данных</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button
              @click="refreshDataModel"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Data Model Content -->
        <div v-else class="space-y-6">
          <!-- Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ dataModel.tables.length }}</div>
                  <div class="text-sm text-gray-600">Таблиц</div>
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ dataModel.relationships.length }}</div>
                  <div class="text-sm text-gray-600">Связей</div>
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
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ totalColumns }}</div>
                  <div class="text-sm text-gray-600">Столбцов</div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center">
                <div
                  class="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mr-4"
                >
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ connectedTables }}</div>
                  <div class="text-sm text-gray-600">Связанных таблиц</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Diagram View -->
          <div v-if="viewMode === 'diagram'" class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Диаграмма связей</h2>
              <p class="text-sm text-gray-600 mt-1">Визуальное представление структуры базы данных</p>
            </div>

            <div class="relative p-6 bg-gray-50 min-h-96 overflow-auto">
              <svg
                ref="diagramSvg"
                class="w-full h-full min-h-96"
                :viewBox="`0 0 ${diagramWidth} ${diagramHeight}`"
              >
                <!-- Relationships (lines) -->
                <g>
                  <line
                    v-for="relationship in dataModel.relationships"
                    :key="relationship.id"
                    :x1="getTablePosition(relationship.sourceTable).x + 150"
                    :y1="getTablePosition(relationship.sourceTable).y + 40"
                    :x2="getTablePosition(relationship.targetTable).x + 150"
                    :y2="getTablePosition(relationship.targetTable).y + 40"
                    stroke="#6b7280"
                    stroke-width="2"
                    marker-end="url(#arrowhead)"
                  />
                </g>

                <!-- Arrow marker definition -->
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                </defs>

                <!-- Tables -->
                <g>
                  <g
                    v-for="table in dataModel.tables"
                    :key="table.name"
                    class="cursor-pointer"
                    @click="selectTable(table.name)"
                  >
                    <!-- Table box -->
                    <rect
                      :x="table.position.x"
                      :y="table.position.y"
                      width="300"
                      :height="Math.max(80, table.columns.length * 20 + 60)"
                      :fill="selectedTable === table.name ? '#dbeafe' : '#ffffff'"
                      :stroke="selectedTable === table.name ? '#3b82f6' : '#d1d5db'"
                      stroke-width="2"
                      rx="8"
                    />

                    <!-- Table name header -->
                    <rect
                      :x="table.position.x"
                      :y="table.position.y"
                      width="300"
                      height="40"
                      :fill="selectedTable === table.name ? '#3b82f6' : '#f3f4f6'"
                      :stroke="selectedTable === table.name ? '#3b82f6' : '#d1d5db'"
                      stroke-width="2"
                      rx="8"
                    />
                    <rect
                      :x="table.position.x"
                      :y="table.position.y + 32"
                      width="300"
                      height="8"
                      :fill="selectedTable === table.name ? '#3b82f6' : '#f3f4f6'"
                    />

                    <!-- Table name text -->
                    <text
                      :x="table.position.x + 150"
                      :y="table.position.y + 25"
                      text-anchor="middle"
                      :fill="selectedTable === table.name ? '#ffffff' : '#1f2937'"
                      font-weight="bold"
                      font-size="14"
                    >
                      {{ table.name }}
                    </text>

                    <!-- Columns -->
                    <g>
                      <text
                        v-for="(column, index) in table.columns.slice(0, 8)"
                        :key="column.column_name"
                        :x="table.position.x + 10"
                        :y="table.position.y + 60 + index * 20"
                        font-size="12"
                        :fill="column.is_primary_key ? '#dc2626' : '#4b5563'"
                        :font-weight="column.is_primary_key ? 'bold' : 'normal'"
                      >
                        {{ column.is_primary_key ? '🔑' : '' }} {{ column.column_name }} ({{ column.data_type }})
                      </text>
                      <text
                        v-if="table.columns.length > 8"
                        :x="table.position.x + 10"
                        :y="table.position.y + 60 + 8 * 20"
                        font-size="12"
                        fill="#9ca3af"
                        font-style="italic"
                      >
                        ... и еще {{ table.columns.length - 8 }} столбцов
                      </text>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>

          <!-- List View -->
          <div v-else class="space-y-6">
            <!-- Tables List -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Таблицы и связи</h2>
              </div>

              <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div
                    v-for="table in dataModel.tables"
                    :key="table.name"
                    class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="font-semibold text-gray-900">{{ table.name }}</h3>
                      <div class="flex space-x-2">
                        <router-link
                          :to="{ name: 'table-detail', params: { tableName: table.name } }"
                          class="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                        >
                          Данные
                        </router-link>
                        <router-link
                          :to="{ name: 'table-schema', params: { tableName: table.name } }"
                          class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          Схема
                        </router-link>
                      </div>
                    </div>

                    <div class="text-sm text-gray-600 mb-3">
                      <div class="flex items-center justify-between">
                        <span>{{ table.columns.length }} столбцов</span>
                        <span>{{ getTableRelationships(table.name).length }} связей</span>
                      </div>
                    </div>

                    <!-- Primary Key Columns -->
                    <div class="mb-3">
                      <h4 class="text-xs font-medium text-gray-700 mb-1">Первичные ключи:</h4>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="column in table.columns.filter(c => c.is_primary_key)"
                          :key="column.column_name"
                          class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                        >
                          🔑 {{ column.column_name }}
                        </span>
                        <span v-if="!table.columns.some(c => c.is_primary_key)" class="text-xs text-gray-500">
                          Нет первичных ключей
                        </span>
                      </div>
                    </div>

                    <!-- Relationships -->
                    <div v-if="getTableRelationships(table.name).length">
                      <h4 class="text-xs font-medium text-gray-700 mb-1">Связи:</h4>
                      <div class="space-y-1">
                        <div
                          v-for="rel in getTableRelationships(table.name).slice(0, 3)"
                          :key="rel.id"
                          class="text-xs text-gray-600"
                        >
                          <span v-if="rel.sourceTable === table.name" class="text-blue-600">
                            → {{ rel.targetTable }}.{{ rel.targetColumn }}
                          </span>
                          <span v-else class="text-green-600">
                            ← {{ rel.sourceTable }}.{{ rel.sourceColumn }}
                          </span>
                        </div>
                        <div
                          v-if="getTableRelationships(table.name).length > 3"
                          class="text-xs text-gray-500 italic"
                        >
                          ... и еще {{ getTableRelationships(table.name).length - 3 }} связей
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Relationships Details -->
            <div v-if="dataModel.relationships.length" class="bg-white rounded-lg shadow-card border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Детали связей</h2>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ограничение
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Исходная таблица
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Целевая таблица
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Правила
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="relationship in dataModel.relationships" :key="relationship.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ relationship.constraintName }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <div class="font-medium">{{ relationship.sourceTable }}</div>
                          <div class="text-xs text-gray-500">{{ relationship.sourceColumn }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <div class="font-medium">{{ relationship.targetTable }}</div>
                          <div class="text-xs text-gray-500">{{ relationship.targetColumn }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div class="space-y-1">
                          <div class="flex items-center space-x-2">
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              UPDATE: {{ relationship.updateRule }}
                            </span>
                          </div>
                          <div class="flex items-center space-x-2">
                            <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              DELETE: {{ relationship.deleteRule }}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService } from '@/services/database'

const loading = ref(false)
const error = ref('')
const viewMode = ref<'diagram' | 'list'>('diagram')
const selectedTable = ref<string>('')
const diagramSvg = ref<SVGElement>()

const dataModel = ref<{
  tables: Array<{
    name: string
    schema: string
    comment: string | null
    columns: Array<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
      is_primary_key: boolean
    }>
    position: { x: number; y: number }
  }>
  relationships: Array<{
    id: string
    sourceTable: string
    sourceColumn: string
    targetTable: string
    targetColumn: string
    constraintName: string
    updateRule: string
    deleteRule: string
    type: string
  }>
}>({
  tables: [],
  relationships: [],
})

const totalColumns = computed(() => {
  return dataModel.value.tables.reduce((sum, table) => sum + table.columns.length, 0)
})

const connectedTables = computed(() => {
  const connectedSet = new Set<string>()
  dataModel.value.relationships.forEach((rel) => {
    connectedSet.add(rel.sourceTable)
    connectedSet.add(rel.targetTable)
  })
  return connectedSet.size
})

const diagramWidth = computed(() => {
  if (!dataModel.value.tables.length) return 800
  const maxX = Math.max(...dataModel.value.tables.map((t) => t.position.x))
  return Math.max(800, maxX + 350)
})

const diagramHeight = computed(() => {
  if (!dataModel.value.tables.length) return 600
  const maxY = Math.max(...dataModel.value.tables.map((t) => t.position.y))
  return Math.max(600, maxY + 250)
})

const loadDataModel = async () => {
  loading.value = true
  error.value = ''

  try {
    const model = await dbService.getDatabaseDataModel()
    dataModel.value = model
    console.log('✅ Модель данных загружена:', model)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
    dataModel.value = { tables: [], relationships: [] }
  } finally {
    loading.value = false
  }
}

const refreshDataModel = () => {
  loadDataModel()
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'diagram' ? 'list' : 'diagram'
}

const selectTable = (tableName: string) => {
  selectedTable.value = selectedTable.value === tableName ? '' : tableName
}

const getTablePosition = (tableName: string) => {
  const table = dataModel.value.tables.find((t) => t.name === tableName)
  return table ? table.position : { x: 0, y: 0 }
}

const getTableRelationships = (tableName: string) => {
  return dataModel.value.relationships.filter(
    (rel) => rel.sourceTable === tableName || rel.targetTable === tableName,
  )
}

const exportDataModel = () => {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalTables: dataModel.value.tables.length,
      totalRelationships: dataModel.value.relationships.length,
    },
    dataModel: dataModel.value,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `database-model-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadDataModel()
})
</script>
