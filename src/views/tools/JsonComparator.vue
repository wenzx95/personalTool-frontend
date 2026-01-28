<template>
  <div class="json-comparator">
    <!-- ========== 编辑模式 ========== -->
    <div v-if="mode === 'edit'" class="compare-mode edit-mode">
      <!-- 案例列表面板 -->
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
              v-for="caseItem in currentCaseList"
              :key="casesSource === 'local' ? caseItem.id : caseItem.id"
              :class="['case-item', { active: selectedCaseId === (casesSource === 'local' ? caseItem.id : caseItem.id) }]"
              @click="loadCase(caseItem)"
            >
              <div class="case-item-content">
                <el-icon class="case-icon"><Document /></el-icon>
                <el-tooltip :content="caseItem.name" placement="top" :show-after="500">
                  <span class="case-name">{{ caseItem.name }}</span>
                </el-tooltip>
              </div>
              <div class="case-item-actions">
                <!-- 本地案例操作 -->
                <template v-if="casesSource === 'local'">
                  <el-button
                    link
                    size="small"
                    @click.stop="localToCloud(caseItem)"
                    :disabled="!userStore.isLoggedIn"
                    title="保存到云端"
                  >
                    <el-icon><Upload /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="updateCase(caseItem.id)"
                    title="更新"
                  >
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="renameCase(caseItem.id)"
                    title="重命名"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="deleteLocalCase(caseItem.id)"
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
                    @click.stop="cloudToLocal(caseItem)"
                    title="保存到本地"
                  >
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="updateCase(caseItem.id)"
                    title="更新"
                  >
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="renameCase(caseItem.id)"
                    title="重命名"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="deleteCloudCase(caseItem.id)"
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

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <el-button-group>
            <el-button @click="saveCase" :disabled="!canCompare">
              <el-icon><FolderAdd /></el-icon>
              保存案例
            </el-button>
            <el-button @click="updateSelectedCase" :disabled="!selectedCaseId || !canCompare">
              <el-icon><Document /></el-icon>
              更新案例
            </el-button>
            <el-button @click="clearAll">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </el-button-group>

          <div class="toolbar-spacer"></div>

          <el-button
            type="primary"
            @click="startCompare"
            :disabled="!canCompare"
          >
            <el-icon><Document /></el-icon>
            开始比对
          </el-button>
        </div>

        <!-- 左右输入面板 -->
        <div class="compare-panels">
        <!-- 左侧输入 -->
        <div class="panel left-panel">
          <div class="panel-header">
            <!-- 标题编辑 -->
            <el-input
              v-if="leftTitleEditing"
              v-model="leftTitleInput"
              size="small"
              @blur="finishLeftTitleEdit"
              @keyup.enter="finishLeftTitleEdit"
              @keyup.esc="cancelLeftTitleEdit"
              ref="leftTitleInputRef"
            />
            <div v-else class="panel-title-wrapper" @dblclick="startLeftTitleEdit">
              <span class="panel-title">{{ fullLeftTitle }}</span>
              <el-icon class="edit-icon"><Edit /></el-icon>
            </div>
            <!-- 验证标签 -->
            <el-tag v-if="isLeftValid" type="success" size="small">有效</el-tag>
            <el-tag v-else-if="leftJson" type="danger" size="small">无效</el-tag>
          </div>
          <div class="panel-body">
            <el-input
              v-model="leftJson"
              type="textarea"
              :rows="20"
              placeholder="粘贴或输入左侧 JSON..."
              @input="validateJson('left')"
            />
          </div>
          <div v-if="leftErrorMessage" class="error-message">
            <el-icon><Warning /></el-icon>
            <span>{{ leftErrorMessage }}</span>
          </div>
        </div>

        <!-- 右侧输入 -->
        <div class="panel right-panel">
          <div class="panel-header">
            <!-- 标题编辑 -->
            <el-input
              v-if="rightTitleEditing"
              v-model="rightTitleInput"
              size="small"
              @blur="finishRightTitleEdit"
              @keyup.enter="finishRightTitleEdit"
              @keyup.esc="cancelRightTitleEdit"
              ref="rightTitleInputRef"
            />
            <div v-else class="panel-title-wrapper" @dblclick="startRightTitleEdit">
              <span class="panel-title">{{ fullRightTitle }}</span>
              <el-icon class="edit-icon"><Edit /></el-icon>
            </div>
            <!-- 验证标签 -->
            <el-tag v-if="isRightValid" type="success" size="small">有效</el-tag>
            <el-tag v-else-if="rightJson" type="danger" size="small">无效</el-tag>
          </div>
          <div class="panel-body">
            <el-input
              v-model="rightJson"
              type="textarea"
              :rows="20"
              placeholder="粘贴或输入右侧 JSON..."
              @input="validateJson('right')"
            />
          </div>
          <div v-if="rightErrorMessage" class="error-message">
            <el-icon><Warning /></el-icon>
            <span>{{ rightErrorMessage }}</span>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- ========== 对比模式 ========== -->
    <div v-else class="compare-mode compare-view">
      <!-- 案例列表面板 -->
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
              v-for="caseItem in currentCaseList"
              :key="casesSource === 'local' ? caseItem.id : caseItem.id"
              :class="['case-item', { active: selectedCaseId === (casesSource === 'local' ? caseItem.id : caseItem.id) }]"
              @click="loadCase(caseItem)"
            >
              <div class="case-item-content">
                <el-icon class="case-icon"><Document /></el-icon>
                <el-tooltip :content="caseItem.name" placement="top" :show-after="500">
                  <span class="case-name">{{ caseItem.name }}</span>
                </el-tooltip>
              </div>
              <div class="case-item-actions">
                <!-- 本地案例操作 -->
                <template v-if="casesSource === 'local'">
                  <el-button
                    link
                    size="small"
                    @click.stop="localToCloud(caseItem)"
                    :disabled="!userStore.isLoggedIn"
                    title="保存到云端"
                  >
                    <el-icon><Upload /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="updateCase(caseItem.id)"
                    title="更新"
                  >
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="renameCase(caseItem.id)"
                    title="重命名"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="deleteLocalCase(caseItem.id)"
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
                    @click.stop="cloudToLocal(caseItem)"
                    title="保存到本地"
                  >
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="updateCase(caseItem.id)"
                    title="更新"
                  >
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="renameCase(caseItem.id)"
                    title="重命名"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    link
                    size="small"
                    @click.stop="deleteCloudCase(caseItem.id)"
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

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <el-button-group>
            <el-button @click="mode = 'edit'" icon="Edit">返回编辑</el-button>
            <el-button @click="saveCase" :disabled="!canCompare">
              <el-icon><FolderAdd /></el-icon>
              保存案例
            </el-button>
            <el-button @click="updateSelectedCase" :disabled="!selectedCaseId || !canCompare">
              <el-icon><Document /></el-icon>
              更新案例
            </el-button>
            <el-button @click="clearAll" icon="Delete">清空</el-button>
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button-group>
            <el-button
              :type="compareMode === 'outline' ? 'primary' : ''"
              @click="compareMode = 'outline'"
            >
              大纲比对
            </el-button>
            <el-button
              :type="compareMode === 'full' ? 'primary' : ''"
              @click="compareMode = 'full'"
            >
              完整比对
            </el-button>
          </el-button-group>

          <div class="toolbar-spacer"></div>

          <div v-if="compareResult" class="diff-summary">
            <el-tag v-if="compareResult.diffCount > 0" type="warning" size="large">
              差异: {{ compareResult.diffCount }} 处
            </el-tag>
            <el-tag v-else type="success" size="large">
              完全一致
            </el-tag>
          </div>

          <!-- 差异导航 -->
          <div v-if="compareResult && compareResult.diffCount > 0" class="diff-navigation">
            <el-button-group>
              <el-button @click="navigateDiff(-1)" icon="ArrowUp">上一个</el-button>
            </el-button-group>

            <div class="diff-page-wrapper">
              <el-input
                v-if="isEditingPage"
                ref="pageInputRef"
                v-model="pageInputValue"
                class="diff-page-input"
                type="number"
                :min="1"
                :max="compareResult.diffCount"
                @blur="finishPageEdit"
                @keyup.enter="finishPageEdit"
                @keyup.esc="cancelPageEdit"
              />
              <el-button v-else @click="startPageEdit" class="diff-page-button">
                {{ currentDiffIndex + 1 }} / {{ compareResult.diffCount }}
              </el-button>
            </div>

            <el-button-group>
              <el-button @click="navigateDiff(1)" icon="ArrowDown">下一个</el-button>
            </el-button-group>
          </div>

          <!-- 对齐按钮 -->
          <el-button @click="alignPanels" icon="Operation">对齐</el-button>
        </div>

        <!-- 双栏对比视图 -->
        <div class="compare-panels">
          <!-- 左侧视图（基准） -->
          <div class="panel left-panel">
            <div class="panel-header">
              <span class="panel-title">{{ fullLeftTitle }}</span>
            </div>
            <div
              class="panel-body"
              ref="leftPanelRef"
              @scroll="handleLeftScroll"
            >
              <JsonCompareTree
                v-if="compareResult"
                :data="compareResult.leftTree"
                :diffs="compareResult.diffs"
                :side="'left'"
                @diff-click="handleDiffClick"
              />
              <div v-else class="empty-state">
                <el-icon><Document /></el-icon>
                <span>暂无数据</span>
              </div>
            </div>
          </div>

          <!-- 右侧视图（对比） -->
          <div class="panel right-panel">
            <div class="panel-header">
              <span class="panel-title">{{ fullRightTitle }}</span>
            </div>
            <div
              class="panel-body"
              ref="rightPanelRef"
              @scroll="handleRightScroll"
            >
              <JsonCompareTree
                v-if="compareResult"
                :data="compareResult.rightTree"
                :diffs="compareResult.diffs"
                :side="'right'"
                @diff-click="handleDiffClick"
              />
              <div v-else class="empty-state">
                <el-icon><Document /></el-icon>
                <span>暂无数据</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div v-if="mode === 'compare'" class="legend">
      <div class="legend-item">
        <span class="legend-color diff-added"></span>
        <span>新增（右边有）</span>
      </div>
      <div class="legend-item">
        <span class="legend-color diff-removed"></span>
        <span>删除（右边没有）</span>
      </div>
      <div class="legend-item">
        <span class="legend-color diff-modified"></span>
        <span>修改（值不同）</span>
      </div>
      <div class="legend-item">
        <span class="legend-color diff-key-changed"></span>
        <span>Key 变化</span>
      </div>
      <div class="legend-item">
        <span class="legend-color diff-missing"></span>
        <span>缺失（左边没有）</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Warning,
  Edit,
  FolderAdd,
  Delete,
  FolderOpened,
  Cloudy,
  Upload,
  Download
} from '@element-plus/icons-vue'
import JsonCompareTree from '@/components/JsonCompareTree.vue'
import {
  compareJson,
  validateJson as validateJsonUtil,
  type CompareResult,
  type DiffItem
} from '@/utils/jsonComparator'
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
} = useUserData('json-comparator')

