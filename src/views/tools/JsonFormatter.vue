<template>
  <div class="json-formatter">
    <!-- Toolbar -->
    <div class="toolbar">
      <el-button-group>
        <el-button type="primary" @click="formatJson" :loading="processing">
          <el-icon><Document /></el-icon>
          {{ processing ? (processingDetail || '处理中...') : '格式化' }}
        </el-button>
        <el-button @click="deepFormatJson" :loading="processing">
          <el-icon><MagicStick /></el-icon>
          {{ processing ? (processingDetail || '处理中...') : '深度格式化' }}
        </el-button>
        <el-button @click="compressJson" :loading="processing">
          <el-icon><FolderOpened /></el-icon>
          压缩
        </el-button>
      </el-button-group>

      <el-button-group v-if="parsedData">
        <el-button @click="viewMode = 'tree'" :type="viewMode === 'tree' ? 'primary' : ''">
          <el-icon><List /></el-icon>
          树视图
        </el-button>
        <el-button @click="viewMode = 'code'" :type="viewMode === 'code' ? 'primary' : ''">
          <el-icon><Document /></el-icon>
          代码视图
        </el-button>
      </el-button-group>

      <el-button-group v-if="parsedData && viewMode === 'tree'">
        <el-button @click="expandAll">
          <el-icon><ArrowDown /></el-icon>
          全展开
        </el-button>
        <el-button @click="collapseAll">
          <el-icon><ArrowUp /></el-icon>
          全折叠
        </el-button>
      </el-button-group>

      <div class="toolbar-right">
        <el-button @click="saveCase" :disabled="!parsedData">
          <el-icon><FolderAdd /></el-icon>
          保存案例
        </el-button>
        <el-button @click="updateSelectedCase" :disabled="!selectedCase || !parsedData">
          <el-icon><Document /></el-icon>
          更新案例
        </el-button>
        <el-button @click="clearAll">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button @click="copyResult" :disabled="!parsedData">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'left-collapsed': leftPanelCollapsed }">
      <!-- Cases Panel (Leftmost) -->
      <div class="panel cases-panel">
        <div class="panel-header">
          <span class="panel-title">案例列表</span>
          <!-- 案例源切换 -->
          <div class="cases-source-switcher">
            <el-button-group>
              <el-button
                :type="casesSource === 'local' ? 'primary' : ''"
                @click="casesSource = 'local'"
                size="small"
              >
                <el-icon><FolderOpened /></el-icon>
                本地
              </el-button>
              <el-button
                :type="casesSource === 'cloud' ? 'primary' : ''"
                @click="casesSource = 'cloud'"
                :disabled="!userStore.isLoggedIn"
                size="small"
              >
                <el-icon><Cloudy /></el-icon>
                云端
              </el-button>
            </el-button-group>
          </div>
        </div>
        <div class="panel-body cases-body">
          <div v-if="currentCaseList.length === 0" class="empty-cases">
            <el-icon><FolderOpened /></el-icon>
            <span>暂无保存的案例</span>
          </div>
          <div v-else class="cases-list">
            <div
              v-for="item in currentCaseList"
              :key="casesSource === 'local' ? item.id : item.id"
              :class="['case-item', { active: selectedCaseId === (casesSource === 'local' ? item.id : item.id) }]"
              @click="loadCase(item)"
            >
              <div class="case-item-content">
                <el-icon class="case-icon"><Document /></el-icon>
                <el-tooltip :content="item.name" placement="top" :show-after="500">
                  <span class="case-name">{{ item.name }}</span>
                </el-tooltip>
              </div>
              <div class="case-item-actions">
                <!-- 本地案例操作 -->
                <template v-if="casesSource === 'local'">
                  <el-button
                    link
                    size="small"
                    @click.stop="localToCloud(item)"
                    :disabled="!userStore.isLoggedIn"
                    title="保存到云端"
                  >
                    <el-icon><Upload /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="updateCase(item.id)"
                    title="更新"
                  >
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="renameCase(item.id)"
                    title="重命名"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="deleteLocalCase(item.id)"
                    title="删除"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
                <!-- 云端案例操作 -->
                <template v-if="casesSource === 'cloud'">
                  <el-button
                    link
                    size="small"
                    @click.stop="cloudToLocal(item)"
                    title="保存到本地"
                  >
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="updateCase(item.id)"
                    title="更新"
                  >
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="renameCase(item.id)"
                    title="重命名"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="deleteCloudCase(item.id)"
                    title="删除"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Expand Button (when collapsed) -->
      <div v-if="leftPanelCollapsed" class="expand-button" @click="leftPanelCollapsed = false" title="展开原始 JSON">
        <el-icon><DArrowRight /></el-icon>
      </div>

      <!-- Left Panel - Input -->
      <div class="panel left-panel">
        <div class="panel-header">
          <span class="panel-title">原始 JSON</span>
          <div class="panel-header-right">
            <el-tag v-if="isValid" type="success" size="small">JSON 有效</el-tag>
            <el-tag v-else-if="inputJson.trim()" type="danger" size="small">JSON 无效</el-tag>
            <el-button
              link
              size="small"
              @click="leftPanelCollapsed = !leftPanelCollapsed"
              class="collapse-button"
              title="收缩/展开"
            >
              <el-icon>
                <DArrowLeft v-if="!leftPanelCollapsed" />
                <DArrowRight v-else />
              </el-icon>
            </el-button>
          </div>
        </div>
        <div class="panel-body input-body">
          <el-input
            v-model="inputJson"
            type="textarea"
            placeholder="在此粘贴或输入 JSON 字符串...&#10;支持非标准格式，如：{1:'hellop'} 或 {name:'test',}"
            @input="debouncedValidate"
            @blur="handleInputBlur"
          />
        </div>
        <div v-if="errorMessage" class="error-message">
          <el-icon><Warning /></el-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Right Panel - Output -->
      <template v-if="parsedData">
        <div class="panel right-panel">
          <div class="panel-header">
            <span class="panel-title">格式化结果</span>
            <el-tag type="info" size="small">{{ getStats() }}</el-tag>
          </div>

          <!-- Tree View -->
          <div v-if="viewMode === 'tree'" class="panel-body output-body tree-view">
            <JsonTreeNode
              :data="parsedData"
              :path="[]"
              :expanded="expandedNodes"
              @toggle-expand="toggleExpand"
              @update-value="updateValue"
              @update-key="updateKey"
              @delete-node="deleteNode"
              @add-item="addItem"
              @copy-node="copyNode"
            />
          </div>

          <!-- Code View -->
          <div v-else class="panel-body output-body">
            <div v-if="highlightedOutput.truncated" class="truncated-notice">
              <el-icon><Warning /></el-icon>
              内容过长，只显示前 {{ MAX_CODE_VIEW_LINES }} 行（共 {{ highlightedOutput.remaining + MAX_CODE_VIEW_LINES }} 行）
              <el-button link @click="viewMode = 'tree'">切换到树视图</el-button>
            </div>
            <pre v-html="highlightedOutput.html"></pre>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <template v-else>
        <div class="panel right-panel empty-panel">
          <div class="panel-body">
            <div class="empty-placeholder">
              <el-icon><Document /></el-icon>
              <span>点击"格式化"按钮查看结果</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Options -->
    <div v-if="parsedData" class="options-section">
      <el-space>
        <span class="option-label">缩进空格数：</span>
        <el-radio-group v-model="indentSpaces" size="small">
          <el-radio-button :label="2">2</el-radio-button>
          <el-radio-button :label="4">4</el-radio-button>
          <el-radio-button :label="8">8</el-radio-button>
        </el-radio-group>

        <el-divider direction="vertical" />

        <el-checkbox v-model="sortKeys" @change="applySort">排序对象键名</el-checkbox>
      </el-space>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  FolderOpened,
  FolderAdd,
  Delete,
  CopyDocument,
  Warning,
  List,
  ArrowDown,
  ArrowUp,
  DArrowLeft,
  DArrowRight,
  MagicStick,
  Edit,
  DataLine,
  Files,
  Clock,
  Cloudy,
  Upload,
  Download
} from '@element-plus/icons-vue'
import JsonTreeNode from '@/components/JsonTreeNode.vue'
import { useUserStore } from '@/stores/user'
import { useUserData } from '@/hooks/useUserData'

