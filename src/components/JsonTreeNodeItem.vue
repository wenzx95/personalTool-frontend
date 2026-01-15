<template>
  <div
    ref="nodeRef"
    class="json-tree-node-item"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <!-- Node Header -->
    <div class="node-header" :class="{ 'two-line': isPrimitive && isLongText }">
      <!-- Row 1: Key line -->
      <div class="node-key-line">
        <!-- Expand/Collapse Button -->
        <span
          v-if="(isObject || isArray)"
          class="expand-btn"
          @click.stop="toggleExpand"
        >
          <el-icon v-if="isExpanded">
            <ArrowDown />
          </el-icon>
          <el-icon v-else>
            <ArrowRight />
          </el-icon>
        </span>
        <span v-else class="expand-btn-placeholder"></span>

        <!-- Index (for arrays) -->
        <span v-if="index >= 0" class="node-index">{{ index }}:</span>

        <!-- Key (for objects) -->
        <span v-if="nodeKey" class="node-key">
          <span
            v-if="!isEditingKey"
            class="key-text"
            @dblclick.stop="startEditKey"
          >"{{ nodeKey }}"</span>
          <el-input
            v-else
            ref="editKeyInput"
            v-model="editKeyValue"
            size="small"
            @blur="saveKeyEdit"
            @keyup.enter="saveKeyEdit"
            @keyup.esc="cancelKeyEdit"
            class="edit-input edit-key-input"
          />
          :
        </span>

        <!-- Value inline (for short primitives) -->
        <span v-if="isPrimitive && !isLongText" class="node-value inline-value" :class="getValueType(props.data)">
          <span
            v-if="!isEditing"
            class="value-text"
            @dblclick.stop="startEditing"
          >
            {{ displayValue }}
          </span>
          <el-input
            v-else
            ref="editInput"
            v-model="editValue"
            size="small"
            @blur="saveEdit"
            @keyup.enter="saveEdit"
            @keyup.esc="cancelEdit"
            class="edit-input inline-edit-input"
          />
        </span>

        <!-- Value summary inline (for objects/arrays in array) -->
        <span v-if="(isObject || isArray) && !nodeKey && index >= 0" class="node-value inline-value value-summary">
          {{ getObjectSummary(props.data) }}
        </span>

        <!-- Delete text (for short primitives) -->
        <div v-if="isPrimitive && !isLongText && path.length > 0" class="primitive-actions">
          <span class="copy-text" @click.stop="$emit('copyNode', { path, data })">复制</span>
          <span class="delete-text" @click.stop="$emit('deleteNode', path)">删除</span>
        </div>

        <!-- Actions (only for objects/arrays) -->
        <div v-if="(isObject || isArray) && path.length > 0" class="node-actions">
          <span
            class="copy-text"
            @click.stop="$emit('copyNode', { path, data })"
          >
            复制
          </span>
          <span
            class="delete-text"
            @click.stop="$emit('deleteNode', path)"
          >
            删除
          </span>
        </div>
      </div>

      <!-- Row 2: Value line (only for long primitives) -->
      <div v-if="isPrimitive && isLongText" class="node-value-line">
        <span class="node-value" :class="getValueType(props.data)">
          <span
            v-if="!isEditing"
            class="value-text"
            @dblclick.stop="startEditing"
          >
            {{ displayValue }}
          </span>
          <el-input
            v-else
            ref="editInput"
            v-model="editValue"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 10 }"
            @blur="saveEdit"
            @keyup.esc="cancelEdit"
            class="edit-input textarea-edit-input"
          />
        </span>
        <!-- Actions for long text -->
        <div v-if="path.length > 0" class="long-text-actions">
          <span class="copy-text long-text-copy" @click.stop="$emit('copyNode', { path, data })">复制</span>
          <span class="delete-text long-text-delete" @click.stop="$emit('deleteNode', path)">删除</span>
        </div>
      </div>
    </div>

    <!-- Children (for objects/arrays) -->
    <div v-if="(isObject || isArray) && isExpanded" class="node-children">
      <!-- For objects: render entries as key-value pairs -->
      <template v-if="isObject">
        <JsonTreeNodeItem
          v-for="[childKey, childValue] in Object.entries(props.data)"
          :key="childKey"
          :data="childValue"
          :node-key="childKey"
          :index="-1"
          :path="[...path, childKey]"
          :expanded="expanded"
          @toggle-expand="$emit('toggleExpand', $event)"
          @update-value="$emit('updateValue', $event)"
          @delete-node="$emit('deleteNode', $event)"
          @add-item="$emit('addItem', $event)"
          @copy-node="$emit('copyNode', $event)"
        />
      </template>

      <!-- For arrays: render items with index -->
      <template v-else-if="isArray">
        <template v-for="(childItem, childIndex) in props.data" :key="String(childIndex)">
          <!-- Primitive values: display inline -->
          <div v-if="isPrimitiveValue(childItem)" class="array-item">
            <div class="json-tree-node-item">
              <div class="node-header">
                <div class="node-key-line">
                  <span class="expand-btn-placeholder"></span>
                  <span class="node-index">{{ childIndex }}:</span>
                  <span class="node-value" :class="getValueType(childItem)">
                    {{ getDisplayValue(childItem) }}
                  </span>
                  <div class="primitive-actions">
                    <span class="copy-text" @click.stop="$emit('copyNode', { path: [...path, String(childIndex)], data: childItem })">
                      复制
                    </span>
                    <span class="delete-text" @click.stop="$emit('deleteNode', [...path, String(childIndex)])">
                      删除
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Complex values (objects/arrays): display inline with expand -->
          <div v-else class="array-item">
            <div class="json-tree-node-item">
              <div class="node-header">
                <div class="node-key-line">
                  <!-- Expand/collapse button -->
                  <span
                    class="expand-btn"
                    @click.stop="toggleChildExpand(childIndex)"
                  >
                    <el-icon v-if="isChildExpanded(childIndex)">
                      <ArrowDown />
                    </el-icon>
                    <el-icon v-else>
                      <ArrowRight />
                    </el-icon>
                  </span>

                  <!-- Index -->
                  <span class="node-index">{{ childIndex }}:</span>

                  <!-- Value summary -->
                  <span class="node-value value-summary">
                    {{ getObjectSummary(childItem) }}
                  </span>

                  <!-- Actions -->
                  <div class="node-actions">
                    <span class="copy-text" @click.stop="$emit('copyNode', { path: [...path, String(childIndex)], data: childItem })">
                      复制
                    </span>
                    <span class="delete-text" @click.stop="$emit('deleteNode', [...path, String(childIndex)])">
                      删除
                    </span>
                  </div>
                </div>
              </div>

              <!-- Children (expanded content) -->
              <div v-if="isChildExpanded(childIndex)" class="node-children">
                <!-- For object -->
                <template v-if="childItem !== null && typeof childItem === 'object' && !Array.isArray(childItem)">
                  <template v-for="grandchildKey in Object.keys(childItem)" :key="grandchildKey">
                    <JsonTreeNodeItem
                      :data="childItem[grandchildKey]"
                      :node-key="grandchildKey"
                      :index="-1"
                      :path="[...path, String(childIndex), grandchildKey]"
                      :expanded="expanded"
                      @toggle-expand="$emit('toggleExpand', $event)"
                      @update-value="$emit('updateValue', $event)"
                      @update-key="$emit('updateKey', $event)"
                      @delete-node="$emit('deleteNode', $event)"
                      @add-item="$emit('addItem', $event)"
                      @copy-node="$emit('copyNode', $event)"
                    />
                  </template>
                </template>

                <!-- For array -->
                <template v-else-if="Array.isArray(childItem)">
                  <JsonTreeNodeItem
                    :data="childItem"
                    :node-key="undefined"
                    :index="-1"
                    :path="[...path, String(childIndex)]"
                    :expanded="expanded"
                    @toggle-expand="$emit('toggleExpand', $event)"
                    @update-value="$emit('updateValue', $event)"
                    @update-key="$emit('updateKey', $event)"
                    @delete-node="$emit('deleteNode', $event)"
                    @add-item="$emit('addItem', $event)"
                    @copy-node="$emit('copyNode', $event)"
                  />
                </template>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps<{
  data: any
  nodeKey?: string
  index: number
  path: string[]
  expanded: Set<string>
}>()

