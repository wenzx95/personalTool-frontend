<template>
  <div
    class="json-tree-node-item"
    :class="{ 'is-array-item': isArrayItem, 'is-hovered': isHovered }"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <!-- Node Header -->
    <div class="node-header" :class="{ 'two-line': isPrimitive && isLongText }">
      <!-- Row 1: Key line -->
      <div class="node-key-line">
        <!-- Expand/Collapse Button -->
        <span
          v-if="isObject || isArray"
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
            @click="startEditKey"
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
        <span v-if="isPrimitive && !isLongText" class="node-value inline-value" :class="getValueType()">
          <span
            v-if="!isEditing"
            class="value-text"
            @click="startEditing"
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

        <!-- Delete text (for short primitives) -->
        <span v-if="isPrimitive && !isLongText && path.length > 0" class="delete-text" @click.stop="$emit('deleteNode', path)">删除</span>

        <!-- Actions (only for objects/arrays) -->
        <div v-if="(isObject || isArray) && path.length > 0" class="node-actions">
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
        <span class="node-value" :class="getValueType()">
          <span
            v-if="!isEditing"
            class="value-text"
            @click="startEditing"
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
            class="edit-input"
          />
        </span>
        <!-- Delete button for long text -->
        <span v-if="path.length > 0" class="delete-text long-text-delete" @click.stop="$emit('deleteNode', path)">删除</span>
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
        />
      </template>

      <!-- For arrays: render items with index -->
      <template v-else-if="isArray">
        <JsonTreeNodeItem
          v-for="(childItem, childIndex) in props.data"
          :key="String(childIndex)"
          :data="childItem"
          :index="childIndex"
          :path="[...path, String(childIndex)]"
          :expanded="expanded"
          @toggle-expand="$emit('toggleExpand', $event)"
          @update-value="$emit('updateValue', $event)"
          @delete-node="$emit('deleteNode', $event)"
          @add-item="$emit('addItem', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ArrowDown, ArrowRight, Plus } from '@element-plus/icons-vue'

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
}>()

const isHovered = ref(false)
const isEditing = ref(false)
const editValue = ref('')
const editInput = ref()
const isEditingKey = ref(false)
const editKeyValue = ref('')
const editKeyInput = ref()

// 处理鼠标悬停
const handleMouseOver = (event: MouseEvent) => {
  // 只要鼠标进入当前节点的 .node-header 区域就显示删除按钮
  const target = event.target as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement

  // 检查是否悬停在 .node-header 或其子元素上
  const nodeHeader = currentTarget.querySelector('.node-header')
  if (nodeHeader && nodeHeader.contains(target)) {
    isHovered.value = true
  }
}

// 处理鼠标离开
const handleMouseOut = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement

  // 检查是否离开了 .node-header 区域
  const nodeHeader = currentTarget.querySelector('.node-header')

  // 如果离开了 .node-header 且不是移动到 .node-header 内的其他元素
  if (nodeHeader && (!relatedTarget || !nodeHeader.contains(relatedTarget))) {
    isHovered.value = false
  }
}

const isArrayItem = computed(() => props.index >= 0)

const isObject = computed(() => {
  return props.data !== null && typeof props.data === 'object' && !Array.isArray(props.data)
})

const isArray = computed(() => {
  return Array.isArray(props.data)
})

const isPrimitive = computed(() => {
  return props.data === null ||
    typeof props.data !== 'object' ||
    (typeof props.data === 'object' && Object.keys(props.data).length === 0 && props.data.constructor === Object)
})

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

const getValueType = () => {
  if (props.data === null || props.data === undefined) return 'value-null'
  if (typeof props.data === 'boolean') return 'value-boolean'
  if (typeof props.data === 'number') return 'value-number'
  if (typeof props.data === 'string') return 'value-string'
  return ''
}

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
</script>

<style scoped lang="scss">
.json-tree-node-item {
  margin: 2px 0;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  // 悬停时整个节点包括子元素都有背景色
  &.is-hovered {
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
  color: #8b5cf6;
  font-weight: 600;
  margin-right: 4px;
  user-select: none;
  font-size: 12px;  // 稍微小一点
  opacity: 0.7;      // 稍微淡一点，表示是虚拟的
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

  :deep(.el-input__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    padding: 2px 8px;
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

// 悬停在整个节点时显示操作按钮
.json-tree-node-item.is-hovered .node-actions {
  opacity: 1;
}

// Delete text outside actions (for primitives)
.node-header {
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
}

// 悬停时显示删除按钮（只有该节点本身）
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .delete-text,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .inline-value ~ .delete-text,
.json-tree-node-item.is-hovered > .node-header > .node-key-line > .node-actions > .delete-text {
  opacity: 1;
}

// 长文本删除按钮样式
.long-text-delete {
  color: #f56565;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
  user-select: none;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #e53e3e;
    text-decoration: underline;
  }
}

// 悬停时显示长文本删除按钮（只有该节点本身）
.json-tree-node-item.is-hovered > .node-header > .node-value-line > .long-text-delete {
  opacity: 1;
}

.node-children {
  margin-left: 24px;
  padding-left: 8px;
  border-left: 1px solid #e5e7eb;
}
</style>