// 用户状态管理
const userStore = useUserStore()

// 通用数据管理 Hook（云端）
const {
  dataList: cloudCases,
  loadDataList: loadCloudCases,
  saveData,
  updateData: updateCloudData,
  deleteData: deleteCloudData
} = useUserData('json-formatter')

// ========== Utilities ==========
// 防抖函数实现
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// ========== Constants ==========
const LOCAL_STORAGE_KEY = 'json-cases'
const MAX_CODE_VIEW_LINES = 1000  // 代码视图最多显示 1000 行
const MAX_EXPAND_NODES = 500  // 全展开操作最大节点数警告阈值

// ========== Types ==========
interface LocalSavedCase {
  id: string | number
  name: string
  data: any
  createdAt?: number
  createTime?: string
}

type ViewMode = 'tree' | 'code'

// ========== State ==========
const inputJson = ref('')
const outputJson = ref('')
const errorMessage = ref('')
const isValid = ref(false)
const processing = ref(false)
const processingDetail = ref('')
const indentSpaces = ref(2)
const sortKeys = ref(false)
const viewMode = ref<ViewMode>('tree')
const parsedData = ref<any>(null)
const expandedNodes = ref<Set<string>>(new Set())
const leftPanelCollapsed = ref(false)
const isCompressed = ref(false)  // 标记是否为压缩模式
const formatTime = ref(0)  // 格式化用时（毫秒）