// ========== 案例管理接口定义 ==========
interface ComparatorSavedCase {
  id: string | number
  name: string
  leftTitle?: string
  rightTitle?: string
  leftJson?: string
  rightJson?: string
  compareMode?: 'outline' | 'full'
  createdAt?: number
  createTime?: string
  data?: any
}

// ========== 状态管理 ==========
// 模式：edit | compare
const mode = ref<'edit' | 'compare'>('edit')

// 编辑模式数据
const leftJson = ref('')
const rightJson = ref('')
const leftTitle = ref('左侧 JSON')
const rightTitle = ref('右侧 JSON')
const LEFT_SUFFIX = '（基准）'
const RIGHT_SUFFIX = '（比对）'

// 标题编辑状态
const leftTitleEditing = ref(false)
const rightTitleEditing = ref(false)
const leftTitleInput = ref('')
const rightTitleInput = ref('')
const leftTitleInputRef = ref<HTMLInputElement>()
const rightTitleInputRef = ref<HTMLInputElement>()

// 计算完整标题
const fullLeftTitle = computed(() => `${leftTitle.value}${LEFT_SUFFIX}`)
const fullRightTitle = computed(() => `${rightTitle.value}${RIGHT_SUFFIX}`)

// 验证状态
const isLeftValid = ref(false)
const isRightValid = ref(false)
const leftErrorMessage = ref('')
const rightErrorMessage = ref('')