const emit = defineEmits<{
  toggleExpand: [path: string[]]
  updateValue: [{ path: string[], value: any }]
  updateKey: [{ path: string[], oldKey: string, newKey: string }]
  deleteNode: [path: string[]]
  addItem: [path: string[]]
  copyNode: [{ path: string[], data: any }]
}>()

const nodeRef = ref()
const isHovered = ref(false)
const isEditing = ref(false)
const editValue = ref('')
const editInput = ref()
const isEditingKey = ref(false)
const editKeyValue = ref('')
const editKeyInput = ref()

// 处理鼠标悬停
const handleMouseOver = (e: MouseEvent) => {
  e.stopPropagation()
  isHovered.value = true
  // 给当前节点添加 is-hovered 类
  nodeRef.value?.classList.add('is-hovered')
  // 找到当前节点的所有祖先节点并隐藏它们的按钮
  let ancestor = nodeRef.value?.parentNode
  while (ancestor) {
    if (ancestor.classList && ancestor.classList.contains('json-tree-node-item')) {
      ancestor.classList.remove('is-hovered')
    }
    ancestor = ancestor.parentNode
  }
}

// 处理鼠标离开
const handleMouseOut = (e: MouseEvent) => {
  e.stopPropagation()
  isHovered.value = false
  // 移除当前节点的 is-hovered 类
  nodeRef.value?.classList.remove('is-hovered')
}