// 本地案例
const localCases = ref<LocalSavedCase[]>([])
const casesSource = ref<'local' | 'cloud'>('local')
const selectedCaseId = ref<string | number | null>(null)

// 当前案例列表（根据案例源切换）
const currentCaseList = computed(() => {
  return casesSource.value === 'local' ? localCases.value : cloudCases.value
})

// 当前选中的案例
const selectedCase = computed(() => {
  if (!selectedCaseId.value) return null
  if (casesSource.value === 'local') {
    return localCases.value.find(item => item.id === selectedCaseId.value) || null
  } else {
    return cloudCases.value.find(item => item.id === selectedCaseId.value) || null
  }
})

// ========== Utilities ==========
// 解析 JSON/JavaScript 对象（支持非标准格式）
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

// 添加所有路径到展开集合（支持深度限制）
const addAllPathsToSet = (
  obj: any,
  path: string[] = [],
  set: Set<string> = new Set(),
  maxDepth: number = 2  // 默认只展开 2 层
): Set<string> => {
  const key = path.length > 0 ? path.join('-') : 'root'

  // 只展开到指定深度
  if (path.length < maxDepth && (path.length === 0 || (typeof obj === 'object' && obj !== null))) {
    set.add(key)
  }

  // 达到深度限制，停止递归
  if (path.length >= maxDepth) return set

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      // 如果数组项是对象或数组，并且当前深度小于 maxDepth - 1，那么需要多展开一层
      // 这样用户可以看到数组项的详细内容，而不是只看到索引
      if (typeof item === 'object' && item !== null) {
        addAllPathsToSet(item, [...path, index.toString()], set, maxDepth)
      }
    })
  } else if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        addAllPathsToSet(obj[key], [...path, key], set, maxDepth)
      }
    })
  }

  return set
}

// 计算对象中的所有节点数量
const countNodes = (obj: any): number => {
  let count = 0

  const traverse = (item: any) => {
    count++

    if (Array.isArray(item)) {
      item.forEach(traverse)
    } else if (item !== null && typeof item === 'object') {
      Object.values(item).forEach(traverse)
    }
  }

  traverse(obj)
  return count
}

// 深拷贝对象
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

// ========== Local Case Management ==========
const loadLocalCases = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      localCases.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载本地案例失败:', error)
  }
}

const saveLocalCasesToStorage = () => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localCases.value))
  } catch (error) {
    console.error('保存本地案例失败:', error)
    ElMessage.error('保存失败，可能是存储空间不足')
  }
}

const saveLocalCase = () => {
  if (!parsedData.value) {
    ElMessage.warning('没有可保存的内容')
    return
  }

  const defaultName = `案例 ${localCases.value.length + 1}`

  ElMessageBox.prompt('请输入案例名称', '保存案例', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: defaultName,
    inputPattern: /.+/,
    inputErrorMessage: '案例名称不能为空'
  }).then(({ value }) => {
    const newCase: LocalSavedCase = {
      id: Date.now().toString(),
      name: value,
      data: deepClone(parsedData.value),
      createdAt: Date.now()
    }

    localCases.value.push(newCase)
    saveLocalCasesToStorage()
    selectedCaseId.value = newCase.id
    ElMessage.success('案例已保存到本地')
  }).catch(() => {})
}

const updateLocalCase = (id: string) => {
  if (!parsedData.value) {
    ElMessage.warning('没有可更新的内容')
    return
  }

  const caseItem = localCases.value.find(c => c.id === id)
  if (!caseItem) return

  ElMessageBox.confirm(`确定要更新案例"${caseItem.name}"吗？`, '更新案例', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    caseItem.data = deepClone(parsedData.value)
    saveLocalCasesToStorage()
    ElMessage.success('案例更新成功')
  }).catch(() => {})
}

const deleteLocalCase = (id: string | number) => {
  ElMessageBox.confirm('确定要删除这个案例吗？', '删除案例', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = localCases.value.findIndex(c => c.id === id)
    if (index > -1) {
      localCases.value.splice(index, 1)
      saveLocalCasesToStorage()
      if (selectedCaseId.value === id) {
        selectedCaseId.value = null
      }
      ElMessage.success('案例已删除')
    }
  }).catch(() => {})
}

const renameLocalCase = (id: string) => {
  const caseItem = localCases.value.find(c => c.id === id)
  if (!caseItem) return

  ElMessageBox.prompt('请输入新的案例名称', '重命名案例', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: caseItem.name,
    inputPattern: /.+/,
    inputErrorMessage: '案例名称不能为空'
  }).then(({ value }) => {
    caseItem.name = value
    saveLocalCasesToStorage()
    ElMessage.success('重命名成功')
  }).catch(() => {})
}