// 对比模式数据
const compareResult = ref<CompareResult | null>(null)
const compareMode = ref<'outline' | 'full'>('outline')

// 滚动同步引用
const leftPanelRef = ref<HTMLElement>()
const rightPanelRef = ref<HTMLElement>()

// 差异导航
const currentDiffIndex = ref(-1)
const isEditingPage = ref(false)
const pageInputValue = ref('')
const pageInputRef = ref<HTMLInputElement>()

// 案例管理
const LOCAL_STORAGE_KEY = 'json-comparator-cases'
const localCases = ref<ComparatorSavedCase[]>([])
const casesSource = ref<'local' | 'cloud'>('local')
const selectedCaseId = ref<string | number | null>(null)

// 当前案例列表（根据案例源切换）
const currentCaseList = computed(() => {
  return casesSource.value === 'local' ? localCases.value : cloudCases.value
})


// ========== 计算属性 ==========
const canCompare = computed(() => {
  return isLeftValid.value && isRightValid.value
})

// ========== 验证 JSON ==========
const validateJson = (side: 'left' | 'right') => {
  const json = side === 'left' ? leftJson.value : rightJson.value

  if (!json.trim()) {
    if (side === 'left') {
      isLeftValid.value = false
      leftErrorMessage.value = ''
    } else {
      isRightValid.value = false
      rightErrorMessage.value = ''
    }
    return false
  }

  const isValid = validateJsonUtil(json)

  if (side === 'left') {
    isLeftValid.value = isValid
    leftErrorMessage.value = isValid ? '' : 'JSON 格式无效，请检查'
  } else {
    isRightValid.value = isValid
    rightErrorMessage.value = isValid ? '' : 'JSON 格式无效，请检查'
  }

  return isValid
}

// ========== 开始比对 ==========
const startCompare = () => {
  if (!canCompare.value) {
    ElMessage.warning('请确保两个 JSON 都有效')
    return
  }

  try {
    const leftData = JSON.parse(leftJson.value)
    const rightData = JSON.parse(rightJson.value)

    // 执行比对
    compareResult.value = compareJson(leftData, rightData, compareMode.value)

    // 重置滚动偏移量
    scrollOffset = 0

    // 切换到对比模式
    mode.value = 'compare'

    ElMessage.success(`比对完成，发现 ${compareResult.value.diffCount} 处差异`)
  } catch (error: any) {
    ElMessage.error('比对失败: ' + error.message)
  }
}

