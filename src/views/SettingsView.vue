<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />

    <div class="ml-64">
      <DashboardHeader />

      <main class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Настройки</h1>
          <p class="text-gray-600">Конфигурация приложения и параметры подключения</p>
        </div>

        <!-- Database Connection Settings -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Подключение к базе данных</h2>

          <form @submit.prevent="saveConnectionSettings" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Хост</label>
                <input
                  v-model="connectionSettings.host"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Порт</label>
                <input
                  v-model="connectionSettings.port"
                  type="number"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">База данных</label>
                <input
                  v-model="connectionSettings.database"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Пользователь</label>
                <input
                  v-model="connectionSettings.user"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="testConnection"
                :disabled="testing"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              >
                {{ testing ? 'Проверка...' : 'Проверить подключение' }}
              </button>

              <button
                type="submit"
                :disabled="saving"
                class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {{ saving ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Application Settings -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Настройки приложения</h2>

          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-900">Автообновление данных</label>
                <p class="text-sm text-gray-600">Автоматически обновлять данные каждые 30 секунд</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="appSettings.autoRefresh" type="checkbox" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-900">Темная тема</label>
                <p class="text-sm text-gray-600">Использовать темную тему интерфейса</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="appSettings.darkMode" type="checkbox" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Количество строк на странице</label
              >
              <select
                v-model="appSettings.pageSize"
                class="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Язык интерфейса</label>
              <select
                v-model="appSettings.language"
                class="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Query Settings -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Настройки запросов</h2>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Максимальное время выполнения (секунды)</label
              >
              <input
                v-model.number="querySettings.timeout"
                type="number"
                min="1"
                max="300"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Максимальное количество результатов</label
              >
              <input
                v-model.number="querySettings.maxResults"
                type="number"
                min="100"
                max="10000"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-900"
                  >Автоформатирование SQL</label
                >
                <p class="text-sm text-gray-600">Автоматически форматировать SQL запросы</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="querySettings.autoFormat" type="checkbox" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Export/Import Settings -->
        <div class="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Экспорт/Импорт настроек</h2>

          <div class="flex space-x-4">
            <button
              @click="exportSettings"
              class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors duration-200"
            >
              📥 Экспорт настроек
            </button>

            <label
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 cursor-pointer"
            >
              📤 Импорт настроек
              <input type="file" @change="importSettings" accept=".json" class="hidden" />
            </label>

            <button
              @click="resetSettings"
              class="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors duration-200"
            >
              🔄 Сбросить к умолчанию
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DashboardSidebar from '@/components/DashboardSidebar.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import { dbService } from '@/services/database'

const testing = ref(false)
const saving = ref(false)

const connectionSettings = reactive({
  host: '103.246.146.132',
  port: 5432,
  database: 'hackathon',
  user: 'user_db',
})

const appSettings = reactive({
  autoRefresh: true,
  darkMode: false,
  pageSize: 50,
  language: 'ru',
})

const querySettings = reactive({
  timeout: 30,
  maxResults: 1000,
  autoFormat: true,
})

const testConnection = async () => {
  testing.value = true
  try {
    const success = await dbService.testConnection()
    if (success) {
      alert('✅ Подключение успешно установлено!')
    } else {
      alert('❌ Не удалось установить подключение')
    }
  } catch (error) {
    alert('❌ Ошибка при проверке подключения: ' + (error as Error).message)
  } finally {
    testing.value = false
  }
}

const saveConnectionSettings = async () => {
  saving.value = true
  try {
    // Simulate saving settings
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Save to localStorage
    localStorage.setItem('connectionSettings', JSON.stringify(connectionSettings))
    localStorage.setItem('appSettings', JSON.stringify(appSettings))
    localStorage.setItem('querySettings', JSON.stringify(querySettings))

    alert('✅ Настройки сохранены!')
  } catch (error) {
    alert('❌ Ошибка при сохранении настрое��')
  } finally {
    saving.value = false
  }
}

const exportSettings = () => {
  const settings = {
    connection: connectionSettings,
    app: appSettings,
    query: querySettings,
    exportDate: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `databoard-settings-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importSettings = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const settings = JSON.parse(e.target?.result as string)

      if (settings.connection) Object.assign(connectionSettings, settings.connection)
      if (settings.app) Object.assign(appSettings, settings.app)
      if (settings.query) Object.assign(querySettings, settings.query)

      alert('✅ Настройки успешно импортированы!')
    } catch (error) {
      alert('❌ Ошибка при импорте настроек: неверный формат файла')
    }
  }
  reader.readAsText(file)
}

const resetSettings = () => {
  if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
    Object.assign(connectionSettings, {
      host: '103.246.146.132',
      port: 5432,
      database: 'hackathon',
      user: 'user_db',
    })

    Object.assign(appSettings, {
      autoRefresh: true,
      darkMode: false,
      pageSize: 50,
      language: 'ru',
    })

    Object.assign(querySettings, {
      timeout: 30,
      maxResults: 1000,
      autoFormat: true,
    })

    // Clear localStorage
    localStorage.removeItem('connectionSettings')
    localStorage.removeItem('appSettings')
    localStorage.removeItem('querySettings')

    alert('✅ Настройки сброшены к значениям по умолчанию!')
  }
}

const loadSettings = () => {
  try {
    const savedConnection = localStorage.getItem('connectionSettings')
    if (savedConnection) {
      Object.assign(connectionSettings, JSON.parse(savedConnection))
    }

    const savedApp = localStorage.getItem('appSettings')
    if (savedApp) {
      Object.assign(appSettings, JSON.parse(savedApp))
    }

    const savedQuery = localStorage.getItem('querySettings')
    if (savedQuery) {
      Object.assign(querySettings, JSON.parse(savedQuery))
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>