// ========== Cloud Case Management ==========
const saveCloudCase = async () => {
  if (!parsedData.value) {
    ElMessage.warning('没有可保存的内容')
    return
  }

  const defaultName = `案例 ${cloudCases.value.length + 1}`

  ElMessageBox.prompt('请输入案例名称', '保存案例', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: defaultName,
    inputPattern: /.+/,
    inputErrorMessage: '案例名称不能为空'
  }).then(async ({ value }) => {
    try {
      const response = await saveData({
        name: value,
        data: deepClone(parsedData.value),
        remarks: 'JSON格式化工具案例'
      })
      if (response) {
        selectedCaseId.value = response.id
      }
      ElMessage.success('案例已保存到云端')
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    }
  }).catch(() => {})
}

const updateCloudCase = async (id: number) => {
  if (!parsedData.value) {
    ElMessage.warning('没有可更新的内容')
    return
  }

  const caseItem = cloudCases.value.find(c => c.id === id)
  if (!caseItem) return

  ElMessageBox.confirm(`确定要更新案例"${caseItem.name}"吗？`, '更新案例', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await updateCloudData(id, {
        data: deepClone(parsedData.value)
      })
      ElMessage.success('案例更新成功')
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败')
    }
  }).catch(() => {})
}

const deleteCloudCase = async (id: string | number) => {
  ElMessageBox.confirm('确定要删除这个案例吗？', '删除案例', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteCloudData(Number(id))
      if (selectedCaseId.value === id) {
        selectedCaseId.value = null
      }
      ElMessage.success('案例已删除')
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

const renameCloudCase = async (id: number) => {
  const caseItem = cloudCases.value.find(c => c.id === id)
  if (!caseItem) return

  ElMessageBox.prompt('请输入新的案例名称', '重命名案例', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: caseItem.name,
    inputPattern: /.+/,
    inputErrorMessage: '案例名称不能为空'
  }).then(async ({ value }) => {
    try {
      await updateCloudData(id, {
        name: value
      })
      ElMessage.success('重命名成功')
    } catch (error: any) {
      ElMessage.error(error.message || '重命名失败')
    }
  }).catch(() => {})
}

// ========== Case Conversion ==========
const localToCloud = async (caseItem: LocalSavedCase) => {
  try {
    await saveData({
      name: caseItem.name,
      data: caseItem.data,
      remarks: '本地案例转云端'
    })
    ElMessage.success('案例已保存到云端')
  } catch (error: any) {
    ElMessage.error(error.message || '保存到云端失败')
  }
}

const cloudToLocal = async (caseItem: any) => {
  const newCase: LocalSavedCase = {
    id: Date.now().toString(),
    name: caseItem.name,
    data: caseItem.data,
    createdAt: new Date(caseItem.createTime).getTime()
  }

  localCases.value.push(newCase)
  saveLocalCasesToStorage()
  ElMessage.success('案例已保存到本地')
}

// ========== Case Management Wrappers ==========
const saveCase = () => {
  if (casesSource.value === 'local') {
    saveLocalCase()
  } else {
    saveCloudCase()
  }
}

const updateCase = (id: string | number) => {
  if (casesSource.value === 'local') {
    updateLocalCase(id as string)
  } else {
    updateCloudCase(id as number)
  }
}

const renameCase = (id: string | number) => {
  if (casesSource.value === 'local') {
    renameLocalCase(id as string)
  } else {
    renameCloudCase(id as number)
  }
}

const loadCase = (item: any) => {
  if (!item) return
  try {
    parsedData.value = deepClone(item.data)
    selectedCaseId.value = casesSource.value === 'local' ? item.id : item.id
    inputJson.value = JSON.stringify(item.data, null, indentSpaces.value)
    errorMessage.value = ''
    isValid.value = true
    expandedNodes.value = new Set()
    ElMessage.success(`已加载案例: ${item.name}`)
  } catch (error: any) {
    ElMessage.error('加载案例失败: ' + error.message)
  }
}

const updateSelectedCase = () => {
  if (!selectedCaseId.value) {
    ElMessage.warning('请先选择要更新的案例')
    return
  }
  updateCase(selectedCaseId.value)
}

// Initialize cases
loadLocalCases()

// 登录后自动加载云端案例
watch(() => userStore.isLoggedIn, (newVal) => {
  if (newVal && casesSource.value === 'cloud') {
    loadCloudCases()
  }
})

// 监听案例源切换
watch(casesSource, (newSource) => {
  selectedCaseId.value = null
  if (newSource === 'cloud' && userStore.isLoggedIn) {
    loadCloudCases()
  }
})

// ========== JSON Operations ==========
const validateJson = () => {
  if (!inputJson.value.trim()) {
    isValid.value = false
    errorMessage.value = ''
    return false
  }

  try {
    parseInput(inputJson.value)
    isValid.value = true
    errorMessage.value = ''
    return true
  } catch (error: any) {
    isValid.value = false
    errorMessage.value = error.message
    return false
  }
}

// 防抖的验证函数（300ms 延迟）
const debouncedValidate = debounce(() => {
  validateJson()
}, 300)

// 处理输入框失去焦点事件 - 自动格式化
const handleInputBlur = async () => {
  // 只有当内容有效且没有被格式化过时才自动格式化
  if (!inputJson.value.trim() || !isValid.value) {
    return
  }

  try {
    // 检查是否已经是格式化的JSON（包含换行符）
    const isFormatted = inputJson.value.includes('\n')

    // 如果还没有格式化，自动格式化
    if (!isFormatted) {
      const parsed = parseInput(inputJson.value)

      // 更新输入框为格式化后的JSON
      inputJson.value = JSON.stringify(parsed, null, indentSpaces.value)

      // 如果还没有解析后的数据，则显示树视图
      if (!parsedData.value) {
        parsedData.value = parsed
        viewMode.value = 'tree'
        expandedNodes.value = addAllPathsToSet(parsed, [], new Set(), 2)
      }
    }
  } catch (error) {
    // 格式化失败时不做处理，保留原内容
    console.warn('自动格式化失败:', error)
  }
}

// 按需更新输入框（防抖 500ms）
const updateInputJson = debounce(() => {
  if (parsedData.value) {
    // 使用 requestAnimationFrame 避免阻塞 UI
    requestAnimationFrame(() => {
      inputJson.value = JSON.stringify(parsedData.value, null, indentSpaces.value)
    })
  }
}, 500)

const formatJson = async () => {
  if (!inputJson.value.trim()) {
    ElMessage.warning('请输入要格式化的内容')
    return
  }

  processing.value = true
  processingDetail.value = '正在解析...'

  const startTime = performance.now()

  try {
    // 让 UI 更新
    await nextTick()

    // 使用 setTimeout 避免 UI 阻塞
    await new Promise(resolve => setTimeout(resolve, 0))

    let parsed = parseInput(inputJson.value)

    processingDetail.value = '正在格式化...'
    await nextTick()

    if (sortKeys.value) {
      parsed = sortObjectKeys(parsed)
    }

    parsedData.value = parsed
    viewMode.value = 'tree'
    expandedNodes.value = addAllPathsToSet(parsed, [], new Set(), 2)  // 只展开 2 层

    // 同时更新原始JSON输入框
    inputJson.value = JSON.stringify(parsed, null, indentSpaces.value)
    errorMessage.value = ''
    isValid.value = true

    // 取消压缩模式
    isCompressed.value = false

    // 记录格式化时间
    const endTime = performance.now()
    formatTime.value = Math.round(endTime - startTime)

    ElMessage.success('格式化成功')
  } catch (error: any) {
    ElMessage.error('格式化失败: ' + error.message)
  } finally {
    processing.value = false
    processingDetail.value = ''
  }
}

const compressJson = async () => {
  if (!inputJson.value.trim()) {
    ElMessage.warning('请输入要压缩的内容')
    return
  }

  processing.value = true
  processingDetail.value = '正在解析...'
  try {
    await nextTick()

    // 使用 setTimeout 避免 UI 阻塞
    await new Promise(resolve => setTimeout(resolve, 0))

    const parsed = parseInput(inputJson.value)

    processingDetail.value = '正在压缩...'
    await nextTick()

    // 压缩后的JSON（单行）
    const compressed = JSON.stringify(parsed)

    // 更新左侧原始JSON输入框为压缩后的内容
    inputJson.value = compressed
    parsedData.value = parsed

    // 更新错误状态
    errorMessage.value = ''
    isValid.value = true

    // 设置压缩模式标志
    isCompressed.value = true

    // 切换到代码视图，并在代码视图中显示压缩后的内容
    viewMode.value = 'code'

    ElMessage.success('压缩成功')
  } catch (error: any) {
    ElMessage.error('压缩失败: ' + error.message)
  } finally {
    processing.value = false
    processingDetail.value = ''
  }
}

const deepFormatJson = async () => {
  if (!inputJson.value.trim()) {
    ElMessage.warning('请输入要格式化的内容')
    return
  }

  processing.value = true
  processingDetail.value = '正在解析...'
  try {
    await nextTick()

    // 使用 setTimeout 避免 UI 阻塞
    await new Promise(resolve => setTimeout(resolve, 0))

    let parsed = parseInput(inputJson.value)

    processingDetail.value = '正在深度格式化...'
    await nextTick()

    parsed = deepFormat(parsed)

    if (sortKeys.value) {
      parsed = sortObjectKeys(parsed)
    }

    parsedData.value = parsed
    viewMode.value = 'tree'
    expandedNodes.value = addAllPathsToSet(parsed, [], new Set(), 2)  // 只展开 2 层

    // 同时更新原始JSON输入框
    inputJson.value = JSON.stringify(parsed, null, indentSpaces.value)
    errorMessage.value = ''
    isValid.value = true

    // 取消压缩模式
    isCompressed.value = false

    ElMessage.success('深度格式化成功')
  } catch (error: any) {
    ElMessage.error('深度格式化失败: ' + error.message)
  } finally {
    processing.value = false
    processingDetail.value = ''
  }
}

// 深度格式化：递归处理所有值
const deepFormat = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(deepFormat)
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      result[key] = deepFormat(obj[key])
    }
    return result
  }

  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj)
      if (typeof parsed === 'object' && parsed !== null) {
        return deepFormat(parsed)
      }
      return parsed
    } catch {
      return obj
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
    }
  }

  return obj
}

const sortObjectKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = sortObjectKeys(obj[key])
        return result
      }, {})
  }
  return obj
}

const applySort = () => {
  if (!parsedData.value) return

  if (sortKeys.value) {
    parsedData.value = sortObjectKeys(parsedData.value)
  }
  ElMessage.success(sortKeys.value ? '已排序' : '已取消排序')
}

// ========== Display ==========
// JSON 语法高亮函数
const highlightJson = (json: string): string => {
  let html = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="json-string">$1</span>')
    .replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="json-boolean">$1</span>')
    .replace(/<span class="json-string">"([^"]+)"<\/span>(\s*:)/g, '<span class="json-key">"$1"</span>$2')
  return html
}

const getStats = () => {
  if (!parsedData.value) return ''

  try {
    const json = JSON.stringify(parsedData.value, null, indentSpaces.value)
    const size = new Blob([json]).size
    const sizeStr = size > 1024 ? `${(size / 1024).toFixed(2)} KB` : `${size} B`

    const countElements = (obj: any): number => {
      if (Array.isArray(obj)) return obj.length
      if (obj !== null && typeof obj === 'object') return Object.keys(obj).length
      return 1
    }

    return `${sizeStr} | ${countElements(parsedData.value)} 个元素`
  } catch {
    return ''
  }
}