// ========== 清空所有 ==========
const clearAll = () => {
  leftJson.value = ''
  rightJson.value = ''
  isLeftValid.value = false
  isRightValid.value = false
  leftErrorMessage.value = ''
  rightErrorMessage.value = ''
  compareResult.value = null
  currentDiffIndex.value = -1
  scrollOffset = 0  // 重置滚动偏移量
  mode.value = 'edit'
}

// ========== 联动滚动 ==========
let isScrolling = false
let scrollOffset = 0  // 记录左右两边的滚动偏移量

const handleLeftScroll = (event: Event) => {
  if (isScrolling) return

  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollLeft = target.scrollLeft

  isScrolling = true

  // 同步到右侧 - 考虑偏移量
  if (rightPanelRef.value) {
    rightPanelRef.value.scrollTop = scrollTop + scrollOffset
    rightPanelRef.value.scrollLeft = scrollLeft
  }

  setTimeout(() => {
    isScrolling = false
  }, 50)
}

const handleRightScroll = (event: Event) => {
  if (isScrolling) return

  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollLeft = target.scrollLeft

  isScrolling = true

  // 同步到左侧 - 考虑偏移量
  if (leftPanelRef.value) {
    leftPanelRef.value.scrollTop = scrollTop - scrollOffset
    leftPanelRef.value.scrollLeft = scrollLeft
  }

  setTimeout(() => {
    isScrolling = false
  }, 50)
}

// ========== 手动对齐 ==========
const alignPanels = () => {
  // 找到左边可视区域中心的节点
  const leftNodes = document.querySelectorAll('[data-side="left"]') as NodeListOf<HTMLElement>
  let centerNode: HTMLElement | null = null
  let minDistance = Infinity

  const leftContainerRect = leftPanelRef.value?.getBoundingClientRect()
  if (!leftContainerRect) return

  const centerY = leftContainerRect.top + leftContainerRect.height / 2

  leftNodes.forEach(node => {
    const rect = node.getBoundingClientRect()
    const distance = Math.abs(rect.top - centerY)
    if (distance < minDistance) {
      minDistance = distance
      centerNode = node
    }
  })

  if (!centerNode) return

  // 类型断言，因为我们已经检查过 centerNode 不为 null 了
  const safeCenterNode = centerNode as HTMLElement

  // 获取该节点的 path
  const path = safeCenterNode.getAttribute('data-path')
  if (!path) return

  // 在右边找到相同 path 的节点
  const rightNode = document.querySelector(`[data-side="right"][data-path="${path}"]`) as HTMLElement
  if (!rightNode) {
    ElMessage.warning('右侧没有找到对应的内容')
    return
  }

  // 高亮显示对齐的节点
  document.querySelectorAll('.align-highlight').forEach(el => {
    el.classList.remove('align-highlight')
  })
  safeCenterNode.classList.add('align-highlight')
  rightNode.classList.add('align-highlight')

  // 临时禁用滚动同步，避免互相干扰
  isScrolling = true

  // 使用 requestAnimationFrame 确保两个滚动同时执行，并使用 instant 行为确保准确性
  requestAnimationFrame(() => {
    safeCenterNode.scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest'
    })

    rightNode.scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest'
    })
  })

  // 等待滚动完成后，计算并记录偏移量
  setTimeout(() => {
    if (leftPanelRef.value && rightPanelRef.value) {
      // 记录两边的滚动偏移量
      scrollOffset = rightPanelRef.value.scrollTop - leftPanelRef.value.scrollTop
      console.log('对齐完成，滚动偏移量:', scrollOffset)
    }

    // 恢复滚动同步
    isScrolling = false
  }, 100)

  // 2秒后移除高亮
  setTimeout(() => {
    centerNode?.classList.remove('align-highlight')
    rightNode?.classList.remove('align-highlight')
  }, 2000)
}

// ========== 智能定位 ==========
const handleDiffClick = (diff: DiffItem) => {
  // 移除之前的高亮
  document.querySelectorAll('.diff-highlight').forEach(el => {
    el.classList.remove('diff-highlight')
  })

  // 查找并高亮差异项
  const leftElement = document.querySelector(`[data-path="${diff.path}"][data-side="left"]`) as HTMLElement
  const rightElement = document.querySelector(`[data-path="${diff.path}"][data-side="right"]`) as HTMLElement

  if (leftElement) leftElement.classList.add('diff-highlight')
  if (rightElement) rightElement.classList.add('diff-highlight')

  // 同时滚动到可见区域
  // 禁用平滑滚动，使用 instant 让两个面板同时跳转
  if (leftElement) {
    leftElement.scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest'
    })
  }

  if (rightElement) {
    rightElement.scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest'
    })
  }
}

// ========== 差异导航 ==========
const navigateDiff = (direction: number) => {
  if (!compareResult.value || compareResult.value.diffs.length === 0) {
    return
  }

  const diffs = compareResult.value.diffs
  const count = diffs.length

  // 计算新的索引
  let newIndex = currentDiffIndex.value + direction

  if (newIndex < 0) {
    newIndex = count - 1  // 循环到最后一个
  } else if (newIndex >= count) {
    newIndex = 0  // 循环到第一个
  }

  currentDiffIndex.value = newIndex
  const diff = diffs[newIndex]

  // 触发点击定位
  handleDiffClick(diff)
}

