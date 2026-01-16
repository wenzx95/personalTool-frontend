<template>
  <div class="json-compare-tree">
    <TreeNodeComponent
      v-for="node in data"
      :key="node.path"
      :node="node"
      :diffs="diffs"
      :side="side"
      @diff-click="handleDiffClick"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { TreeNode, DiffItem } from '@/utils/jsonComparator'
import TreeNodeComponent from './TreeNode.vue'

interface Props {
  data: TreeNode[]
  diffs: DiffItem[]
  side: 'left' | 'right'
}

defineProps<Props>()

const emit = defineEmits<{
  diffClick: [diff: DiffItem]
}>()

const handleDiffClick = (diff: DiffItem) => {
  emit('diffClick', diff)
}
</script>

<style scoped lang="scss">
.json-compare-tree {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
}
</style>
