<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Активность запросов</h3>
      <div class="flex items-center space-x-2">
        <select class="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option>Последний час</option>
          <option>Пос��едние 24 часа</option>
          <option>Последняя неделя</option>
        </select>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="mb-6">
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden">
        <!-- Simple Chart Visualization -->
        <div class="absolute inset-0 flex items-end justify-center space-x-2 p-4">
          <div 
            v-for="(value, index) in chartData" 
            :key="index"
            class="bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm flex-1 transition-all duration-500 hover:from-primary-700 hover:to-primary-500"
            :style="{ height: `${value}%`, animationDelay: `${index * 0.1}s` }"
            :title="`${value}% активности`"
          ></div>
        </div>
        
        <!-- Chart Labels -->
        <div class="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-gray-500">
          <span v-for="label in timeLabels" :key="label">{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- Query Statistics -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ queryStats.total }}</div>
        <div class="text-sm text-gray-600">Всего запросов</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-success-600">{{ queryStats.successful }}</div>
        <div class="text-sm text-gray-600">Успешных</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-error-600">{{ queryStats.failed }}</div>
        <div class="text-sm text-gray-600">Ошибок</div>
      </div>
    </div>

    <!-- Recent Queries -->
    <div class="border-t border-gray-200 pt-4">
      <h4 class="text-sm font-medium text-gray-900 mb-3">Последние запросы</h4>
      <div class="space-y-2">
        <div 
          v-for="query in recentQueries" 
          :key="query.id"
          class="flex items-center justify-between text-sm"
        >
          <div class="flex items-center space-x-3">
            <div 
              :class="query.status === 'success' ? 'bg-success-500' : 'bg-error-500'"
              class="w-2 h-2 rounded-full"
            ></div>
            <span class="font-mono text-gray-800 truncate max-w-xs">{{ query.query }}</span>
          </div>
          <div class="flex items-center space-x-2 text-gray-500">
            <span>{{ query.duration }}</span>
            <span>{{ query.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Query {
  id: number
  query: string
  duration: string
  time: string
  status: 'success' | 'error'
}

const chartData = ref([65, 78, 90, 67, 82, 95, 88, 76, 85, 92, 89, 94])
const timeLabels = ref(['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'])

const queryStats = reactive({
  total: 1547,
  successful: 1432,
  failed: 115
})

const recentQueries = reactive<Query[]>([
  {
    id: 1,
    query: 'SELECT * FROM users WHERE active = true',
    duration: '45ms',
    time: '2 мин назад',
    status: 'success'
  },
  {
    id: 2,
    query: 'UPDATE orders SET status = \'completed\'',
    duration: '120ms',
    time: '5 мин назад',
    status: 'success'
  },
  {
    id: 3,
    query: 'SELECT COUNT(*) FROM products',
    duration: 'timeout',
    time: '8 мин назад',
    status: 'error'
  },
  {
    id: 4,
    query: 'INSERT INTO logs (message, level)',
    duration: '23ms',
    time: '12 мин назад',
    status: 'success'
  },
  {
    id: 5,
    query: 'DELETE FROM temp_sessions',
    duration: '67ms',
    time: '15 мин назад',
    status: 'success'
  }
])
</script>
