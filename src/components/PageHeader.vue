<template>
  <div class="page-header">
    <button v-if="showBack" class="back-btn" @click="$router.back()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <h1>{{ title }}</h1>
    <slot name="right"></slot>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  showBack: {
    type: Boolean,
    default: true
  }
})
</script>