// 处理页码输入（未使用）
// const handlePageChange = (value: number) => {
//   if (!compareResult.value || compareResult.value.diffs.length === 0) {
//     return
//   }
//
//   // ElInputNumber 已经保证了值在 min 和 max 之间
//   // 只需要将页码转换为索引（页码从1开始，索引从0开始）
//   const newIndex = value - 1
//   currentDiffIndex.value = newIndex
//
//   // 跳转到对应的差异
//   const diff = compareResult.value.diffs[newIndex]
//   handleDiffClick(diff)
// }

// 开始编辑页码
const startPageEdit = () => {
  isEditingPage.value = true
  pageInputValue.value = String(currentDiffIndex.value + 1)
  nextTick(() => {
    pageInputRef.value?.focus()
    pageInputRef.value?.select()
  })
}

// 完成编辑页码
const finishPageEdit = () => {
  if (!compareResult.value || compareResult.value.diffs.length === 0) {
    isEditingPage.value = false
    return
  }

  const inputPage = parseInt(pageInputValue.value)
  if (isNaN(inputPage)) {
    isEditingPage.value = false
    return
  }

  // 限制范围在 1 ~ diffCount 之间
  const maxPage = compareResult.value.diffCount
  const validPage = Math.max(1, Math.min(inputPage, maxPage))

  // 跳转到对应的差异
  const newIndex = validPage - 1
  currentDiffIndex.value = newIndex
  const diff = compareResult.value.diffs[newIndex]
  handleDiffClick(diff)

  isEditingPage.value = false
}

// 取消编辑页码
const cancelPageEdit = () => {
  isEditingPage.value = false
}

// ========== 监听比对模式变化 ==========
watch(compareMode, () => {
  // 重新执行比对
  if (mode.value === 'compare' && leftJson.value && rightJson.value) {
    try {
      const leftData = JSON.parse(leftJson.value)
      const rightData = JSON.parse(rightJson.value)
      compareResult.value = compareJson(leftData, rightData, compareMode.value)
    } catch (error: any) {
      ElMessage.error('重新比对失败: ' + error.message)
    }
  }
})

// ========== 示例数据 ==========
const loadExample = () => {
  const exampleLeft = {
    "users": [
      {
        "id": 1,
        "name": "张三",
        "age": 25,
        "email": "zhangsan@example.com"
      },
      {
        "id": 2,
        "name": "李四",
        "age": 30
      }
    ],
    "total": 2
  }

  const exampleRight = {
    "users": [
      {
        "id": 1,
        "name": "张三",
        "age": 26,
        "email": "zhangsan@example.com"
      },
      {
        "id": 2,
        "name": "李四",
        "age": 30,
        "phone": "13800138000"
      },
      {
        "id": 3,
        "name": "王五",
        "age": 28
      }
    ],
    "total": 3
  }

  leftJson.value = JSON.stringify(exampleLeft, null, 2)
  rightJson.value = JSON.stringify(exampleRight, null, 2)

  // 自动验证
  validateJson('left')
  validateJson('right')

  ElMessage.success('已加载示例数据')
}

// ========== 本地案例管理 ==========
const saveLocalCasesToStorage = () => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localCases.value))
  } catch (error) {
    console.error('保存本地案例失败:', error)
    ElMessage.error('保存失败，可能是存储空间不足')
  }
}

const loadLocalCasesFromStorage = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      localCases.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载本地案例失败:', error)
  }
}

const saveLocalCase = () => {
  if (!canCompare.value) {
    ElMessage.warning('请先输入有效的 JSON')
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
    const newCase: ComparatorSavedCase = {
      id: Date.now().toString(),
      name: value,
      leftTitle: leftTitle.value,
      rightTitle: rightTitle.value,
      leftJson: leftJson.value,
      rightJson: rightJson.value,
      compareMode: compareMode.value,
      createdAt: Date.now()
    }

    localCases.value.push(newCase)
    saveLocalCasesToStorage()
    selectedCaseId.value = newCase.id
    ElMessage.success('案例已保存到本地')
  }).catch(() => {})
}

