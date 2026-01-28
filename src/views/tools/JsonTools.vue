<template>
  <div class="json-tools-page">
    <!-- 内容区 -->
    <div class="tools-content">
      <!-- 格式化工具 -->
      <JsonFormatter v-show="activeTab === 'formatter'" ref="formatterRef" />

      <!-- 比对工具 -->
      <JsonComparator v-show="activeTab === 'comparator'" ref="comparatorRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
// 导入的图标现在在MainLayout.vue中使用，这里不再需要
import JsonFormatter from './JsonFormatter.vue'
import JsonComparator from './JsonComparator.vue'

const route = useRoute()
const activeTab = ref('formatter')
const formatterRef = ref<InstanceType<typeof JsonFormatter> | null>(null)
const comparatorRef = ref<InstanceType<typeof JsonComparator> | null>(null)

// 从URL查询参数中获取激活的标签页
onMounted(() => {
  const tab = route.query.tab
  if (tab === 'formatter' || tab === 'comparator') {
    activeTab.value = tab as string
  }
})

// 监听MainLayout.vue中的标签页变化
const props = defineProps<{
  activeTab?: string
}>()

watch(() => props.activeTab, (newTab) => {
  if (newTab === 'formatter' || newTab === 'comparator') {
    activeTab.value = newTab
  }
})

// 显示示例数据
const showExamples = () => {
  if (activeTab.value === 'formatter') {
    if (formatterRef.value && 'loadExample' in formatterRef.value) {
      ;(formatterRef.value as any).loadExample()
    }
  } else if (activeTab.value === 'comparator') {
    if (comparatorRef.value && 'loadExample' in comparatorRef.value) {
      ;(comparatorRef.value as any).loadExample()
    }
  }
}

// 清空内容
const clearAll = () => {
  if (activeTab.value === 'formatter') {
    if (formatterRef.value && 'clearAll' in formatterRef.value) {
      ;(formatterRef.value as any).clearAll()
    }
  } else if (activeTab.value === 'comparator') {
    if (comparatorRef.value && 'clearAll' in comparatorRef.value) {
      ;(comparatorRef.value as any).clearAll()
    }
  }
}

// 暴露事件给MainLayout.vue
defineExpose({
  showExamples,
  clearAll
})
</script>

<style scoped lang="scss">
.json-tools-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
}

// ========== 内容区 ==========
.tools-content {
  flex: 1;
  overflow: hidden;
  padding: 24px;
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .tools-content {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  // 移动端按钮优化 - 使用:deep()穿透scoped
  :deep(.el-button) {
    height: 44px !important;
    min-height: 44px !important;
    font-size: 16px !important;
  }

  // 移动端文本域优化
  :deep(.el-textarea__inner) {
    font-size: 16px !important;
  }

  // 移动端按钮组优化
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;

    :deep(.el-button) {
      width: 100%;
    }
  }

  // 案例列表按钮组
  .case-buttons {
    :deep(.el-button) {
      height: 44px !important;
      min-height: 44px !important;
      font-size: 16px !important;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .tools-content {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  :deep(.el-button) {
    height: 44px !important;
    font-size: 15px !important;
  }

  :deep(.el-textarea__inner) {
    font-size: 15px !important;
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .tools-content {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
