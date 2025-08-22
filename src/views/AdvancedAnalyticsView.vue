<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Dashboard Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Аналитический дашборд</h1>
            <p class="text-sm text-gray-600 mt-1">
              Comprehensive Business Intelligence Dashboard
            </p>
          </div>
          
          <!-- Date Range Filter -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Период:</label>
              <select 
                v-model="selectedPeriod" 
                @change="loadAllData"
                class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="30">По��ледние 30 дней</option>
                <option value="90">Последние 90 дней</option>
                <option value="180">Последние 6 месяцев</option>
                <option value="365">Последний год</option>
              </select>
            </div>
            
            <button 
              @click="refreshData"
              :disabled="loading"
              class="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 disabled:opacity-50"
            >
              <svg class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {{ loading ? 'Обновление...' : 'Обновить' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-6 space-y-6">
      
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="text-gray-600 mt-4">Загружаем аналитику...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Ошибка загрузки данных</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content -->
      <div v-else class="space-y-6">
        
        <!-- Executive Summary KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Orders KPI -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Заказы</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ formatNumber(kpis?.orders?.total_orders || 0) }}
                </p>
                <p class="text-sm" :class="getGrowthClass(kpis?.orders?.orders_growth || 0)">
                  {{ formatGrowth(kpis?.orders?.orders_growth || 0) }}% за период
                </p>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-500">
              Avg: {{ formatNumber(kpis?.orders?.avg_orders_per_day || 0, 1) }} заказов/день
            </div>
          </div>

          <!-- Units KPI -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Единицы товара</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ formatNumber(kpis?.units?.total_units || 0) }}
                </p>
                <p class="text-sm" :class="getGrowthClass(kpis?.units?.units_growth || 0)">
                  {{ formatGrowth(kpis?.units?.units_growth || 0) }}% за период
                </p>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-500">
              Avg: {{ formatNumber(kpis?.units?.avg_units_per_order || 0, 1) }} шт/заказ
            </div>
          </div>

          <!-- Revenue KPI -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Валовая выручка</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ formatCurrency(kpis?.revenue?.gross_revenue || 0) }}
                </p>
                <p class="text-sm" :class="getGrowthClass(kpis?.revenue?.revenue_growth || 0)">
                  {{ formatGrowth(kpis?.revenue?.revenue_growth || 0) }}% за период
                </p>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-500">
              Net Paid: {{ formatCurrency(kpis?.revenue?.net_paid_revenue || 0) }}
            </div>
          </div>

          <!-- AOV KPI -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">AOV (Средний чек)</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ formatCurrency(kpis?.aov?.average_order_value || 0) }}
                </p>
                <p class="text-sm" :class="getGrowthClass(kpis?.aov?.aov_growth || 0)">
                  {{ formatGrowth(kpis?.aov?.aov_growth || 0) }}% за период
                </p>
              </div>
            </div>
          </div>

        </div>

        <!-- Secondary KPIs Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Payment Conversion -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Конверсия оплаты</p>
                <p class="text-3xl font-bold text-gray-900">
                  {{ formatPercentage(kpis?.conversion?.payment_conversion || 0) }}%
                </p>
              </div>
              <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Return Rate -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Доля возвратов</p>
                <p class="text-3xl font-bold text-gray-900">
                  {{ formatPercentage(kpis?.returns?.return_rate || 0) }}%
                </p>
              </div>
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path>
                </svg>
              </div>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              {{ formatCurrency(kpis?.returns?.return_amount || 0) }} возвращено
            </div>
          </div>

          <!-- Wallet Share -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Доля кошельков</p>
                <p class="text-3xl font-bold text-gray-900">
                  {{ formatPercentage(kpis?.wallet_share?.wallet_percentage || 0) }}%
                </p>
              </div>
              <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Holiday Effect -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Эффект выходных</p>
                <p class="text-3xl font-bold text-gray-900">
                  {{ formatGrowth(kpis?.seasonality?.holiday_effect || 0) }}%
                </p>
              </div>
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
          </div>

        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Channel Mix Chart -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Канальный микс</h3>
            <div v-if="kpis?.channels?.top_channels?.length > 0" class="space-y-3">
              <div 
                v-for="channel in kpis.channels.top_channels.slice(0, 5)" 
                :key="channel.channel"
                class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p class="font-medium text-gray-900">{{ channel.channel || 'Direct' }}</p>
                  <p class="text-sm text-gray-500">{{ channel.orders }} заказов</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900">{{ formatCurrency(channel.revenue) }}</p>
                  <p class="text-sm text-gray-500">
                    {{ formatPercentage((kpis.channels.channel_mix[channel.channel] || 0)) }}%
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              Данные по каналам не найдены
            </div>
          </div>

          <!-- Payment Mix Chart -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Микс способов оплаты</h3>
            <div v-if="kpis?.wallet_share?.payment_mix" class="space-y-3">
              <div 
                v-for="(percentage, method) in kpis.wallet_share.payment_mix" 
                :key="method"
                class="flex items-center justify-between py-2"
              >
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded-full mr-3" :class="getPaymentMethodColor(method)"></div>
                  <span class="font-medium text-gray-900">{{ method }}</span>
                </div>
                <span class="text-gray-600">{{ formatPercentage(percentage) }}%</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Geography Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Top Regions -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Топ регионы</h3>
            <div v-if="kpis?.geography?.regions?.length > 0" class="space-y-3">
              <div 
                v-for="(region, index) in kpis.geography.regions.slice(0, 8)" 
                :key="region.region"
                class="flex items-center justify-between py-2"
              >
                <div class="flex items-center">
                  <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center mr-3">
                    {{ index + 1 }}
                  </span>
                  <div>
                    <p class="font-medium text-gray-900">{{ region.region }}</p>
                    <p class="text-sm text-gray-500">{{ region.orders }} заказов</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900">{{ formatCurrency(region.revenue) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              Данные по регионам не найдены
            </div>
          </div>

          <!-- AOV by Channel -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">AOV по каналам</h3>
            <div v-if="kpis?.aov?.aov_by_channel" class="space-y-3">
              <div 
                v-for="(aov, channel) in kpis.aov.aov_by_channel" 
                :key="channel"
                class="flex items-center justify-between py-2"
              >
                <span class="font-medium text-gray-900">{{ channel || 'Direct' }}</span>
                <span class="text-gray-600">{{ formatCurrency(aov) }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Business Insights Section -->
        <div v-if="insights?.insights?.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            📊 Бизнес-инсайты и рекомендации
          </h3>
          <div class="space-y-4">
            <div 
              v-for="insight in insights.insights" 
              :key="insight.id"
              class="border-l-4 pl-4 py-3 rounded-r-lg"
              :class="getInsightBorderClass(insight.impact)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 mb-1">{{ insight.title }}</h4>
                  <p class="text-gray-700 mb-2">{{ insight.description }}</p>
                  <p class="text-sm text-primary-600 font-medium">
                    💡 Действие: {{ insight.business_action }}
                  </p>
                </div>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-4"
                  :class="getInsightBadgeClass(insight.impact)"
                >
                  {{ getInsightBadgeText(insight.impact) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Activity Pattern -->
        <div v-if="kpis?.seasonality?.daily_patterns?.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Паттерны активности по дням недели</h3>
          <div class="grid grid-cols-7 gap-4">
            <div 
              v-for="day in kpis.seasonality.daily_patterns" 
              :key="day.day"
              class="text-center p-3 bg-gray-50 rounded-lg"
            >
              <p class="text-sm font-medium text-gray-700">{{ day.day.trim() }}</p>
              <p class="text-lg font-bold text-primary-600">{{ day.orders }}</p>
              <p class="text-xs text-gray-500">{{ formatCurrency(day.revenue) }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { analyticsService, type DashboardKPIs, type InsightAnalysis } from '@/services/analyticsService'

// Reactive state
const loading = ref(false)
const error = ref<string | null>(null)
const selectedPeriod = ref('30')
const kpis = ref<DashboardKPIs | null>(null)
const insights = ref<InsightAnalysis | null>(null)

// Load data methods
const loadAllData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(selectedPeriod.value))
    
    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
    
    // Load KPIs and insights in parallel
    const [kpiData, insightData] = await Promise.all([
      analyticsService.getDashboardKPIs(dateRange),
      analyticsService.getBusinessInsights()
    ])
    
    kpis.value = kpiData
    insights.value = insightData
    
  } catch (err) {
    console.error('Error loading analytics data:', err)
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadAllData()
}

// Utility methods
const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatPercentage = (value: number): string => {
  return formatNumber(value, 1)
}

const formatGrowth = (value: number): string => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, 1)}`
}

const getGrowthClass = (value: number): string => {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-500'
}

const getPaymentMethodColor = (method: string): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-gray-500'
  ]
  const index = method.length % colors.length
  return colors[index]
}

const getInsightBorderClass = (impact: string): string => {
  switch (impact) {
    case 'high': return 'border-red-400 bg-red-50'
    case 'medium': return 'border-yellow-400 bg-yellow-50'
    case 'low': return 'border-green-400 bg-green-50'
    default: return 'border-gray-400 bg-gray-50'
  }
}

const getInsightBadgeClass = (impact: string): string => {
  switch (impact) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getInsightBadgeText = (impact: string): string => {
  switch (impact) {
    case 'high': return 'Высокий импакт'
    case 'medium': return 'Средний импакт'
    case 'low': return 'Низкий импакт'
    default: return 'Неизвестно'
  }
}

// Component lifecycle
onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
/* Дополнительные стили для dashboard */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
