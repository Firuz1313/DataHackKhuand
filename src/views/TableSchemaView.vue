<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />

    <div class="ml-64">
      <DashboardHeader />

      <main class="p-6">
        <!-- Header with breadcrumb -->
        <div class="mb-6">
          <nav class="flex mb-4" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
              <li>
                <router-link to="/tables" class="text-gray-500 hover:text-gray-700">
                  Таблицы
                </router-link>
              </li>
              <li>
                <span class="text-gray-400 mx-2">/</span>
                <router-link
                  :to="{ name: 'table-detail', params: { tableName } }"
                  class="text-gray-500 hover:text-gray-700"
                >
                  {{ tableName }}
                </router-link>
              </li>
              <li>
                <span class="text-gray-400 mx-2">/</span>
                <span class="text-gray-900 font-medium">Схема</span>
              </li>
            </ol>
          </nav>

          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Схема таблицы: {{ tableName }}</h1>
              <p class="text-gray-600">Структура и метаданные таблицы</p>
            </div>

            <div class="flex space-x-3">
              <router-link
                :to="{ name: 'table-detail', params: { tableName } }"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                📊 Данные таблицы
              </router-link>
              <button
                @click="refreshSchema"
                :disabled="loading"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {{ loading ? 'Загрузка...' : '🔄 Обновить' }}
              </button>
              <button
                @click="exportSchema"
                :disabled="!schema.columns.length"
                class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors duration-200 disabled:opacity-50"
              >
                📥 Экспорт SQL
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
          <p class="text-gray-600">Загрузка схемы таблицы...</p>
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
            <h3 class="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки схемы</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button
              @click="refreshSchema"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Schema Content -->
        <div v-else class="space-y-6">
          <!-- Table Info Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ schema.columns.length }}</div>
                  <div class="text-sm text-gray-600">Столбцов</div>
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ primaryKeyCount }}</div>
                  <div class="text-sm text-gray-600">Первичные ключи</div>
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ nullableCount }}</div>
                  <div class="text-sm text-gray-600">Nullable столбцов</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Columns Details -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Столбцы таблицы</h2>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Столбец
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Тип данных
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nullable
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      По умолчанию
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Ограничения
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="column in schema.columns"
                    :key="column.column_name"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div
                          :class="
                            isPrimaryKey(column)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          "
                          class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3"
                        >
                          {{
                            isPrimaryKey(column) ? '🔑' : column.column_name.charAt(0).toUpperCase()
                          }}
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900">
                            {{ column.column_name }}
                          </div>
                          <div v-if="isPrimaryKey(column)" class="text-xs text-yellow-600">
                            Primary Key
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ formatDataType(column) }}</div>
                      <div v-if="column.character_maximum_length" class="text-xs text-gray-500">
                        Max: {{ column.character_maximum_length }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="
                          column.is_nullable === 'YES'
                            ? 'bg-warning-100 text-warning-800'
                            : 'bg-success-100 text-success-800'
                        "
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      >
                        {{ column.is_nullable === 'YES' ? 'Да' : 'Нет' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {{ column.column_default || '-' }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-if="isPrimaryKey(column)"
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800"
                        >
                          PRIMARY KEY
                        </span>
                        <span
                          v-if="column.is_nullable === 'NO'"
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-error-100 text-error-800"
                        >
                          NOT NULL
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SQL DDL -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">DDL схемы</h2>
              <button
                @click="copyDDL"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                📋 Копировать
              </button>
            </div>

            <div class="p-6">
              <pre
                ref="ddlRef"
                class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto"
                >{{ generateDDL() }}</pre
              >
            </div>
          </div>

          <!-- Indexes and Constraints (placeholder for future implementation) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Индексы</h3>
              <div class="text-center py-8 text-gray-500">
                <svg
                  class="w-12 h-12 text-gray-300 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p class="text-sm">Информация об индексах будет добавлена в следующей версии</p>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Внешние ключи</h3>
              <div class="text-center py-8 text-gray-500">
                <svg
                  class="w-12 h-12 text-gray-300 mx-auto mb-2"
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
                <p class="text-sm">
                  Информация о внешних ключах будет добавлена в следующей версии
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService } from '@/services/database'

const route = useRoute()
const tableName = ref(route.params.tableName as string)
const ddlRef = ref<HTMLElement>()

const loading = ref(false)
const error = ref('')

interface ColumnSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
}

const schema = ref<{ tableName: string; columns: ColumnSchema[] }>({
  tableName: '',
  columns: [],
})

const primaryKeyCount = computed(() => {
  // For now, we'll assume any column with 'id' is a primary key
  // In a real implementation, this would come from the database metadata
  return schema.value.columns.filter(
    (col) => col.column_name.toLowerCase().includes('id') && col.is_nullable === 'NO',
  ).length
})

const nullableCount = computed(() => {
  return schema.value.columns.filter((col) => col.is_nullable === 'YES').length
})

const loadSchema = async () => {
  loading.value = true
  error.value = ''

  try {
    const schemaData = await dbService.getTableSchema(tableName.value)
    schema.value = schemaData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
    schema.value = { tableName: '', columns: [] }
  } finally {
    loading.value = false
  }
}

const refreshSchema = () => {
  loadSchema()
}

const isPrimaryKey = (column: ColumnSchema): boolean => {
  // Simple heuristic - in a real implementation, this would come from database metadata
  return column.column_name.toLowerCase().includes('id') && column.is_nullable === 'NO'
}

const formatDataType = (column: ColumnSchema): string => {
  let type = column.data_type.toUpperCase()

  if (column.character_maximum_length) {
    type += `(${column.character_maximum_length})`
  } else if (column.numeric_precision && column.numeric_scale !== null) {
    type += `(${column.numeric_precision},${column.numeric_scale})`
  } else if (column.numeric_precision) {
    type += `(${column.numeric_precision})`
  }

  return type
}

const generateDDL = (): string => {
  if (!schema.value.columns.length) return ''

  const columns = schema.value.columns
    .map((col) => {
      let line = `  ${col.column_name} ${formatDataType(col)}`

      if (col.is_nullable === 'NO') {
        line += ' NOT NULL'
      }

      if (col.column_default) {
        line += ` DEFAULT ${col.column_default}`
      }

      return line
    })
    .join(',\n')

  const primaryKeys = schema.value.columns
    .filter((col) => isPrimaryKey(col))
    .map((col) => col.column_name)

  let ddl = `CREATE TABLE ${tableName.value} (\n${columns}`

  if (primaryKeys.length > 0) {
    ddl += `,\n  PRIMARY KEY (${primaryKeys.join(', ')})`
  }

  ddl += '\n);'

  return ddl
}

const copyDDL = async () => {
  try {
    await navigator.clipboard.writeText(generateDDL())
    alert('✅ DDL скопирован в буфер обмена!')
  } catch (err) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = generateDDL()
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('✅ DDL скопирован в буфер обмена!')
  }
}

const exportSchema = () => {
  const schemaInfo = {
    tableName: tableName.value,
    columns: schema.value.columns,
    ddl: generateDDL(),
    exportDate: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(schemaInfo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tableName.value}-schema-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

watch(
  () => route.params.tableName,
  (newTableName) => {
    if (newTableName && newTableName !== tableName.value) {
      tableName.value = newTableName as string
      loadSchema()
    }
  },
)

onMounted(() => {
  loadSchema()
})
</script>