const updateLocalCase = (id: string) => {
  if (!canCompare.value) {
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
    caseItem.leftTitle = leftTitle.value
    caseItem.rightTitle = rightTitle.value
    caseItem.leftJson = leftJson.value
    caseItem.rightJson = rightJson.value
    caseItem.compareMode = compareMode.value
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

// ========== 云端案例管理 ==========
const saveCloudCase = async () => {
  if (!canCompare.value) {
    ElMessage.warning('请先输入有效的 JSON')
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
        data: {
          leftTitle: leftTitle.value,
          rightTitle: rightTitle.value,
          leftJson: leftJson.value,
          rightJson: rightJson.value,
          compareMode: compareMode.value
        },
        remarks: 'JSON比对工具案例'
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
  if (!canCompare.value) {
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
        data: {
          leftTitle: leftTitle.value,
          rightTitle: rightTitle.value,
          leftJson: leftJson.value,
          rightJson: rightJson.value,
          compareMode: compareMode.value
        }
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

// ========== 案例转换 ==========
const localToCloud = async (caseItem: ComparatorSavedCase) => {
  try {
    await saveData({
      name: caseItem.name,
      data: {
        leftTitle: caseItem.leftTitle,
        rightTitle: caseItem.rightTitle,
        leftJson: caseItem.leftJson,
        rightJson: caseItem.rightJson,
        compareMode: caseItem.compareMode
      },
      remarks: '本地案例转云端'
    })
    ElMessage.success('案例已保存到云端')
  } catch (error: any) {
    ElMessage.error(error.message || '保存到云端失败')
  }
}

const cloudToLocal = async (caseItem: any) => {
  const newCase: ComparatorSavedCase = {
    id: Date.now().toString(),
    name: caseItem.name,
    leftTitle: caseItem.data.leftTitle,
    rightTitle: caseItem.data.rightTitle,
    leftJson: caseItem.data.leftJson,
    rightJson: caseItem.data.rightJson,
    compareMode: caseItem.data.compareMode,
    createdAt: new Date(caseItem.createTime).getTime()
  }

  localCases.value.push(newCase)
  saveLocalCasesToStorage()
  ElMessage.success('案例已保存到本地')
}

// ========== 案例管理包装函数 ==========
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

  selectedCaseId.value = casesSource.value === 'local' ? item.id : item.id
  leftTitle.value = casesSource.value === 'local' ? item.leftTitle : item.data.leftTitle
  rightTitle.value = casesSource.value === 'local' ? item.rightTitle : item.data.rightTitle
  leftJson.value = casesSource.value === 'local' ? item.leftJson : item.data.leftJson
  rightJson.value = casesSource.value === 'local' ? item.rightJson : item.data.rightJson
  compareMode.value = casesSource.value === 'local' ? item.compareMode : item.data.compareMode

  // 验证 JSON
  validateJson('left')
  validateJson('right')

  // 如果 JSON 有效，自动执行比对
  if (isLeftValid.value && isRightValid.value) {
    startCompare()
  }

  ElMessage.success(`已加载案例: ${item.name}`)
}

const updateSelectedCase = () => {
  if (selectedCaseId.value) {
    updateCase(selectedCaseId.value)
  }
}

const deleteCase = (id: string | number) => {
  if (casesSource.value === 'local') {
    deleteLocalCase(id as string)
  } else {
    deleteCloudCase(id as number)
  }
}

// ========== 标题编辑功能 ==========
const startLeftTitleEdit = () => {
  leftTitleInput.value = leftTitle.value
  leftTitleEditing.value = true
  nextTick(() => {
    leftTitleInputRef.value?.focus()
  })
}

const finishLeftTitleEdit = () => {
  if (leftTitleInput.value.trim()) {
    leftTitle.value = leftTitleInput.value.trim()
  }
  leftTitleEditing.value = false
}

const cancelLeftTitleEdit = () => {
  leftTitleEditing.value = false
}

const startRightTitleEdit = () => {
  rightTitleInput.value = rightTitle.value
  rightTitleEditing.value = true
  nextTick(() => {
    rightTitleInputRef.value?.focus()
  })
}

const finishRightTitleEdit = () => {
  if (rightTitleInput.value.trim()) {
    rightTitle.value = rightTitleInput.value.trim()
  }
  rightTitleEditing.value = false
}

const cancelRightTitleEdit = () => {
  rightTitleEditing.value = false
}

// ========== 初始化 ==========
onMounted(() => {
  loadLocalCasesFromStorage()
})

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

// 暴露方法给父组件
defineExpose({
  loadExample,
  clearAll,
  saveCase,
  loadCase,
  updateCase,
  deleteCase,
  renameCase
})
</script>

<style scoped lang="scss">
.json-comparator {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: transparent;

  // 图例固定在底部
  .legend {
    flex-shrink: 0;
    margin-top: 16px;
  }
}

// ========== 编辑模式 ==========
.compare-mode {
  display: flex;
  gap: 16px;
  min-height: 0;
  height: 100%;

  &.edit-mode {
    // 保持 flex 布局
  }

  &.compare-view {
    // 保持 flex 布局（水平排列）
  }
}

.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &.left-panel,
  &.right-panel {
    flex: 1;
  }

  &.left-panel {
    background-color: #fafafa;
  }

  &.right-panel {
    background-color: #ffffff;
  }

  &.cases-panel {
    width: 220px !important;
    max-width: 220px !important;
    min-width: 220px !important;
    flex: 0 0 220px !important;
    flex-shrink: 0;
  }
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafbfc;
  gap: 8px;

  .panel-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    letter-spacing: 0.3px;
  }
}

.cases-source-switcher {
  align-self: flex-end;
}

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  min-height: 0;

  // 案例列表面板的 body 样式
  .cases-panel & {
    overflow-y: auto;
    padding: 8px;
  }

  // 编辑模式下的 textarea 样式
  :deep(.el-textarea) {
    height: 100%;
    display: flex;
  }

  :deep(.el-textarea__inner) {
    height: 100% !important;
    resize: none;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

.error-message {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #fef0f0;
  border-top: 1px solid #fde2e2;
  color: #f56c6c;
  font-size: 13px;
}

.actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;

  .el-button {
    width: 100%;
    height: 100%;
  }
}

// ========== 对比模式 ==========
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  flex-wrap: wrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar-spacer {
  flex: 1;
}

.diff-summary {
  display: flex;
  gap: 8px;
}

.diff-navigation {
  display: flex;
  align-items: center;
  gap: 8px;

  .diff-page-wrapper {
    display: inline-flex;
    align-items: center;

    .diff-page-button {
      min-width: 80px;
    }

    .diff-page-input {
      width: 70px;

      :deep(.el-input__wrapper) {
        padding: 0;
        height: 32px;  // 和按钮高度一致
      }

      :deep(.el-input__inner) {
        text-align: center;
        padding: 0 4px;
        height: 30px;
        line-height: 30px;
      }
    }
  }
}

.compare-panels {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  gap: 12px;

  .el-icon {
    font-size: 48px;
    opacity: 0.5;
  }

  span {
    font-size: 14px;
  }
}

// ========== 图例 ==========
.legend {
  flex-shrink: 0;
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  flex-wrap: wrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);

  &.diff-added {
    background-color: #d4edda;
  }

  &.diff-removed {
    background-color: #f8d7da;
  }

  &.diff-modified {
    background-color: #fff3cd;
  }

  &.diff-key-changed {
    background-color: #ffeaa7;
  }

  &.diff-missing {
    background-color: #e7f3ff;
  }
}

// ========== 高亮样式 ==========
:deep(.diff-highlight) {
  outline: 2px solid #2196F3 !important;
  outline-offset: 1px;
  animation: highlight-pulse 1s ease-in-out;
}

:deep(.align-highlight) {
  outline: 2px solid #67C23A !important;
  outline-offset: 1px;
  animation: align-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    background-color: inherit;
  }
  50% {
    background-color: #e3f2fd;
  }
}

