<template>
  <div class="bg-white rounded-lg shadow-card border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">API Статус</h3>
      <button
        @click="refreshStatus"
        :disabled="loading"
        class="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
      >
        {{ loading ? '🔄 Обновление...' : '🔄 Обновить' }}
      </button>
    </div>

    <div class="space-y-3">
      <!-- API Health -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center">
          <div
            :class="apiHealth ? 'bg-success-500' : 'bg-error-500'"
            class="w-3 h-3 rounded-full mr-3"
          ></div>
          <span class="text-sm font-medium text-gray-900">API Здоровье</span>
        </div>
        <span
          :class="apiHealth ? 'text-success-700' : 'text-error-700'"
          class="text-sm font-medium"
        >
          {{ apiHealth ? 'Доступно' : 'Недоступно' }}
        </span>
      </div>

      <!-- Cache Status -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
          <span class="text-sm font-medium text-gray-900">Кэш API</span>
        </div>
        <span class="text-sm text-gray-700">{{ cacheInfo.size }} записей</span>
      </div>

      <!-- Last Request Time -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center">
          <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
          <span class="text-sm font-medium text-gray-900">Последний запрос</span>
        </div>
        <span class="text-sm text-gray-700">{{ lastRequestTime }}</span>
      </div>

      <!-- Request Rate -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center">
          <div
            :class="isRateLimited ? 'bg-warning-500' : 'bg-success-500'"
            class="w-3 h-3 rounded-full mr-3"
          ></div>
          <span class="text-sm font-medium text-gray-900">Лимит запросов</span>
        </div>
        <span
          :class="isRateLimited ? 'text-warning-700' : 'text-success-700'"
          class="text-sm font-medium"
        >
          {{ isRateLimited ? 'Активен' : 'Норма' }}
        </span>
      </div>
    </div>

    <!-- Cache Clear Button -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <button
        @click="clearCache"
        class="w-full text-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
      >
        🗑️ Очистить кэш
      </button>
    </div>

    <!-- Debug Info (only in development) -->
    <div v-if="isDev" class="mt-4 pt-4 border-t border-gray-200">
      <details class="text-xs">
        <summary class="cursor-pointer text-gray-600 hover:text-gray-800">
          🔧 Debug инфор��ация
        </summary>
        <div class="mt-2 p-2 bg-gray-100 rounded text-gray-700 font-mono">
          <div>Cache keys: {{ cacheInfo.keys.length }}</div>
          <div class="mt-1 max-h-20 overflow-y-auto">
            <div v-for="key in cacheInfo.keys" :key="key" class="truncate">
              {{ key }}
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { dbService } from '../services/database'

const loading = ref(false)
const apiHealth = ref(true)
const lastRequestTime = ref('Никогда')
const isRateLimited = ref(false)
const isDev = ref(import.meta.env.DEV)

const cacheInfo = reactive({
  size: 0,
  keys: [] as string[],
})

let statusUpdateInterval: number

const refreshStatus = async () => {
  loading.value = true
  
  try {
    // Check API health
    apiHealth.value = await dbService.checkApiHealth()
    
    // Get cache info
    const info = dbService.getCacheInfo()
    cacheInfo.size = info.size
    cacheInfo.keys = info.keys
    
    // Update last request time
    lastRequestTime.value = new Date().toLocaleTimeString('ru-RU')
    
    // Reset rate limit flag (it will be set by error handlers if needed)
    isRateLimited.value = false
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      isRateLimited.value = true
    }
    apiHealth.value = false
    console.error('Failed to refresh API status:', error)
  } finally {
    loading.value = false
  }
}

const clearCache = () => {
  dbService.clearCache()
  refreshStatus()
}

// Listen for rate limiting errors from other components
const handleRateLimit = () => {
  isRateLimited.value = true
  setTimeout(() => {
    isRateLimited.value = false
  }, 10000) // Reset after 10 seconds
}

// Set up periodic status updates
onMounted(() => {
  refreshStatus()
  
  // Update status every 30 seconds
  statusUpdateInterval = setInterval(() => {
    refreshStatus()
  }, 30000)

  // Listen for global errors that might indicate rate limiting
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('429')) {
      handleRateLimit()
    }
  })
})

onUnmounted(() => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval)
  }
})
</script>
