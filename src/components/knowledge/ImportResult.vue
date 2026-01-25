<template>
  <div class="import-result">
    <!-- 成功图标 -->
    <div class="result-icon">
      <el-icon :size="80" color="#67C23A">
        <CircleCheck />
      </el-icon>
    </div>

    <!-- 统计信息 -->
    <div class="result-stats">
      <h3>导入完成！</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ result.successCount }}</div>
          <div class="stat-label">成功</div>
        </div>
        <div class="stat-item" v-if="result.failureCount > 0">
          <div class="stat-value failure">{{ result.failureCount }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatDuration(result.duration) }}</div>
          <div class="stat-label">耗时</div>
        </div>
      </div>
    </div>

    <!-- 失败文件列表 -->
    <div v-if="result.failureCount > 0" class="failed-files">
      <h4>失败文件：</h4>
      <el-scrollbar max-height="200px">
        <ul class="failed-list">
          <li v-for="(file, index) in result.failedFiles" :key="index">
            {{ file }}
          </li>
        </ul>
      </el-scrollbar>
    </div>

    <!-- 知识库信息 -->
    <div class="kb-info">
      <p>已导入到知识库：<strong>{{ result.kbTitle }}</strong></p>
    </div>

    <!-- 操作按钮 -->
    <div class="result-actions">
      <el-button type="primary" @click="handleConfirm" size="large">
        查看知识库
      </el-button>
      <el-button @click="handleClose" size="large">
        关闭
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleCheck } from '@element-plus/icons-vue'
import type { ImportResult } from '@/api/knowledge'

interface Props {
  result: ImportResult
}

interface Emits {
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 格式化耗时
const formatDuration = (ms: number) => {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else {
    return `${(ms / 60000).toFixed(1)}m`
  }
}

// 确认
const handleConfirm = () => {
  emit('confirm')
}

// 关闭
const handleClose = () => {
  // 关闭对话框由父组件处理
}
</script>

<style scoped>
.import-result {
  text-align: center;
  padding: 20px 0;
}

.result-icon {
  margin-bottom: 20px;
}

.result-stats h3 {
  font-size: 20px;
  color: #303133;
  margin-bottom: 20px;
}

.stats-grid {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.stat-value.failure {
  color: #F56C6C;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.failed-files {
  text-align: left;
  margin-bottom: 30px;
  padding: 15px;
  background: #FDF6EC;
  border-radius: 4px;
}

.failed-files h4 {
  font-size: 14px;
  color: #E6A23C;
  margin: 0 0 10px 0;
}

.failed-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #606266;
}

.failed-list li {
  margin-bottom: 5px;
}

.kb-info {
  margin-bottom: 30px;
  font-size: 15px;
  color: #606266;
}

.kb-info strong {
  color: #409EFF;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
