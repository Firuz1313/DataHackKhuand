<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />

    <div class="ml-64">
      <DashboardHeader />

      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">SQL Запросы</h1>
          <p class="text-gray-600">Выполнение и мониторинг SQL запросов с профессиональными примерами</p>
        </div>

        <!-- Query Editor Section -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Редактор запросов</h2>
            <div class="flex space-x-2">
              <button
                @click="clearQuery"
                class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Очистить
              </button>
              <button
                @click="executeQuery"
                :disabled="!currentQuery.trim() || executing"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ executing ? 'Выполнение...' : '▶️ Выполнить' }}
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <textarea
                v-model="currentQuery"
                placeholder="SELECT * FROM your_table LIMIT 10;"
                class="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              ></textarea>
            </div>

            <div class="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <strong>ℹ️ Ограничения безопасности:</strong> Разрешены только SELECT запросы для
              чтения данных
            </div>
          </div>
        </div>

        <!-- Query Results Section -->
        <div
          v-if="queryResults || queryError"
          class="query-results bg-white rounded-lg shadow-card border border-gray-200 mb-6"
        >
          <!-- Success Results -->
          <div v-if="queryResults && !queryError" class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Результаты запроса</h2>
              <div class="text-sm text-gray-600">
                {{ queryResults.rowCount }} строк за {{ queryResults.executionTime }}ms
              </div>
            </div>

            <div class="overflow-x-auto">
              <table v-if="queryResults.rows.length > 0" class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      v-for="(key, index) in Object.keys(queryResults.rows[0])"
                      :key="index"
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                    >
                      {{ key }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="(row, index) in queryResults.rows.slice(0, 100)"
                    :key="index"
                    class="hover:bg-gray-50"
                  >
                    <td
                      v-for="(value, key) in row"
                      :key="key"
                      class="px-4 py-2 whitespace-nowrap text-gray-900 border-b border-gray-100"
                    >
                      {{ formatValue(value) }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="text-center py-8 text-gray-500">
                Запрос выполнен успешно, но результатов не найдено
              </div>
            </div>

            <div
              v-if="queryResults.rows.length > 100"
              class="mt-4 text-sm text-gray-600 text-center"
            >
              Показано первые 100 строк из {{ queryResults.rowCount }}
            </div>
          </div>

          <!-- Error Results -->
          <div v-if="queryError" class="p-6">
            <h2 class="text-lg font-semibold text-red-700 mb-4">Ошибка выполнения запроса</h2>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre class="text-red-700 text-sm whitespace-pre-wrap">{{ queryError }}</pre>
            </div>
          </div>
        </div>

        <!-- Professional Queries Collection -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Профессиональные запросы</h2>
            <div class="text-sm text-gray-600">{{ professionalQueries.length }} готовых запросов</div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="query in professionalQueries"
              :key="query.id"
              class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 cursor-pointer group"
              @click="loadProfessionalQuery(query)"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 mb-1">{{ query.title }}</h3>
                  <p class="text-sm text-gray-600 mb-2">{{ query.description }}</p>
                  <div class="flex items-center space-x-3 text-xs text-gray-500">
                    <span class="flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                      </svg>
                      {{ query.category }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                      </svg>
                      {{ query.difficulty }}
                    </span>
                  </div>
                </div>
                <button 
                  class="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200"
                  @click.stop="executeProfessionalQuery(query)"
                >
                  ▶️ Выполнить
                </button>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <code class="text-xs text-gray-700 font-mono leading-relaxed">{{ query.preview }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Queries Section -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">История запросов</h2>
            <button
              @click="refreshHistory"
              :disabled="loadingHistory"
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
            >
              {{ loadingHistory ? 'Загрузка...' : '🔄 Обновить' }}
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="query in recentQueries"
              :key="query.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <span
                    :class="query.status === 'success' ? 'bg-success-500' : 'bg-error-500'"
                    class="w-2 h-2 rounded-full mr-2"
                  ></span>
                  <span class="text-sm font-medium text-gray-900">{{ query.duration }}</span>
                  <span class="text-xs text-gray-500 ml-2">{{ query.time }}</span>
                </div>
                <code class="text-sm text-gray-700 bg-white px-2 py-1 rounded border">
                  {{ query.query }}
                </code>
              </div>
              <button
                @click="loadQuery(query.query)"
                class="ml-4 px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200"
              >
                Загрузить
              </button>
            </div>
          </div>

          <div v-if="recentQueries.length === 0" class="text-center py-8 text-gray-500">
            История запросов пуста
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService, type QueryResult, type QueryActivity } from '@/services/database'

interface ProfessionalQuery {
  id: number
  title: string
  description: string
  category: string
  difficulty: 'Легкий' | 'Средний' | 'Сложный'
  preview: string
  sql: string
  expectedResult: string
}

const currentQuery = ref('')
const executing = ref(false)
const loadingHistory = ref(false)
const queryResults = ref<QueryResult | null>(null)
const queryError = ref<string | null>(null)
const recentQueries = ref<QueryActivity[]>([])

// Professional SQL Queries Collection (20 queries)
const professionalQueries: ProfessionalQuery[] = [
  {
    id: 1,
    title: 'Список всех таблиц',
    description: 'Получить информацию о всех таблицах в публичной схеме',
    category: 'Мета-данные',
    difficulty: 'Легкий',
    preview: 'SELECT table_name, table_type FROM information_schema.tables...',
    sql: `SELECT 
  table_name, 
  table_type,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;`,
    expectedResult: 'Показать все публичные таблицы с их типами'
  },
  {
    id: 2,
    title: 'Структура таблиц',
    description: 'Подробная информация о столбцах всех таблиц',
    category: 'Схема БД',
    difficulty: 'Средний',
    preview: 'SELECT table_name, column_name, data_type, is_nullable...',
    sql: `SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;`,
    expectedResult: 'Структура всех столбцов в публичных таблицах'
  },
  {
    id: 3,
    title: 'Размер базы данных',
    description: 'Получить размер текущей базы данных в читаемом формате',
    category: 'Мониторинг',
    difficulty: 'Легкий',
    preview: 'SELECT pg_size_pretty(pg_database_size(current_database()))...',
    sql: `SELECT 
  current_database() as database_name,
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_database_size(current_database()) as size_bytes;`,
    expectedResult: 'Размер текущей базы данных'
  },
  {
    id: 4,
    title: 'Активные подключения',
    description: 'Мониторинг текущих активных подключений к базе данных',
    category: 'Мониторинг',
    difficulty: 'Средний',
    preview: 'SELECT datname, usename, application_name, state...',
    sql: `SELECT 
  datname,
  usename,
  application_name,
  state,
  query_start,
  state_change
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY query_start DESC;`,
    expectedResult: 'Список активных подключений с деталями'
  },
  {
    id: 5,
    title: 'Размеры таблиц',
    description: 'Размер каждой таблицы в базе данных',
    category: 'Мониторинг',
    difficulty: 'Средний',
    preview: 'SELECT table_name, pg_size_pretty(pg_total_relation_size(...))...',
    sql: `SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;`,
    expectedResult: 'Размеры всех таблиц в порядке убывания'
  },
  {
    id: 6,
    title: 'Статистика таблиц',
    description: 'Статистика использования таблиц и их производительность',
    category: 'Производительность',
    difficulty: 'Сложный',
    preview: 'SELECT schemaname, tablename, n_live_tup, seq_scan...',
    sql: `SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;`,
    expectedResult: 'Детальная статистика по всем пользовательским таблицам'
  },
  {
    id: 7,
    title: 'Информация о системе',
    description: 'Версия PostgreSQL и основная системная информация',
    category: 'Система',
    difficulty: 'Легкий',
    preview: 'SELECT version(), current_database(), current_user...',
    sql: `SELECT 
  version(),
  current_database(),
  current_user,
  session_user,
  inet_server_addr(),
  inet_server_port(),
  current_timestamp;`,
    expectedResult: 'Полная информация о системе и подключении'
  },
  {
    id: 8,
    title: 'Индексы таблиц',
    description: 'Список всех индексов в публичных таблицах',
    category: 'Схема БД',
    difficulty: 'Средний',
    preview: 'SELECT indexname, tablename, indexdef FROM pg_indexes...',
    sql: `SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;`,
    expectedResult: 'Все индексы с их определениями'
  },
  {
    id: 9,
    title: 'Ограничения таблиц',
    description: 'Все ограничения (constraints) в публичных таблицах',
    category: 'Схема БД',
    difficulty: 'Средний',
    preview: 'SELECT constraint_name, table_name, constraint_type...',
    sql: `SELECT 
  constraint_name,
  table_name,
  constraint_type,
  is_deferrable,
  initially_deferred
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
ORDER BY table_name, constraint_type;`,
    expectedResult: 'Все ограничения целостности данных'
  },
  {
    id: 10,
    title: 'Роли пользователей',
    description: 'Список всех ролей и их привилегий',
    category: 'Безопасность',
    difficulty: 'Средний',
    preview: 'SELECT rolname, rolsuper, rolcreaterole, rolcreatedb...',
    sql: `SELECT 
  rolname,
  rolsuper,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolconnlimit,
  rolvaliduntil
FROM pg_roles
ORDER BY rolname;`,
    expectedResult: 'Все роли пользователей с их правами'
  },
  {
    id: 11,
    title: 'Статистика запросов',
    description: 'Самые часто выполняемые запросы (требует pg_stat_statements)',
    category: 'Производительность',
    difficulty: 'Сложный',
    preview: 'SELECT query, calls, total_exec_time, mean_exec_time...',
    sql: `SELECT 
  substr(query, 1, 100) as query_preview,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 10;`,
    expectedResult: 'Топ-10 самых часто выполняемых запросов'
  },
  {
    id: 12,
    title: 'Медленные запросы',
    description: 'Запросы с самым большим временем выполнения',
    category: 'Производительность',
    difficulty: 'Сложный',
    preview: 'SELECT query, total_exec_time, calls, mean_exec_time...',
    sql: `SELECT 
  substr(query, 1, 100) as query_preview,
  total_exec_time,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;`,
    expectedResult: 'Топ-10 самых медленных запросов по среднему времени'
  },
  {
    id: 13,
    title: 'Статистика подключений',
    description: 'Количество подключений по пользователям и базам данных',
    category: 'Мониторинг',
    difficulty: 'Средний',
    preview: 'SELECT datname, usename, COUNT(*) FROM pg_stat_activity...',
    sql: `SELECT 
  datname,
  usename,
  application_name,
  COUNT(*) as connection_count,
  string_agg(DISTINCT state, ', ') as states
FROM pg_stat_activity 
GROUP BY datname, usename, application_name
ORDER BY connection_count DESC;`,
    expectedResult: 'Группировка подключений по пользователям и приложениям'
  },
  {
    id: 14,
    title: 'Настройки сервера',
    description: 'Важные конфигурационные параметры сервера',
    category: 'Конфигурация',
    difficulty: 'Средний',
    preview: 'SELECT name, setting, unit, category FROM pg_settings...',
    sql: `SELECT 
  name,
  setting,
  unit,
  category,
  short_desc
FROM pg_settings 
WHERE category IN ('Resource Usage', 'Connections and Authentication', 'Query Tuning')
ORDER BY category, name;`,
    expectedResult: 'Ключевые настройки производительности и подключений'
  },
  {
    id: 15,
    title: 'Блокировки',
    description: 'Текущие блокировки в базе данных',
    category: 'Мониторинг',
    difficulty: 'Сложный',
    preview: 'SELECT locktype, database, relation, mode, granted...',
    sql: `SELECT 
  locktype,
  database,
  relation::regclass,
  page,
  tuple,
  virtualxid,
  transactionid,
  mode,
  granted
FROM pg_locks 
WHERE NOT granted
ORDER BY database, relation;`,
    expectedResult: 'Все неразрешенные блокировки в системе'
  },
  {
    id: 16,
    title: 'Статистика I/O',
    description: 'Статистика чтения и записи для таблиц',
    category: 'Производительность',
    difficulty: 'Сложный',
    preview: 'SELECT schemaname, tablename, heap_blks_read, heap_blks_hit...',
    sql: `SELECT 
  schemaname,
  tablename,
  heap_blks_read,
  heap_blks_hit,
  CASE WHEN heap_blks_hit + heap_blks_read > 0 
    THEN ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    ELSE 0 
  END as cache_hit_ratio
FROM pg_statio_user_tables
ORDER BY heap_blks_read DESC;`,
    expectedResult: 'Статистика кэша и дисковых операций для таблиц'
  },
  {
    id: 17,
    title: 'Автовакуум статистика',
    description: 'Информация о последних операциях VACUUM и ANALYZE',
    category: 'Обслуживание',
    difficulty: 'Средний',
    preview: 'SELECT schemaname, tablename, last_vacuum, last_autovacuum...',
    sql: `SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count,
  autovacuum_count
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;`,
    expectedResult: 'История операций очистки и анализа таблиц'
  },
  {
    id: 18,
    title: 'Временные зоны',
    description: 'Работа с временными зонами и временными метками',
    category: 'Утилиты',
    difficulty: 'Легкий',
    preview: 'SELECT current_timestamp, timezone(\'UTC\', current_timestamp)...',
    sql: `SELECT 
  current_timestamp as local_time,
  timezone('UTC', current_timestamp) as utc_time,
  extract(timezone from current_timestamp) as timezone_offset,
  current_setting('timezone') as server_timezone;`,
    expectedResult: 'Информация о времени сервера и временных зонах'
  },
  {
    id: 19,
    title: 'Репликация статус',
    description: 'Статус репликации и WAL файлов',
    category: 'Репликация',
    difficulty: 'Сложный',
    preview: 'SELECT pg_is_in_recovery(), pg_last_wal_receive_lsn()...',
    sql: `SELECT 
  pg_is_in_recovery() as is_replica,
  pg_current_wal_lsn() as current_wal_lsn,
  pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') as wal_bytes,
  current_setting('wal_level') as wal_level;`,
    expectedResult: 'Информация о состоянии репликации и WAL'
  },
  {
    id: 20,
    title: 'Расширения PostgreSQL',
    description: 'Список установленных расширений',
    category: 'Система',
    difficulty: 'Легкий',
    preview: 'SELECT extname, extversion, nspname FROM pg_extension...',
    sql: `SELECT 
  e.extname,
  e.extversion,
  n.nspname,
  e.extrelocatable,
  e.extconfig
FROM pg_extension e
LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname;`,
    expectedResult: 'Все установленные расширения PostgreSQL'
  }
]

const clearQuery = () => {
  currentQuery.value = ''
  queryResults.value = null
  queryError.value = null
}

const executeQuery = async () => {
  if (!currentQuery.value.trim()) return

  executing.value = true
  queryResults.value = null
  queryError.value = null

  try {
    queryResults.value = await dbService.executeQuery(currentQuery.value)
  } catch (error) {
    queryError.value = error instanceof Error ? error.message : 'Неизвестная ошибка'
  } finally {
    executing.value = false
    // Refresh history after query execution
    await refreshHistory()
  }
}

const loadQuery = (query: string) => {
  currentQuery.value = query
  queryResults.value = null
  queryError.value = null
}

const loadProfessionalQuery = (query: ProfessionalQuery) => {
  currentQuery.value = query.sql
  queryResults.value = null
  queryError.value = null
}

const executeProfessionalQuery = async (query: ProfessionalQuery) => {
  console.log(`Executing professional query: ${query.title}`)
  console.log(`Expected result: ${query.expectedResult}`)
  
  try {
    executing.value = true
    queryResults.value = null
    queryError.value = null
    
    const result = await dbService.executeQuery(query.sql)
    queryResults.value = result
    
    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.querySelector('.query-results')
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
    
  } catch (error) {
    queryError.value = error instanceof Error ? error.message : 'Неизвестная ошибка'
  } finally {
    executing.value = false
    await refreshHistory()
  }
}

const formatValue = (value: any): string => {
  if (value === null) return 'NULL'
  if (value === undefined) return 'UNDEFINED'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  return String(value)
}

const refreshHistory = async () => {
  loadingHistory.value = true
  try {
    recentQueries.value = await dbService.getRecentQueries()
  } catch (error) {
    console.error('Failed to load query history:', error)
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  refreshHistory()
})
</script>

<style scoped>
.query-results {
  scroll-margin-top: 100px;
}
</style>