const highlightedOutput = computed(() => {
  if (!parsedData.value) return { html: '', truncated: false, remaining: 0 }

  let json: string

  // 压缩模式下，直接使用 inputJson（已经是压缩后的单行）
  if (isCompressed.value) {
    json = inputJson.value
  } else {
    // 非压缩模式下，使用 parsedData 格式化显示
    json = JSON.stringify(parsedData.value, null, indentSpaces.value)
  }

  const lines = json.split('\n')

  // 如果超过最大行数，截断并显示提示
  if (lines.length > MAX_CODE_VIEW_LINES) {
    const truncated = lines.slice(0, MAX_CODE_VIEW_LINES).join('\n')
    const remaining = lines.length - MAX_CODE_VIEW_LINES
    return {
      html: highlightJson(truncated),
      truncated: true,
      remaining
    }
  }

  return {
    html: highlightJson(json),
    truncated: false,
    remaining: 0
  }
})

// ========== Tree Operations ==========
const toggleExpand = (path: string[]) => {
  const key = path.join('-')
  if (expandedNodes.value.has(key)) {
    // 折叠节点时，只需要删除当前节点的展开状态
    expandedNodes.value.delete(key)
  } else {
    // 展开节点时，添加当前节点的展开状态
    expandedNodes.value.add(key)

    // 如果节点深度大于0（不是根节点），并且是数组节点，自动展开其所有子节点（多展开一层）
    // 这样根节点的数组不会自动展开，避免显示过于复杂
    if (path.length > 0) {
      const targetNode = getNodeByPath(parsedData.value, path)
      if (Array.isArray(targetNode)) {
        targetNode.forEach((item, index) => {
          if (item !== null && typeof item === 'object') {
            const childPath = [...path, index.toString()]
            const childKey = childPath.join('-')
            expandedNodes.value.add(childKey)
          }
        })
      }
    }
  }
}

// 根据路径获取节点
const getNodeByPath = (data: any, path: string[]): any => {
  if (path.length === 0) return data

  let current = data
  for (const segment of path) {
    if (Array.isArray(current)) {
      const index = parseInt(segment)
      current = current[index]
    } else if (current !== null && typeof current === 'object') {
      current = current[segment]
    } else {
      return undefined
    }
  }
  return current
}