@keyframes align-pulse {
  0%, 100% {
    background-color: inherit;
  }
  50% {
    background-color: #f0f9ff;
  }
}

// ========== 编辑模式布局优化 ==========
.compare-mode.edit-mode {
  display: flex !important;
  flex-direction: row !important;
  gap: 16px;
  height: 100%;
  overflow: hidden;

  .cases-panel {
    background-color: #fff;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;

    .toolbar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background-color: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .compare-panels {
      flex: 1;
      display: flex;
      gap: 16px;
      min-height: 0;
      overflow: hidden;
    }
  }
}

// ========== 面板标题编辑 ==========
.panel-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;

    .edit-icon {
      opacity: 1;
    }
  }

  .edit-icon {
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 14px;
    color: #909399;
  }
}

// ========== 对比模式布局优化 ==========
.compare-view {
  display: flex !important;
  flex-direction: row !important;
  gap: 16px;
  height: 100%;
  overflow: hidden;

  .cases-panel {
    background-color: #fff;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;

    .toolbar {
      flex-shrink: 0;
      position: relative;
      z-index: 10;
      margin-bottom: 16px;
    }

    .compare-panels {
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
  }
}

// ========== 案例列表面板样式 ==========
.cases-body {
  .empty-cases {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #909399;
    gap: 12px;

    .el-icon {
      font-size: 48px;
      opacity: 0.5;
    }

    span {
      font-size: 13px;
    }
  }

  .cases-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .case-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: #606266;
    gap: 8px;

    &:hover {
      background-color: #f5f7fa;
      color: #303133;

      .case-item-actions {
        opacity: 1;
      }
    }

    &.active {
      background-color: #ecf5ff;
      color: #409EFF;
      font-weight: 500;
    }

    .case-item-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      cursor: pointer;
    }

    .case-icon {
      font-size: 16px;
      color: #909399;
      flex-shrink: 0;
    }

    .case-name {
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    .case-item-actions {
      display: flex;
      gap: 0;
      opacity: 0;
      transition: opacity 0.2s;
      flex-shrink: 0;

      .el-button {
        padding: 0 !important;
        min-width: auto !important;
        width: 20px !important;
        height: 20px !important;
        margin: 0 !important;
      }
    }
  }
}

// ========== 响应式 ==========
@media (max-width: 1024px) {
  .compare-mode.edit-mode {
    flex-direction: column;
  }

  .actions {
    padding: 8px 0;

    .el-button {
      width: auto;
      min-width: 200px;
    }
  }

  .compare-panels {
    flex-direction: column;
  }
}

/* ============================================================
   移动端优化 - 平板和手机
   ============================================================ */
