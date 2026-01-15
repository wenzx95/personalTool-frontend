<template>
  <div class="json-comparator">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">JSON 比对工具</h1>
        <p class="page-subtitle">对比两个 JSON 数据，高亮显示差异</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <el-button-group>
        <el-button type="primary" @click="compareJson">
          <el-icon><Document /></el-icon>
          比对
        </el-button>
        <el-button @click="clearAll">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </el-button-group>

      <div class="toolbar-right">
        <el-button @click="copyResult">
          <el-icon><CopyDocument /></el-icon>
          复制结果
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Panel - Original JSON -->
      <div class="panel left-panel">
        <div class="panel-header">
          <span class="panel-title">原始 JSON</span>
          <el-tag v-if="isLeftValid" type="success" size="small">JSON 有效</el-tag>
          <el-tag v-else-if="leftJson.trim()" type="danger" size="small">JSON 无效</el-tag>
        </div>
        <div class="panel-body input-body">
          <el-input
            v-model="leftJson"
            type="textarea"
            placeholder="在此粘贴或输入原始 JSON 字符串..."
            @input="validateLeftJson"
          />
        </div>
        <div v-if="leftErrorMessage" class="error-message">
          <el-icon><Warning /></el-icon>
          <span>{{ leftErrorMessage }}</span>
        </div>
      </div>

      <!-- Center Panel - Differences -->
      <div class="panel center-panel">
        <div class="panel-header">
          <span class="panel-title">差异</span>
          <el-tag v-if="hasDifferences" type="warning" size="small">{{ differenceCount }} 处差异</el-tag>
          <el-tag v-else-if="compared" type="success" size="small">完全一致</el-tag>
        </div>
        <div class="panel-body diff-body">
          <div v-if="compared && !hasDifferences" class="no-differences">
            <el-icon><Check /></el-icon>
            <span>两个 JSON 完全一致</span>
          </div>
          <div v-else-if="differences.length > 0" class="diff-content">
            <div
              v-for="(diff, index) in differences"
              :key="index"
              class="diff-item"
              :class="getDiffTypeClass(diff.type)"
            >
              <div class="diff-type">
                <el-icon v-if="diff.type === 'added'"><Plus /></el-icon>
                <el-icon v-if="diff.type === 'removed'"><Minus /></el-icon>
                <el-icon v-if="diff.type === 'modified'"><Edit /></el-icon>
                {{ getDiffTypeText(diff.type) }}
              </div>
              <div class="diff-path">{{ diff.path }}</div>
              <div v-if="diff.type === 'added'" class="diff-value">
                <span class="label">新增值：</span>
                <span class="value">{{ stringifyValue(diff.newValue) }}</span>
              </div>
              <div v-if="diff.type === 'removed'" class="diff-value">
                <span class="label">删除值：</span>
                <span class="value">{{ stringifyValue(diff.oldValue) }}</span>
              </div>
              <div v-if="diff.type === 'modified'" class="diff-value">
                <span class="label">旧值：</span>
                <span class="value old-value">{{ stringifyValue(diff.oldValue) }}</span>
                <span class="label">新值：</span>
                <span class="value new-value">{{ stringifyValue(diff.newValue) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-diff">
            <el-icon><Document /></el-icon>
            <span>点击"比对"按钮查看差异</span>
          </div>
        </div>
      </div>

      <!-- Right Panel - Modified JSON -->
      <div class="panel right-panel">
        <div class="panel-header">
          <span class="panel-title">修改后的 JSON</span>
          <el-tag v-if="isRightValid" type="success" size="small">JSON 有效</el-tag>
          <el-tag v-else-if="rightJson.trim()" type="danger" size="small">JSON 无效</el-tag>
        </div>
        <div class="panel-body input-body">
          <el-input
            v-model="rightJson"
            type="textarea"
            placeholder="在此粘贴或输入修改后的 JSON 字符串..."
            @input="validateRightJson"
          />
        </div>
        <div v-if="rightErrorMessage" class="error-message">
          <el-icon><Warning /></el-icon>
          <span>{{ rightErrorMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="options-section">
      <el-space>
        <span class="option-label">显示格式：</span>
        <el-radio-group v-model="displayFormat" size="small">
          <el-radio-button :label="'tree'">树形视图</el-radio-button>
          <el-radio-button :label="'text'">文本视图</el-radio-button>
        </el-radio-group>
      </el-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Delete,
  CopyDocument,
  Warning,
  Check,
  Plus,
  Minus,
  Edit
} from '@element-plus/icons-vue'

// ========== State ==========
const leftJson = ref('')
const rightJson = ref('')
const leftErrorMessage = ref('')
const rightErrorMessage = ref('')
const isLeftValid = ref(false)
const isRightValid = ref(false)
const differences = ref<any[]>([])
const compared = ref(false)
const displayFormat = ref('tree')

// ========== Utilities ==========
const parseInput = (input: string): any => {
  try {
    return JSON.parse(input)
  } catch {
    try {
      return new Function('return ' + input)()
    } catch {
      throw new Error('无效的 JSON/JavaScript 对象格式')
    }
  }
}

const stringifyValue = (value: any): string => {
  return JSON.stringify(value, null, 2)
}

// ========== Validation ==========
const validateLeftJson = () => {
  if (!leftJson.value.trim()) {
    isLeftValid.value = false
    leftErrorMessage.value = ''
    return false
  }

  try {
    parseInput(leftJson.value)
    isLeftValid.value = true
    leftErrorMessage.value = ''
    return true
  } catch (error: any) {
    isLeftValid.value = false
    leftErrorMessage.value = error.message
    return false
  }
}

const validateRightJson = () => {
  if (!rightJson.value.trim()) {
    isRightValid.value = false
    rightErrorMessage.value = ''
    return false
  }

  try {
    parseInput(rightJson.value)
    isRightValid.value = true
    rightErrorMessage.value = ''
    return true
  } catch (error: any) {
    isRightValid.value = false
    rightErrorMessage.value = error.message
    return false
  }
}

// ========== Comparison ==========
const compareJson = () => {
  if (!validateLeftJson() || !validateRightJson()) {
    ElMessage.warning('请检查 JSON 格式')
    return
  }

  try {
    const leftData = parseInput(leftJson.value)
    const rightData = parseInput(rightJson.value)
    differences.value = compareObjects(leftData, rightData)
    compared.value = true
    ElMessage.success('比对成功')
  } catch (error: any) {
    ElMessage.error('比对失败: ' + error.message)
  }
}

const compareObjects = (obj1: any, obj2: any, path: string = ''): any[] => {
  const diffs: any[] = []

  // 检查类型是否相同
  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      type: 'modified',
      path: path,
      oldValue: obj1,
      newValue: obj2
    })
    return diffs
  }

  // 检查是否为数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // 比较数组长度
    if (obj1.length !== obj2.length) {
      diffs.push({
        type: 'modified',
        path: path,
        oldValue: obj1,
        newValue: obj2
      })
    } else {
      // 比较数组元素
      for (let i = 0; i < obj1.length; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`
        diffs.push(...compareObjects(obj1[i], obj2[i], itemPath))
      }
    }
    return diffs
  }

  // 检查是否为对象
  if (obj1 !== null && typeof obj1 === 'object' && obj2 !== null && typeof obj2 === 'object') {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    for (const key of allKeys) {
      const itemPath = path ? `${path}.${key}` : key
      if (key in obj1 && key in obj2) {
        diffs.push(...compareObjects(obj1[key], obj2[key], itemPath))
      } else if (key in obj1) {
        diffs.push({
          type: 'removed',
          path: itemPath,
          oldValue: obj1[key]
        })
      } else {
        diffs.push({
          type: 'added',
          path: itemPath,
          newValue: obj2[key]
        })
      }
    }
    return diffs
  }

  // 比较原始值
  if (obj1 !== obj2) {
    diffs.push({
      type: 'modified',
      path: path,
      oldValue: obj1,
      newValue: obj2
    })
  }

  return diffs
}

const getDiffTypeClass = (type: string): string => {
  switch (type) {
    case 'added':
      return 'diff-added'
    case 'removed':
      return 'diff-removed'
    case 'modified':
      return 'diff-modified'
    default:
      return ''
  }
}

const getDiffTypeText = (type: string): string => {
  switch (type) {
    case 'added':
      return '新增'
    case 'removed':
      return '删除'
    case 'modified':
      return '修改'
    default:
      return '未知'
  }
}

// ========== Actions ==========
const clearAll = () => {
  leftJson.value = ''
  rightJson.value = ''
  leftErrorMessage.value = ''
  rightErrorMessage.value = ''
  isLeftValid.value = false
  isRightValid.value = false
  differences.value = []
  compared.value = false
}

const copyResult = async () => {
  if (!compared.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }

  const result = differences.value.map(diff => {
    return `${getDiffTypeText(diff.type)} ${diff.path} ${stringifyValue(diff.oldValue)} ${stringifyValue(diff.newValue)}`
  }).join('\n')

  try {
    await navigator.clipboard.writeText(result)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = result
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()

    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }

    document.body.removeChild(textarea)
  }
}

// ========== Computed ==========
const hasDifferences = computed(() => {
  return differences.value.length > 0
})

const differenceCount = computed(() => {
  return differences.value.length
})
</script>

<style scoped lang="scss">
.json-comparator {
  width: 100%;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  box-sizing: border-box;
  overflow: hidden;
}

.page-header {
  flex-shrink: 0;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.toolbar-right {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-md);
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.panel-body {
  flex: 1;
  padding: var(--spacing-sm);
  overflow: hidden;
  min-height: 0;
}

.input-body {
  display: flex;
  flex-direction: column;
  padding: 0;
  height: 100%;

  :deep(.el-textarea) {
    flex: 1;
    display: flex;
    height: 100%;
  }

  :deep(.el-textarea__inner) {
    height: 100% !important;
    resize: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

.diff-body {
  background: #f8f9fa;
  border-radius: var(--radius-md);
  overflow: auto;
  height: 100%;
}

.diff-content {
  padding: var(--spacing-sm);
}

.diff-item {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  transition: all 0.2s;

  &:hover {
    background: var(--color-bg-secondary);
  }

  &.diff-added {
    border-left: 4px solid #10b981;
  }

  &.diff-removed {
    border-left: 4px solid #ef4444;
  }

  &.diff-modified {
    border-left: 4px solid #f59e0b;
  }
}

.diff-type {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);

  .el-icon {
    margin-right: 4px;
  }
}

.diff-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-secondary);
}

.diff-value {
  display: flex;
  flex-direction: column;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;

  .label {
    margin-right: 4px;
    color: var(--color-text-secondary);
  }

  .value {
    color: var(--color-text-primary);
  }

  .old-value {
    color: #ef4444;
  }

  .new-value {
    color: #10b981;
  }
}

.no-differences {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-tertiary);
  gap: var(--spacing-sm);

  .el-icon {
    font-size: 48px;
    opacity: 0.5;
  }
}

.empty-diff {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-tertiary);
  gap: var(--spacing-sm);

  .el-icon {
    font-size: 48px;
    opacity: 0.5;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: var(--radius-sm);
  color: #cf1322;
  font-size: 13px;
}

.options-section {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .el-button-group {
    width: 100%;
    .el-button {
      flex: 1;
    }
  }
}
</style>