<template>
  <aside class="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 shadow-sidebar transition-transform duration-300">
    <!-- Logo/Brand -->
    <div class="flex items-center justify-center h-16 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
        </div>
        <span class="text-xl font-bold text-gray-800">DataBoard</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="mt-6 px-4">
      <ul class="space-y-2">
        <li>
          <a href="#" @click="setActiveItem('dashboard')" 
             :class="activeItem === 'dashboard' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'"
             class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"/>
            </svg>
            Dashboard
          </a>
        </li>
        
        <li>
          <a href="#" @click="setActiveItem('database')" 
             :class="activeItem === 'database' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'"
             class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
            База данных
          </a>
        </li>

        <li>
          <a href="#" @click="setActiveItem('tables')" 
             :class="activeItem === 'tables' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'"
             class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
            Таблицы
          </a>
        </li>

        <li>
          <a href="#" @click="setActiveItem('queries')" 
             :class="activeItem === 'queries' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'"
             class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Запросы
          </a>
        </li>

        <li>
          <a href="#" @click="setActiveItem('analytics')" 
             :class="activeItem === 'analytics' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'"
             class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Аналитика
          </a>
        </li>
      </ul>

      <!-- Divider -->
      <div class="border-t border-gray-200 my-6"></div>

      <!-- Settings Section -->
      <ul class="space-y-2">
        <li>
          <a href="#" @click="setActiveItem('settings')" 
             :class="activeItem === 'settings' ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-600 hover:bg-gray-50'"
             class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Настройки
          </a>
        </li>
      </ul>
    </nav>

    <!-- Connection Status Cards -->
    <div class="absolute bottom-4 left-4 right-4 space-y-3">
      <!-- Neon Connection -->
      <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center">
            <div :class="connectionStatus.neon ? 'bg-success-500' : 'bg-error-500'" class="w-2 h-2 rounded-full mr-2"></div>
            <span class="text-xs font-medium text-gray-600">Neon PostgreSQL</span>
          </div>
          <span class="text-xs" :class="connectionStatus.neon ? 'text-success-600' : 'text-error-600'">
            {{ connectionStatus.neon ? 'Подключено' : 'Ошибка' }}
          </span>
        </div>
        <div class="text-xs text-gray-500 font-mono">{{ neonEndpoint }}</div>
      </div>

      <!-- Legacy Connection Info -->
      <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center">
            <div class="w-2 h-2 bg-warning-500 rounded-full mr-2"></div>
            <span class="text-xs font-medium text-gray-600">Legacy PostgreSQL</span>
          </div>
          <span class="text-xs text-warning-600">Только чтение</span>
        </div>
        <div class="text-xs text-gray-500">
          <div class="font-mono">{{ legacyHost }}:{{ legacyPort }}</div>
          <div>{{ legacyDatabase }}@{{ legacyUser }}</div>
        </div>
      </div>

      <!-- Connection Test Button -->
      <button 
        @click="testConnections" 
        :disabled="testing"
        class="w-full text-center px-3 py-2 text-xs bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200 disabled:opacity-50"
      >
        {{ testing ? '🔄 Проверка...' : '🔍 Проверить подключения' }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dbService } from '../services/database'

const activeItem = ref('dashboard')
const testing = ref(false)

const connectionStatus = reactive({
  neon: false,
  legacy: false
})

// Environment variables
const neonEndpoint = import.meta.env.VITE_DATABASE_URL?.split('@')[1]?.split('/')[0] || 'ep-polished-butterfly-aebtpaqz-pooler.c-2.us-east-2.aws.neon.tech'
const legacyHost = import.meta.env.VITE_LEGACY_DB_HOST || '103.246.146.132'
const legacyPort = import.meta.env.VITE_LEGACY_DB_PORT || '5432'
const legacyDatabase = import.meta.env.VITE_LEGACY_DB_NAME || 'hackathon'
const legacyUser = import.meta.env.VITE_LEGACY_DB_USER || 'user_db'

const setActiveItem = (item: string) => {
  activeItem.value = item
}

const testConnections = async () => {
  testing.value = true
  
  try {
    // Test Neon connection
    connectionStatus.neon = await dbService.testConnection()
    
    // Legacy connection is not directly testable from frontend due to SSH requirement
    // So we mark it as informational only
    connectionStatus.legacy = false
  } catch (error) {
    console.error('Connection test failed:', error)
    connectionStatus.neon = false
    connectionStatus.legacy = false
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  testConnections()
})
</script>