const isObject = computed(() => {
  return props.data !== null && typeof props.data === 'object' && !Array.isArray(props.data)
})

const isArray = computed(() => {
  return Array.isArray(props.data)
})

const isPrimitiveValue = (value: any) => {
  return value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    (typeof value === 'object' && Object.keys(value).length === 0 && value.constructor === Object)
}

const isPrimitive = computed(() => {
  return isPrimitiveValue(props.data)
})

// 暴露给模板使用
defineExpose({
  isPrimitiveValue
})

const getDisplayValue = (value: any) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

const getValueType = (value: any) => {
  if (value === null || value === undefined) return 'value-null'
  if (typeof value === 'boolean') return 'value-boolean'
  if (typeof value === 'number') return 'value-number'
  if (typeof value === 'string') return 'value-string'
  return ''
}

const getObjectSummary = (value: any) => {
  if (Array.isArray(value)) {
    return `Array(${value.length})`
  } else if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value)
    return `{${keys.length} keys}`
  }
  return String(value)
}

const isExpanded = computed(() => {
  const key = props.path.join('-')
  return props.expanded.has(key)
})

const displayValue = computed(() => {
  if (props.data === null) return 'null'
  if (props.data === undefined) return 'undefined'
  if (typeof props.data === 'string') return `"${props.data}"`
  return String(props.data)
})

// 判断是否为长文本（超过50个字符或包含换行符）
const isLongText = computed(() => {
  if (!isPrimitive.value) return false
  // 使用原始数据长度判断，而不是 displayValue
  const rawValue = props.data
  if (typeof rawValue === 'string') {
    return rawValue.length > 50 || rawValue.includes('\n')
  }
  const text = displayValue.value
  return text.length > 50
})

const toggleExpand = () => {
  emit('toggleExpand', props.path)
}

const startEditing = () => {
  isEditing.value = true
  editValue.value = String(props.data)
  nextTick(() => {
    editInput.value?.focus()
  })
}

const saveEdit = () => {
  let newValue: any = editValue.value

  // Try to parse as JSON first
  try {
    newValue = JSON.parse(newValue)
  } catch {
    // Keep as string if parsing fails
  }

  emit('updateValue', { path: props.path, value: newValue })
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
  editValue.value = ''
}

const startEditKey = () => {
  isEditingKey.value = true
  editKeyValue.value = props.nodeKey || ''
  nextTick(() => {
    editKeyInput.value?.focus()
  })
}

const saveKeyEdit = () => {
  const newKey = editKeyValue.value.trim()
  if (newKey && newKey !== props.nodeKey) {
    emit('updateKey', {
      path: props.path,
      oldKey: props.nodeKey || '',
      newKey: newKey
    })
  }
  isEditingKey.value = false
}

const cancelKeyEdit = () => {
  isEditingKey.value = false
  editKeyValue.value = ''
}

// 检查子节点是否展开（用于数组中的复杂值）
const isChildExpanded = (childIndex: number) => {
  const childPath = [...props.path, String(childIndex)]
  const key = childPath.join('-')
  return props.expanded.has(key)
}

// 切换子节点展开状态
const toggleChildExpand = (childIndex: number) => {
  const childPath = [...props.path, String(childIndex)]
  emit('toggleExpand', childPath)
}
</script>