const expandAll = async () => {
  if (!parsedData.value) return

  // 计算节点数量
  const nodeCount = countNodes(parsedData.value)

  // 如果节点数超过阈值，显示警告
  if (nodeCount > MAX_EXPAND_NODES) {
    try {
      await ElMessageBox.confirm(
        `此 JSON 包含 ${nodeCount} 个节点，全部展开可能导致页面卡顿。是否继续？`,
        '全展开警告',
        {
          confirmButtonText: '继续展开',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      )
    } catch {
      // 用户取消操作
      return
    }
  }

  // 展开所有节点
  expandedNodes.value = addAllPathsToSet(parsedData.value, [], new Set(), Infinity)
  ElMessage.success('已全部展开')
}

const collapseAll = () => {
  expandedNodes.value = new Set(['root'])
}

// ========== Tree Editing ==========
const updateValue = ({ path, value }: { path: string[], value: any }) => {
  const updateNested = (obj: any, pathArr: string[], value: any): any => {
    if (pathArr.length === 0) return value

    const [first, ...rest] = pathArr

    if (Array.isArray(obj)) {
      const index = parseInt(first)
      if (rest.length === 0) {
        obj[index] = value
      } else {
        updateNested(obj[index], rest, value)
      }
    } else if (obj !== null && typeof obj === 'object') {
      if (rest.length === 0) {
        obj[first] = value
      } else {
        updateNested(obj[first], rest, value)
      }
    }

    return obj
  }

  parsedData.value = updateNested(parsedData.value, path, value)
  updateInputJson()  // 按需更新输入框
}

const updateKey = ({ path, oldKey, newKey }: { path: string[], oldKey: string, newKey: string }) => {
  if (oldKey === newKey || path.length === 0) return

  const parentPath = path.slice(0, -1)

  const renameKey = (obj: any, pathArr: string[]): any => {
    if (pathArr.length === 0) {
      if (obj !== null && typeof obj === 'object' && oldKey in obj) {
        const { [oldKey]: value, ...rest } = obj
        return { ...rest, [newKey]: value }
      }
      return obj
    }

    const [first, ...rest] = pathArr

    if (Array.isArray(obj)) {
      const index = parseInt(first)
      const newArray = [...obj]
      newArray[index] = renameKey(obj[index], rest)
      return newArray
    } else if (obj !== null && typeof obj === 'object') {
      return {
        ...obj,
        [first]: renameKey(obj[first], rest)
      }
    }

    return obj
  }

  parsedData.value = renameKey(parsedData.value, parentPath)
  updateInputJson()  // 按需更新输入框
}

const deleteNode = (path: string[]) => {
  const deleteNested = (obj: any, pathArr: string[]): any => {
    if (pathArr.length === 0) return null

    const [first, ...rest] = pathArr

    if (Array.isArray(obj)) {
      const index = parseInt(first)
      if (rest.length === 0) {
        obj.splice(index, 1)
      } else {
        deleteNested(obj[index], rest)
      }
    } else if (obj !== null && typeof obj === 'object') {
      if (rest.length === 0) {
        delete obj[first]
      } else {
        deleteNested(obj[first], rest)
      }
    }

    return obj
  }

  parsedData.value = deleteNested(parsedData.value, path)
  updateInputJson()  // 按需更新输入框
}

const addItem = (path: string[]) => {
  const addNested = (obj: any, pathArr: string[]): any => {
    if (pathArr.length === 0) return obj

    const [first, ...rest] = pathArr

    if (Array.isArray(obj)) {
      const index = parseInt(first)
      if (rest.length === 0) {
        obj.push('')
      } else {
        addNested(obj[index], rest)
      }
    } else if (obj !== null && typeof obj === 'object') {
      addNested(obj[first], rest)
    }

    return obj
  }

  parsedData.value = addNested(parsedData.value, path)
  updateInputJson()  // 按需更新输入框
}

// 复制节点
const copyNode = async ({ path: _path, data }: { path: string[], data: any }) => {
  try {
    let textToCopy: string

    // 如果是字符串，去除双引号后复制
    if (typeof data === 'string') {
      textToCopy = data
    } else {
      // 其他类型转换为 JSON 字符串
      textToCopy = JSON.stringify(data, null, 2)
    }

    // 复制到剪贴板
    await navigator.clipboard.writeText(textToCopy)
    ElMessage.success('节点已复制到剪贴板')
  } catch (error) {
    // 如果 clipboard API 不可用，使用传统方法
    try {
      let textToCopy: string

      // 如果是字符串，去除双引号后复制
      if (typeof data === 'string') {
        textToCopy = data
      } else {
        // 其他类型转换为 JSON 字符串
        textToCopy = JSON.stringify(data, null, 2)
      }

      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()

      document.execCommand('copy')
      ElMessage.success('节点已复制到剪贴板')

      document.body.removeChild(textarea)
    } catch {
      ElMessage.error('复制失败')
    }
  }
}

// ========== Actions ==========
const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  errorMessage.value = ''
  isValid.value = false
  parsedData.value = null
  expandedNodes.value = new Set()
  selectedCaseId.value = null
  leftPanelCollapsed.value = false
}

