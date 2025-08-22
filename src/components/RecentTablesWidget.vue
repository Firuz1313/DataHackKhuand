<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Недавно обновленные таблицы</h3>
      <button class="text-primary-600 hover:text-primary-700 text-sm font-medium">
        Посмотреть все
      </button>
    </div>

    <div class="space-y-4">
      <div 
        v-for="table in recentTables" 
        :key="table.id"
        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
          </div>
          <div>
            <h4 class="font-medium text-gray-900">{{ table.name }}</h4>
            <p class="text-sm text-gray-600">{{ table.records }} записей • {{ table.lastUpdate }}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <span 
            :class="getStatusBadgeClass(table.status)"
            class="px-2 py-1 rounded-full text-xs font-medium"
          >
            {{ table.status }}
          </span>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="recentTables.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
      </svg>
      <h3 class="text-lg font-medium text-gray-900">Нет данных</h3>
      <p class="text-gray-600 mt-1">Данные о таблицах будут отображаться здесь</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Table {
  id: number
  name: string
  records: string
  lastUpdate: string
  status: 'Активна' | 'Обновляется' | 'Ошибка'
}

const recentTables = reactive<Table[]>([
  {
    id: 1,
    name: 'users',
    records: '15,432',
    lastUpdate: '2 минуты назад',
    status: 'Активна'
  },
  {
    id: 2,
    name: 'orders',
    records: '8,764',
    lastUpdate: '15 минут назад',
    status: 'Обновляется'
  },
  {
    id: 3,
    name: 'products',
    records: '3,567',
    lastUpdate: '1 час назад',
    status: 'Активна'
  },
  {
    id: 4,
    name: 'payments',
    records: '12,098',
    lastUpdate: '3 часа назад',
    status: 'Активна'
  },
  {
    id: 5,
    name: 'sessions',
    records: '45,321',
    lastUpdate: '5 часов назад',
    status: 'Ошибка'
  }
])

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'Активна':
      return 'bg-success-100 text-success-700'
    case 'Обновляется':
      return 'bg-warning-100 text-warning-700'
    case 'Ошибка':
      return 'bg-error-100 text-error-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
</script>
