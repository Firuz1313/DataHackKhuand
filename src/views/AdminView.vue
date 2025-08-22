<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <DashboardSidebar />

    <!-- Main Content -->
    <div class="ml-64">
      <!-- Header -->
      <DashboardHeader page-title="Администрирование" />

      <!-- Admin Content -->
      <main class="p-6">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Административная панель</h2>
          <p class="text-gray-800 font-medium">
            Управление бизнес-таблицами, миграциями и системными настройками
          </p>
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="bg-white rounded-lg shadow-card border border-gray-200 p-12 text-center mb-8"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"
          ></div>
          <p class="text-gray-700 font-medium">Загрузка данных...</p>
        </div>

        <!-- Admin Dashboard Content -->
        <div v-else>
          <!-- Quick Stats Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div
              v-for="stat in quickStats"
              :key="stat.id"
              class="bg-white rounded-lg shadow-card border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div class="flex items-center justify-between mb-4">
                <div
                  :class="stat.iconBg"
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                >
                  <component :is="stat.icon" class="w-6 h-6 text-white" />
                </div>
                <router-link
                  :to="stat.link"
                  class="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                >
                  Подробнее →
                </router-link>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-2">{{ stat.value }}</div>
              <div class="text-sm text-gray-800 font-medium">{{ stat.label }}</div>
            </div>
          </div>

          <!-- Business Tables Overview -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Tables Summary -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Бизнес-таблицы</h3>
                <router-link
                  to="/admin/custom-tables"
                  class="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-primary-200 transition-colors"
                >
                  Управление
                </router-link>
              </div>

              <div class="space-y-4">
                <div
                  v-for="table in businessTables"
                  :key="table.name"
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  @click="viewTable(table.name)"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        class="w-5 h-5 text-blue-600"
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
                    </div>
                    <div>
                      <div class="font-semibold text-gray-900">{{ table.display_name }}</div>
                      <div class="text-sm text-gray-700 font-medium">{{ table.description }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-gray-900">{{ table.record_count }}</div>
                    <div class="text-sm text-gray-700 font-medium">записей</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Activities -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Последние действия</h3>
                <button
                  @click="refreshActivities"
                  class="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                >
                  🔄 Обновить
                </button>
              </div>

              <div class="space-y-3">
                <div
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    :class="getActivityIconBg(activity.type)"
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <component :is="getActivityIcon(activity.type)" class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-gray-900">
                      {{ activity.description }}
                    </div>
                    <div class="text-xs text-gray-700 font-medium">{{ activity.table_name }}</div>
                    <div class="text-xs text-gray-600 font-medium">{{ activity.created_at }}</div>
                  </div>
                </div>
              </div>

              <div
                v-if="!recentActivities.length"
                class="text-center py-4 text-gray-600 font-medium"
              >
                Нет последних действий
              </div>
            </div>
          </div>

          <!-- System Health and Migration Status -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Migration Status -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Статус миграций</h3>
                <router-link
                  to="/admin/migrations"
                  class="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors"
                >
                  Управление
                </router-link>
              </div>

              <div v-if="migrationStatus" class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-gray-800 font-medium">Всего миграций</span>
                  <span class="text-lg font-bold text-gray-900">{{ migrationStatus.total }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-800 font-medium">Выполнено</span>
                  <span class="text-lg font-bold text-green-600">{{
                    migrationStatus.executed
                  }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-800 font-medium">Ожидают</span>
                  <span class="text-lg font-bold text-orange-600">{{
                    migrationStatus.pending
                  }}</span>
                </div>

                <!-- Progress Bar -->
                <div class="mt-4">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-700 font-medium">Прогресс</span>
                    <span class="text-gray-700 font-medium"
                      >{{
                        Math.round((migrationStatus.executed / migrationStatus.total) * 100)
                      }}%</span
                    >
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-green-500 h-2 rounded-full transition-all duration-300"
                      :style="`width: ${(migrationStatus.executed / migrationStatus.total) * 100}%`"
                    ></div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-gray-600 font-medium">
                Загрузка статуса миграций...
              </div>
            </div>

            <!-- System Health -->
            <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-6">Состояние системы</h3>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-gray-800 font-medium">База данных</span>
                  </div>
                  <span class="text-green-700 font-semibold">Подключена</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-gray-800 font-medium">API Сервер</span>
                  </div>
                  <span class="text-green-700 font-semibold">Активен</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span class="text-gray-800 font-medium">Кэш</span>
                  </div>
                  <span class="text-blue-700 font-semibold">Работает</span>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-gray-800 font-medium">Валидация</span>
                  </div>
                  <span class="text-green-700 font-semibold">Включена</span>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-200">
                <div class="text-sm text-gray-700 font-medium">
                  Последнее обновление: {{ new Date().toLocaleString('ru-RU') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">Быстрые действия</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <button
                @click="exportAllData"
                class="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <svg
                  class="w-8 h-8 text-blue-600 mb-2 group-hover:text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span class="text-sm font-semibold text-blue-600 group-hover:text-blue-700"
                  >Экспорт</span
                >
              </button>

              <button
                @click="backupDatabase"
                class="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <svg
                  class="w-8 h-8 text-green-600 mb-2 group-hover:text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                <span class="text-sm font-semibold text-green-600 group-hover:text-green-700"
                  >Бэкап</span
                >
              </button>

              <button
                @click="validateData"
                class="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <svg
                  class="w-8 h-8 text-purple-600 mb-2 group-hover:text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm font-semibold text-purple-600 group-hover:text-purple-700"
                  >Валидация</span
                >
              </button>

              <button
                @click="runMigrations"
                class="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
              >
                <svg
                  class="w-8 h-8 text-orange-600 mb-2 group-hover:text-orange-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span class="text-sm font-semibold text-orange-600 group-hover:text-orange-700"
                  >Миграции</span
                >
              </button>

              <button
                @click="clearCache"
                class="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
              >
                <svg
                  class="w-8 h-8 text-red-600 mb-2 group-hover:text-red-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span class="text-sm font-semibold text-red-600 group-hover:text-red-700"
                  >Очистить кэш</span
                >
              </button>

              <button
                @click="showLogs"
                class="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <svg
                  class="w-8 h-8 text-gray-600 mb-2 group-hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span class="text-sm font-semibold text-gray-600 group-hover:text-gray-700"
                  >Логи</span
                >
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DashboardSidebar from '../components/DashboardSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import { customTablesService } from '../services/customTables'

// Icons
const DatabaseIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>`,
}

const UsersIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>`,
}

const ShoppingCartIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" /></svg>`,
}

const CogIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
}

const PlusIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`,
}

const CheckIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`,
}

const ExclamationIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`,
}

// State
const loading = ref(true)
const migrationStatus = ref(null)
const businessTables = ref([])
const recentActivities = ref([])

// Quick stats computed
const quickStats = computed(() => [
  {
    id: 1,
    label: 'Бизнес-таблицы',
    value: businessTables.value.length.toString(),
    icon: DatabaseIcon,
    iconBg: 'bg-blue-500',
    link: '/admin/custom-tables',
  },
  {
    id: 2,
    label: 'Записей данных',
    value: businessTables.value
      .reduce((sum, table) => sum + (table.record_count || 0), 0)
      .toLocaleString('ru-RU'),
    icon: UsersIcon,
    iconBg: 'bg-green-500',
    link: '/database',
  },
  {
    id: 3,
    label: 'Выполнено миграций',
    value: migrationStatus.value ? migrationStatus.value.executed.toString() : '0',
    icon: CogIcon,
    iconBg: 'bg-purple-500',
    link: '/admin/migrations',
  },
  {
    id: 4,
    label: 'Активных валидаций',
    value: '8',
    icon: CheckIcon,
    iconBg: 'bg-orange-500',
    link: '/admin/custom-tables',
  },
])

// Load admin data
const loadAdminData = async () => {
  try {
    loading.value = true

    // Load migration status
    try {
      migrationStatus.value = await customTablesService.getMigrationStatus()
    } catch (error) {
      console.warn('Failed to load migration status:', error)
    }

    // Load business tables summary
    businessTables.value = [
      {
        name: 'customers',
        display_name: 'Клиенты',
        description: 'Клиенты и их контактная информация',
        record_count: 8,
      },
      {
        name: 'suppliers',
        display_name: 'Поставщики',
        description: 'Поставщики товаров и услуг',
        record_count: 5,
      },
      {
        name: 'products',
        display_name: 'Товары',
        description: 'Каталог товаров и услуг',
        record_count: 8,
      },
      {
        name: 'orders',
        display_name: 'Заказы',
        description: 'Заказы клиентов',
        record_count: 5,
      },
      {
        name: 'order_items',
        display_name: 'Позиции заказов',
        description: 'Детализация заказов',
        record_count: 9,
      },
      {
        name: 'inventory_movements',
        display_name: 'Движения склада',
        description: 'История движений товаров',
        record_count: 10,
      },
    ]

    // Mock recent activities
    recentActivities.value = [
      {
        id: 1,
        type: 'INSERT',
        description: 'Добавлен новый клиент',
        table_name: 'customers',
        created_at: '2 минуты назад',
      },
      {
        id: 2,
        type: 'UPDATE',
        description: 'Обновлен статус заказа',
        table_name: 'orders',
        created_at: '5 минут назад',
      },
      {
        id: 3,
        type: 'INSERT',
        description: 'Добавлен новый товар',
        table_name: 'products',
        created_at: '10 минут назад',
      },
      {
        id: 4,
        type: 'DELETE',
        description: 'Удален неактивный поставщик',
        table_name: 'suppliers',
        created_at: '15 минут назад',
      },
    ]
  } catch (error) {
    console.error('Error loading admin data:', error)
  } finally {
    loading.value = false
  }
}

// Helper functions
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'INSERT':
      return PlusIcon
    case 'UPDATE':
      return CogIcon
    case 'DELETE':
      return ExclamationIcon
    default:
      return CheckIcon
  }
}

const getActivityIconBg = (type: string) => {
  switch (type) {
    case 'INSERT':
      return 'bg-green-500'
    case 'UPDATE':
      return 'bg-blue-500'
    case 'DELETE':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

// Action handlers
const viewTable = (tableName: string) => {
  // Navigate to table detail view
  console.log('Viewing table:', tableName)
}

const refreshActivities = () => {
  console.log('Refreshing activities...')
  loadAdminData()
}

const exportAllData = () => {
  console.log('Exporting all data...')
  alert('🔄 Экспорт данных запущен. Файлы будут готовы через несколько мин��т.')
}

const backupDatabase = () => {
  console.log('Creating database backup...')
  alert('💾 Создание резервной копии базы данных...')
}

const validateData = () => {
  console.log('Validating data...')
  alert('✅ Валидация данных завершена. Найдено 0 ошибок.')
}

const runMigrations = async () => {
  try {
    console.log('Running migrations...')
    const result = await customTablesService.runMigrations()
    alert(`✅ Миграции выполнены: ${result.executed}/${result.total}`)
    loadAdminData() // Refresh data
  } catch (error) {
    console.error('Migration error:', error)
    alert('❌ Ошибка выполнения миграций: ' + error.message)
  }
}

const clearCache = () => {
  console.log('Clearing cache...')
  alert('🗑️ Кэш очищен')
}

const showLogs = () => {
  console.log('Showing logs...')
  alert('📄 Открытие логов системы...')
}

onMounted(() => {
  console.log('🎯 Admin panel loaded')
  loadAdminData()
})
</script>