const copyResult = async () => {
  if (!parsedData.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }

  const json = JSON.stringify(parsedData.value, null, indentSpaces.value)

  try {
    await navigator.clipboard.writeText(json)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = json
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

// ========== Watchers ==========
// 深度监听已移除 - 改为按需更新以提升性能
// watch(parsedData, (newData) => {
//   if (newData) {
//     inputJson.value = JSON.stringify(newData, null, indentSpaces.value)
//   }
// }, { deep: true })

watch(indentSpaces, () => {
  if (parsedData.value && viewMode.value === 'code') {
    outputJson.value = JSON.stringify(parsedData.value, null, indentSpaces.value)
  }
})

// ========== 统计函数 ==========
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN')
}

const getDepth = (obj: any, depth = 1): number => {
  if (obj === null || obj === undefined) return depth
  if (typeof obj !== 'object') return depth

  let maxDepth = depth
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      maxDepth = Math.max(maxDepth, getDepth(item, depth + 1))
    })
  } else {
    Object.values(obj).forEach(value => {
      maxDepth = Math.max(maxDepth, getDepth(value, depth + 1))
    })
  }
  return maxDepth
}

// 加载示例数据
const loadExample = () => {
  const exampleJson = {
    "name": "张三",
    "age": 30,
    "isStudent": false,
    "courses": [
      "数学",
      "英语",
      "物理"
    ],
    "address": {
      "city": "北京",
      "district": "朝阳区",
      "street": "建国路"
    },
    "scores": {
      "math": 95,
      "english": 88,
      "physics": 92
    }
  }

  inputJson.value = JSON.stringify(exampleJson, null, 2)
  validateJson()
  ElMessage.success('已加载示例数据')
}

// 暴露方法给父组件
defineExpose({
  loadExample,
  clearAll
})
</script>

<style scoped lang="scss">
.json-formatter {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar-right {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.panel-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.main-content {
  display: grid;
  grid-template-columns: 220px 0.8fr 1.2fr;
  gap: var(--spacing-md);
  transition: all 0.3s ease;
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: hidden;

  &.left-collapsed {
    grid-template-columns: 220px 0 1fr;

    .left-panel {
      width: 0;
      min-width: 0;
      padding: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
    }
  }
}

.expand-button {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  width: 32px;
  height: 32px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--color-bg-secondary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-50%) scale(1.1);
  }

  .el-icon {
    font-size: 18px;
    color: var(--color-text-primary);
  }
}

.collapse-button {
  padding: 4px !important;
  transition: all 0.3s;

  &:hover {
    background: var(--color-bg-secondary);
  }

  .el-icon {
    font-size: 16px;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.panel.full-width {
  grid-column: 1 / -1;
}

.panel-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
  gap: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.3px;
}

.cases-source-switcher {
  /* 移除 align-self: flex-end，让按钮组垂直居中 */
}

.panel-body {
  flex: 1;
  padding: 12px;
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

.output-body {
  background: #f8f9fa;
  border-radius: var(--radius-md);
  overflow: auto;
  height: 100%;
}

.output-body pre {
  margin: 0;
  padding: var(--spacing-md);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.tree-view {
  padding: var(--spacing-sm);
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

.truncated-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: var(--radius-sm);
  color: #856404;
  font-size: 13px;
  margin-bottom: var(--spacing-sm);
}

.options-section {
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  flex-shrink: 0;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

// 统计信息栏
.stats-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .el-icon {
    font-size: 16px;
    color: #909399;
  }

  .stats-label {
    color: #606266;
    font-weight: 500;
  }

  .stats-value {
    color: #409EFF;
    font-weight: 600;
    font-family: 'Monaco', 'Consolas', monospace;
  }
}

.stats-divider {
  width: 1px;
  height: 16px;
  background-color: #e4e7ed;
}

// JSON 语法高亮
:deep(.json-string) { color: #0d9488; }
:deep(.json-number) { color: #ea580c; }
:deep(.json-boolean) { color: #7c3aed; }
:deep(.json-key) {
  color: #0369a1;
  font-weight: 600;
}

// Cases Panel Styles
.cases-panel {
  min-width: 220px;
  max-width: 220px;
  transition: all 0.3s ease;
}

.cases-body {
  overflow-y: auto;
  height: 100%;
}

.empty-cases {
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

.cases-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.case-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-secondary);
  gap: var(--spacing-xs);

  &:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);

    .case-item-actions {
      opacity: 1;
    }
  }

  &.active {
    background: var(--color-primary-lighter);
    color: var(--color-primary);
    font-weight: 500;
  }
}

.case-item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.case-icon {
  font-size: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.case-name {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.case-item-actions {
  display: flex;
  gap: 0px;
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;

  .el-button {
    padding: 0 !important;
    min-width: auto !important;
    width: 20px !important;
    height: 20px !important;
    margin: 0 !important;

    .el-icon {
      font-size: 11px !important;
    }
  }
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
