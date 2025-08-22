<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Tables -->
    <div class="card p-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Всего таблиц</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalTables }}</p>
          <p class="text-sm text-success-600 mt-1">
            <span class="inline-flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              +{{ stats.newTables }} новых
            </span>
          </p>
        </div>
        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Total Records -->
    <div class="card p-6 animate-fade-in" style="animation-delay: 0.1s">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Всего записей</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatNumber(stats.totalRecords) }}</p>
          <p class="text-sm text-success-600 mt-1">
            <span class="inline-flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              +{{ formatNumber(stats.newRecords) }} за месяц
            </span>
          </p>
        </div>
        <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Database Size -->
    <div class="card p-6 animate-fade-in" style="animation-delay: 0.2s">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Размер БД</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.databaseSize }}</p>
          <p class="text-sm text-warning-600 mt-1">
            <span class="inline-flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              +{{ stats.sizeGrowth }} за неделю
            </span>
          </p>
        </div>
        <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM3 8h14v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Active Connections -->
    <div class="card p-6 animate-fade-in" style="animation-delay: 0.3s">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Активн��е подключения</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.activeConnections }}</p>
          <p class="text-sm text-info-600 mt-1">
            <span class="inline-flex items-center">
              <div class="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
              Максимум: {{ stats.maxConnections }}
            </span>
          </p>
        </div>
        <div class="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const stats = reactive({
  totalTables: 47,
  newTables: 3,
  totalRecords: 1245678,
  newRecords: 12543,
  databaseSize: '2.8 GB',
  sizeGrowth: '145 MB',
  activeConnections: 8,
  maxConnections: 100
})

const formatNumber = (num: number): string => {
  return num.toLocaleString('ru-RU')
}
</script>