<style scoped lang="scss">
.json-tree-node-item {
  margin: 2px 0;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;

  // 悬停时整个节点包括子元素都有背景色
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.node-header {
  display: flex;
  flex-direction: row;  // 默认单行布局
  align-items: center;
  padding: 0;  // 移除 padding，由父元素控制

  // 长文本时使用两行布局
  &.two-line {
    flex-direction: column;
    align-items: flex-start;
  }
}

.node-key-line {
  display: flex;
  align-items: center;
  width: 100%;
}

.node-value-line {
  display: flex;
  align-items: flex-start;
  width: 100%;
  margin-left: 24px;  // 缩进，与 key 对齐

  .node-value {
    flex: 1;
    min-width: 0;
  }
}

.expand-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary);
  }
}

.expand-btn-placeholder {
  width: 20px;
  display: inline-block;
}

.node-index {
  color: #9ca3af;
  font-weight: 400;
  margin-right: 4px;
  user-select: none;
  font-size: 11px;  // 更小一点
  opacity: 0.5;      // 更淡一点，表示是虚拟的
  font-style: italic; // 斜体效果
}

.node-key {
  color: #0369a1;
  font-weight: 600;
  margin-right: 4px;
  user-select: none;
  flex-shrink: 0;        // 确保 key 不会被压缩
  white-space: nowrap;   // 确保 key 不换行

  .key-text {
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.06);
    }
  }
}

.edit-key-input {
  width: 150px;
}

.node-value {
  word-break: break-word;
  overflow-wrap: break-word;

  // 短文本内联显示
  &.inline-value {
    display: inline;
    margin-right: 8px;
  }

  // 对象/数组摘要显示
  &.value-summary {
    color: #f59e0b;
    font-weight: 500;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(245, 158, 11, 0.1);
    }
  }

  .value-text {
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s;

    // 长文本时自动换行
    .two-line & {
      white-space: pre-wrap;
      display: inline-block;
      width: 100%;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.06);
    }
  }

  &.value-string {
    color: #0d9488;
  }

  &.value-number {
    color: #ea580c;
  }

  &.value-boolean {
    color: #7c3aed;
  }

  &.value-null {
    color: #6b7280;
  }

  &.value-object {
    color: #9ca3af;
    font-style: italic;
  }
}

.edit-input {
  width: 100%;
  min-width: 200px;

  // 内联编辑输入框（短文本）
  &.inline-edit-input {
    width: auto;
    min-width: 100px;
    display: inline-block;
  }

  // 文本域编辑输入框（长文本）
  &.textarea-edit-input {
    width: 100%;
    display: block;
    vertical-align: top;
  }

  :deep(.el-input__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    padding: 2px 8px;
  }

  // textarea 特殊样式
  &.textarea-edit-input :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    padding: 4px 8px;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;
  }
}

.node-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;

  .el-button {
    padding: 2px;
    height: 20px;
    width: 20px;
  }

  .delete-text {
    color: #f56565;
    cursor: pointer;
    font-size: 14px;
    margin-left: 8px;
    user-select: none;

    &:hover {
      color: #e53e3e;
      text-decoration: underline;
    }
  }
}

.node-key-line .node-actions {
  // 第一行的操作按钮样式
}

// 长文本操作按钮容器
.long-text-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

// 短文本操作按钮容器
.primitive-actions {
  display: flex;
  gap: 12px;
  margin-left: 8px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

// 复制按钮通用样式
.copy-text {
  color: #3b82f6;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
  user-select: none;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    color: #2563eb;
    text-decoration: underline;
  }
}

// 删除按钮通用样式
.delete-text {
  color: #f56565;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
  user-select: none;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    color: #e53e3e;
    text-decoration: underline;
  }
}

// 悬停时显示当前节点的操作按钮
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .node-actions,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .primitive-actions,
.json-tree-node-item.is-hovered > .node-header > .node-value-line > .long-text-actions,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .node-actions .copy-text,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .node-actions .delete-text,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .primitive-actions .copy-text,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .primitive-actions .delete-text,
.json-tree-node-item.is-hovered > .node-header > .node-value-line > .long-text-actions .copy-text,
.json-tree-node-item.is-hovered > .node-header > .node-value-line > .long-text-actions .delete-text {
  opacity: 1 !important;
}

.node-children {
  margin-left: 24px;
  padding-left: 8px;
  border-left: 1px solid #e5e7eb;
}

.array-item {
  margin: 2px 0;
}
</style>
