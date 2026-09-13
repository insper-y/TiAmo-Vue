<template>
  <div class="pagination" v-if="totalPages > 1">
    <button @click="goToPage(1)" :disabled="currentPage === 1">首页</button>
    <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>
    <button
      v-for="page in visiblePages"
      :key="page"
      :class="{ active: page === currentPage }"
      @click="goToPage(page)"
    >{{ page }}</button>
    <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">下一页</button>
    <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages">末页</button>
    <span class="page-info">共 {{ total }} 条，第 {{ currentPage }}/{{ totalPages }} 页</span>
    <select class="select" :value="pageSize" @change="onPageSizeChange($event.target.value)" style="width:auto;min-height:38px;padding:6px 10px;font-size:12px;">
      <option :value="10">10条/页</option>
      <option :value="20">20条/页</option>
      <option :value="50">50条/页</option>
      <option :value="100">100条/页</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'change'])

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
  emit('change', page)
}

const onPageSizeChange = (value) => {
  emit('update:pageSize', parseInt(value))
  emit('update:currentPage', 1)
  emit('change', 1)
}
</script>
