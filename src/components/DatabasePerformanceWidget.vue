<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Производительность БД</h3>
      <div class="flex items-center space-x-2">
        <button 
          @click="activeTab = 'cpu'"
          :class="activeTab === 'cpu' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'"
          class="px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          CPU
        </button>
        <button 
          @click="activeTab = 'memory'"
          :class="activeTab === 'memory' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'"
          class="px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Память
        </button>
        <button 
          @click="activeTab = 'io'"
          :class="activeTab === 'io' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'"
          class="px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          I/O
        </button>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">{{ getMetricLabel() }}</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ getCurrentMetric() }}</div>
          </div>
          <div 
            :class="getMetricColor()"
            class="w-12 h-12 rounded-lg flex items-center justify-center"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getMetricIcon()"/>
            </svg>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-3">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              :class="getProgressColor()"
              class="h-2 rounded-full transition-all duration-500"
              :style="{ width: `${getCurrentPercentage()}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-4">
        <div class="text-sm text-gray-600 mb-3">Статистика за последний час</div>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Среднее значение:</span>
            <span class="font-medium">{{ getAverageMetric() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Максимальное:</span>
            <span class="font-medium">{{ getMaxMetric() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Минимальное:</span>
            <span class="font-medium">{{ getMinMetric() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mini Chart -->
    <div class="h-32 bg-gray-50 rounded-lg flex items-end justify-center space-x-1 p-4">
      <div 
        v-for="(value, index) in getChartData()" 
        :key="index"
        :class="getProgressColor()"
        class="w-3 rounded-t transition-all duration-300 hover:opacity-80"
        :style="{ height: `${value}%`, animationDelay: `${index * 0.05}s` }"
      ></div>
    </div>

    <!-- Real-time Status -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-medium text-gray-900">Мониторинг в реальном времени</span>
        </div>
        <span class="text-xs text-gray-500">Обновлено {{ new Date().toLocaleTimeString('ru-RU') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

type MetricTab = 'cpu' | 'memory' | 'io'

const activeTab = ref<MetricTab>('cpu')

const metrics = reactive({
  cpu: {
    current: 23,
    average: 18,
    max: 45,
    min: 8,
    data: [15, 22, 18, 25, 30, 28, 23, 19, 16, 21, 24, 23, 27, 32, 29, 25, 20, 18, 22, 23]
  },
  memory: {
    current: 67,
    average: 62,
    max: 78,
    min: 45,
    data: [60, 65, 58, 70, 72, 68, 67, 64, 62, 66, 69, 67, 71, 75, 73, 69, 65, 63, 66, 67]
  },
  io: {
    current: 34,
    average: 28,
    max: 56,
    min: 12,
    data: [25, 30, 22, 35, 40, 32, 34, 28, 24, 31, 36, 34, 38, 42, 39, 35, 30, 26, 32, 34]
  }
})

const getMetricLabel = (): string => {
  switch (activeTab.value) {
    case 'cpu': return 'Использование CPU'
    case 'memory': return 'Использование памяти'
    case 'io': return 'I/O операции'
    default: return ''
  }
}

const getCurrentMetric = (): string => {
  return `${metrics[activeTab.value].current}%`
}

const getCurrentPercentage = (): number => {
  return metrics[activeTab.value].current
}

const getAverageMetric = (): string => {
  return `${metrics[activeTab.value].average}%`
}

const getMaxMetric = (): string => {
  return `${metrics[activeTab.value].max}%`
}

const getMinMetric = (): string => {
  return `${metrics[activeTab.value].min}%`
}

const getChartData = (): number[] => {
  return metrics[activeTab.value].data
}

const getMetricColor = (): string => {
  const current = metrics[activeTab.value].current
  if (current < 30) return 'bg-success-100 text-success-600'
  if (current < 70) return 'bg-warning-100 text-warning-600'
  return 'bg-error-100 text-error-600'
}

const getProgressColor = (): string => {
  const current = metrics[activeTab.value].current
  if (current < 30) return 'bg-success-500'
  if (current < 70) return 'bg-warning-500'
  return 'bg-error-500'
}

const getMetricIcon = (): string => {
  switch (activeTab.value) {
    case 'cpu': return 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
    case 'memory': return 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01'
    case 'io': return 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
    default: return ''
  }
}
</script>
