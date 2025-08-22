import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('@/views/DatabaseView.vue'),
      meta: { title: 'База данных' }
    },
    {
      path: '/tables',
      name: 'tables',
      component: () => import('@/views/TablesView.vue'),
      meta: { title: 'Таблицы' }
    },
    {
      path: '/tables/:tableName',
      name: 'table-detail',
      component: () => import('@/views/TableDetailView.vue'),
      meta: { title: 'Данные таблицы' },
      props: true
    },
    {
      path: '/tables/:tableName/schema',
      name: 'table-schema',
      component: () => import('@/views/TableSchemaView.vue'),
      meta: { title: 'Схема таблицы' },
      props: true
    },
    {
      path: '/queries',
      name: 'queries',
      component: () => import('@/views/QueriesView.vue'),
      meta: { title: 'Запросы' }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('@/views/AnalyticsView.vue'),
      meta: { title: 'Аналитика' }
    },
    {
      path: '/eda',
      name: 'eda',
      component: () => import('@/views/EDAView.vue'),
      meta: { title: 'EDA - Исследовательский анализ' }
    },
    {
      path: '/data-quality',
      name: 'data-quality',
      component: () => import('@/views/DataQualityView.vue'),
      meta: { title: 'Качество данных' }
    },
    {
      path: '/kpi',
      name: 'kpi',
      component: () => import('@/views/KPIDashboardView.vue'),
      meta: { title: 'KPI Дашборд' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: 'Настройки' }
    }
  ]
})

// Update document title based on route
router.beforeEach((to, from, next) => {
  document.title = `DataBoard - ${to.meta.title || 'Управление БД'}`
  next()
})

export default router