@media (max-width: 768px) {
  /* 页面容器优化 */
  .json-comparator {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  /* 编辑模式布局优化 */
  .compare-mode.edit-mode {
    gap: 12px;
  }

  /* 案例面板优化 */
  .cases-panel {
    border-radius: 12px;
    overflow: hidden;

    .panel-header {
      padding: 12px 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .panel-title {
        font-size: 16px;
        font-weight: 600;
      }

      .cases-source-switcher {
        width: 100%;

        .el-button-group {
          display: flex;
          width: 100%;

          .el-button {
            flex: 1;
            height: 40px;
            font-size: 14px;
            border-radius: 8px;
          }
        }
      }
    }

    .panel-body {
      padding: 0;
    }
  }

  /* 案例列表优化 */
  .cases-body {
    .empty-cases {
      padding: 40px 16px;

      .el-icon {
        font-size: 48px;
      }

      span {
        font-size: 14px;
      }
    }

    .case-item {
      padding: 10px 12px;
      min-height: 48px;
      border-radius: 8px;

      &:active {
        background-color: #e6f7ff;
      }

      .case-icon {
        font-size: 18px;
      }

      .case-name {
        font-size: 14px;
      }

      .case-item-actions {
        .el-button {
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;

          .el-icon {
            font-size: 14px;
          }
        }
      }
    }
  }

  /* 操作按钮区优化 */
  .actions {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 0;

    .el-button {
      flex: 1;
      min-width: calc(50% - 4px);
      height: 44px;
      font-size: 15px;
      border-radius: 10px;
    }
  }

  /* 主内容区优化 */
  .main-content {
    .toolbar {
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;

      .el-button {
        height: 40px;
        font-size: 14px;
        border-radius: 8px;
      }
    }

    .compare-panels {
      gap: 12px;
    }
  }

  /* 对比面板优化 */
  .compare-panel {
    border-radius: 10px;

    .panel-header {
      padding: 12px;
      border-radius: 10px 10px 0 0;

      .panel-title {
        font-size: 15px;
      }

      .panel-actions {
        .el-button {
          height: 32px;
          font-size: 13px;
        }
      }
    }

    .panel-body {
      padding: 12px;

      :deep(.el-textarea__inner) {
        font-size: 14px !important;
        border-radius: 8px;
      }
    }
  }

  /* 结果面板优化 */
  .result-panel {
    border-radius: 10px;

    .panel-header {
      padding: 12px;
      border-radius: 10px 10px 0 0;

      .panel-title {
        font-size: 15px;
      }
    }

    .panel-body {
      padding: 12px;
      border-radius: 0 0 10px 10px;
    }
  }

  /* 差异结果优化 */
  .diff-result {
    .diff-item {
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;

      .diff-path {
        font-size: 12px;
      }
    }
  }

  /* 面板标题编辑优化 */
  .panel-title-wrapper {
    padding: 6px 10px;
    border-radius: 6px;

    .edit-icon {
      font-size: 16px;
    }
  }

  /* 对比模式优化 */
  .compare-view {
    gap: 12px;

    .cases-panel {
      border-radius: 10px;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .json-comparator {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
  }

  /* 案例面板 */
  .cases-panel {
    .panel-header {
      padding: 10px 12px;

      .panel-title {
        font-size: 15px;
      }

      .cases-source-switcher {
        .el-button-group {
          .el-button {
            height: 38px;
            font-size: 13px;
          }
        }
      }
    }
  }

  /* 案例列表 */
  .cases-body {
    .case-item {
      padding: 8px 10px;
      min-height: 44px;

      .case-icon {
        font-size: 16px;
      }

      .case-name {
        font-size: 13px;
      }
    }
  }

  /* 操作按钮 */
  .actions {
    .el-button {
      height: 44px;
      font-size: 14px;
    }
  }

  /* 工具栏 */
  .main-content {
    .toolbar {
      padding: 10px;
      border-radius: 8px;

      .el-button {
        height: 38px;
        font-size: 13px;
      }
    }

    .compare-panels {
      gap: 10px;
    }
  }

  /* 对比面板 */
  .compare-panel {
    border-radius: 8px;

    .panel-header {
      padding: 10px;
      border-radius: 8px 8px 0 0;

      .panel-title {
        font-size: 14px;
      }

      .panel-actions {
        .el-button {
          height: 30px;
          font-size: 12px;
        }
      }
    }

    .panel-body {
      padding: 10px;

      :deep(.el-textarea__inner) {
        font-size: 13px !important;
        border-radius: 6px;
      }
    }
  }

  /* 结果面板 */
  .result-panel {
    border-radius: 8px;

    .panel-header {
      padding: 10px;
      border-radius: 8px 8px 0 0;

      .panel-title {
        font-size: 14px;
      }
    }

    .panel-body {
      padding: 10px;
      border-radius: 0 0 8px 8px;
    }
  }

  /* 差异结果 */
  .diff-result {
    .diff-item {
      padding: 6px 8px;
      font-size: 12px;

      .diff-path {
        font-size: 11px;
      }
    }
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .json-comparator {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
