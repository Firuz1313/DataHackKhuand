<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <DashboardSidebar />
    
    <!-- Main Content -->
    <div class="ml-64">
      <!-- Header -->
      <DashboardHeader page-title="Dashboard" />
      
      <!-- Dashboard Content -->
      <main class="p-6">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать в DataBoard</h2>
          <p class="text-gray-600">Обзор состояния вашей базы данных hackathon на PostgreSQL</p>
        </div>

        <!-- Database Stats Cards -->
        <DatabaseStatsCards />

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Query Activity -->
          <QueryActivityWidget />
          
          <!-- Database Performance -->
          <DatabasePerformanceWidget />
        </div>

        <!-- Secondary Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recent Tables - Takes 2 columns -->
          <div class="lg:col-span-2">
            <RecentTablesWidget />
          </div>
          
          <!-- Database Connection Info -->
          <div class="card p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Информация о подключении</h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="text-sm font-medium text-gray-900">Сервер</div>
                  <div class="text-sm text-gray-600">103.246.146.132:5432</div>
                </div>
                <div class="w-2 h-2 bg-success-500 rounded-full"></div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="text-sm font-medium text-gray-900">База данных</div>
                  <div class="text-sm text-gray-600">hackathon</div>
                </div>
                <div class="w-2 h-2 bg-success-500 rounded-full"></div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="text-sm font-medium text-gray-900">Пользователь</div>
                  <div class="text-sm text-gray-600">user_db</div>
                </div>
                <span class="badge-info">Только чтение</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="text-sm font-medium text-gray-900">Версия PostgreSQL</div>
                  <div class="text-sm text-gray-600">14.2</div>
                </div>
                <div class="w-2 h-2 bg-success-500 rounded-full"></div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-6 pt-4 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Быстрые действия</h4>
              <div class="space-y-2">
                <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  🔍 Выполнить запрос
                </button>
                <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  📊 Экспорт данных
                </button>
                <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  📈 Просмотр схемы
                </button>
              </div>
            </div>

            <!-- Connection Status -->
            <div class="mt-6 pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">Статус подключения</span>
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span class="text-sm text-success-600">Подключено</span>
                </div>
              </div>
              <div class="mt-2 text-xs text-gray-500">
                Последняя проверка: {{ new Date().toLocaleTimeString('ru-RU') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2024 DataBoard. Профессиональная панель управления базами данных.
            </div>
            <div class="flex items-center space-x-4">
              <button class="hover:text-gray-700">Документация</button>
              <button class="hover:text-gray-700">Поддержка</button>
              <button class="hover:text-gray-700">API</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardSidebar from '../components/DashboardSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import DatabaseStatsCards from '../components/DatabaseStatsCards.vue'
import QueryActivityWidget from '../components/QueryActivityWidget.vue'
import DatabasePerformanceWidget from '../components/DatabasePerformanceWidget.vue'
import RecentTablesWidget from '../components/RecentTablesWidget.vue'
</script>
