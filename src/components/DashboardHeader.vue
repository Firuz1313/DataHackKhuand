<template>
  <header class="bg-white border-b border-gray-200 px-6 py-4 ml-64">
    <div class="flex items-center justify-between">
      <!-- Left side - Page title and breadcrumb -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <nav class="flex mt-1" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="#" class="hover:text-gray-700">Главная</a>
            </li>
            <li>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
            </li>
            <li class="text-gray-900">{{ pageTitle }}</li>
          </ol>
        </nav>
      </div>

      <!-- Right side - Actions and user info -->
      <div class="flex items-center space-x-4">
        <!-- Search -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Поиск в базе данных..." 
            class="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
        </div>

        <!-- Notifications -->
        <button class="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM11 19H7a2 2 0 01-2-2V7a2 2 0 012-2h4m4 0V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0V3a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
          <span class="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
        </button>

        <!-- Database Status Indicator -->
        <div class="flex items-center space-x-2 px-3 py-2 bg-success-50 rounded-lg border border-success-200">
          <div class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-medium text-success-700">Online</span>
        </div>

        <!-- User Menu -->
        <div class="relative" @click="toggleUserMenu">
          <button class="flex items-center space-x-3 text-sm bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 p-2">
            <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span class="text-white font-medium">АД</span>
            </div>
            <div class="text-left">
              <div class="font-medium text-gray-900">Администратор</div>
              <div class="text-xs text-gray-500">user_db@hackathon</div>
            </div>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- User Dropdown -->
          <div v-if="userMenuOpen" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div class="py-2">
              <a href="#" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Профиль
              </a>
              <a href="#" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Настройки
              </a>
              <div class="border-t border-gray-200 my-2"></div>
              <a href="#" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Выйти
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const userMenuOpen = ref(false)

const props = defineProps<{
  pageTitle?: string
}>()

const pageTitle = props.pageTitle || 'Dashboard'

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (userMenuOpen.value) {
    userMenuOpen.value = false
  }
})
</script>
