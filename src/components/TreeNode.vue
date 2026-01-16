<template>
  <div
    class="tree-node"
    :class="diffClass"
    :data-path="node.path"
    :data-side="side"
    @click="handleClick"
  >
    <!-- 缩进 -->
    <span
      class="indent"
      :style="{ paddingLeft: depth * 16 + 'px' }"
    ></span>

    <!-- 展开/收起按钮 -->
    <span
      v-if="hasChildren"
      class="toggle"
      @click.stop="toggle"
    >
      {{ expanded ? '▼' : '▶' }}
    </span>
    <span v-else class="toggle-placeholder"></span>

    <!-- Key -->
    <span class="key">{{ node.key }}</span>

    <!-- 分隔符 -->
    <span class="separator">:</span>

    <!-- Value 或 子节点 -->
    <template v-if="node.type === 'value'">
      <span class="value" :class="getValueClass(node.value)">
        {{ formatValue(node.value) }}
      </span>
      <span class="comma">,</span>
    </template>

    <template v-else>
      <!-- 对象或数组 -->
      <span class="bracket">{{ node.type === 'array' ? '[' : '{' }}</span>
      <span v-if="!expanded" class="ellipsis">
        {{ node.type === 'array' ? `${node.children?.length || 0} items` : `${node.children?.length || 0} keys` }}
      </span>
      <span class="bracket">{{ node.type === 'array' ? ']' : '}' }}</span>
      <span class="comma">,</span>
    </template>
  </div>

  <!-- 子节点（展开时显示） -->
  <template v-if="hasChildren && expanded">
    <TreeNode
      v-for="child in node.children"
      :key="child.path"
      :node="child"
      :diffs="diffs"
      :side="side"
      :depth="depth + 1"
      @diffClick="$emit('diffClick', $event)"
    />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import type { TreeNode, DiffItem } from '@/utils/jsonComparator'

interface Props {
  node: TreeNode
  diffs: DiffItem[]
  side: 'left' | 'right'
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
})

const emit = defineEmits<{
  diffClick: [diff: DiffItem]
}>()

const expanded = ref(props.node.expanded ?? false)

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

// 根据差异类型应用样式
const diffClass = computed(() => {
  const diff = props.diffs.find(d => d.path === props.node.path)
  if (!diff) return ''

  // 根据差异类型和侧边应用不同的样式
  if (props.side === 'left') {
    switch (diff.type) {
      case 'removed':
        return 'diff-removed'
      case 'missing':
        return 'diff-missing'
      case 'modified':
      case 'key-changed':
        return 'diff-modified'
    }
  } else {
    // right side
    switch (diff.type) {
      case 'added':
        return 'diff-added'
      case 'modified':
        return 'diff-modified'
      case 'key-changed':
        return 'diff-key-changed'
    }
  }

  return ''
})

const toggle = () => {
  expanded.value = !expanded.value
}

const handleClick = () => {
  const diff = props.diffs.find(d => d.path === props.node.path)
  if (diff) {
    emit('diffClick', diff)
  }
}

const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

const getValueClass = (value: any): string => {
  if (value === null) return 'literal-null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return ''
}
</script>

<style scoped lang="scss">
.tree-node {
  display: flex;
  align-items: flex-start;
  padding: 2px 4px;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  white-space: nowrap;

  &:hover {
    background-color: #f5f7fa;
  }

  &.diff-highlight {
    outline: 2px solid #2196F3;
    outline-offset: 1px;
  }

  // Git 风格差异配色
  &.diff-added {
    background-color: #d4edda;  // 绿色背景（新增）
    border-left: 3px solid #28a745;
  }

  &.diff-removed {
    background-color: #f8d7da;  // 红色背景（删除）
    border-left: 3px solid #dc3545;
  }

  &.diff-modified {
    background-color: #fff3cd;  // 橙色背景（修改）
    border-left: 3px solid #ffc107;
  }

  &.diff-key-changed {
    background-color: #ffeaa7;  // 黄色背景（key 变化）
    border-left: 3px solid #fd7e14;
  }

  &.diff-missing {
    background-color: #e7f3ff;  // 蓝色背景（缺失）
    border-left: 3px solid #007bff;
  }
}

.indent {
  display: inline-block;
  flex-shrink: 0;
}

.toggle {
  display: inline-block;
  width: 16px;
  text-align: center;
  cursor: pointer;
  color: #909399;
  user-select: none;
  flex-shrink: 0;

  &:hover {
    color: #409EFF;
  }
}

.toggle-placeholder {
  display: inline-block;
  width: 16px;
  flex-shrink: 0;
}

.key {
  color: #e06c75;  // 红色（key）
  margin-right: 4px;
}

.separator {
  color: #606266;
  margin-right: 4px;
}

.value {
  &.string {
    color: #98c379;  // 绿色（字符串）
  }

  &.number {
    color: #d19a66;  // 橙色（数字）
  }

  &.boolean {
    color: #c678dd;  // 紫色（布尔）
  }

  &.literal-null {
    color: #e5c07b;  // 黄色（null）
  }
}

.bracket {
  color: #606266;
}

.ellipsis {
  color: #909399;
  margin-left: 4px;
  font-style: italic;
}

.comma {
  color: #606266;
  margin-left: 2px;
}
</style>
