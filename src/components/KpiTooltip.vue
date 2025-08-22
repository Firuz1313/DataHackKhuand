<template>
  <div class="relative inline-block">
    <button
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      class="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Tooltip -->
    <div
      v-show="showTooltip"
      class="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap max-w-xs"
      :class="tooltipClass"
    >
      <div class="font-medium mb-1">{{ title }}</div>
      <div class="text-xs text-gray-300">{{ description }}</div>
      <div v-if="formula" class="text-xs text-blue-300 mt-1 font-mono">{{ formula }}</div>
      
      <!-- Arrow -->
      <div
        class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  description: string
  formula?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top'
})

const showTooltip = ref(false)

const tooltipClass = computed(() => {
  switch (props.position) {
    case 'bottom':
      return 'top-full mt-2 mb-0'
    case 'left':
      return 'right-full mr-2 top-1/2 transform -translate-y-1/2'
    case 'right':
      return 'left-full ml-2 top-1/2 transform -translate-y-1/2'
    default:
      return 'bottom-full mb-2'
  }
})
</script>

<style scoped>
.whitespace-nowrap {
  white-space: normal;
}
@media (max-width: 640px) {
  .max-w-xs {
    max-width: 200px;
  }
}
</style>
