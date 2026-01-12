<template>
  <div class="json-tree-node">
    <!-- Render based on data type at root level -->
    <template v-if="Array.isArray(data)">
      <JsonTreeNodeItem
        v-for="(item, index) in data"
        :key="String(index)"
        :data="item"
        :index="index"
        :path="[String(index)]"
        :expanded="expanded"
        @toggle-expand="$emit('toggleExpand', $event)"
        @update-value="$emit('updateValue', $event)"
        @update-key="$emit('updateKey', $event)"
        @delete-node="$emit('deleteNode', $event)"
        @add-item="$emit('addItem', $event)"
        @copy-node="$emit('copyNode', $event)"
      />
    </template>

    <template v-else-if="typeof data === 'object' && data !== null">
      <JsonTreeNodeItem
        v-for="(value, key) in data"
        :key="String(key)"
        :data="value"
        :node-key="String(key)"
        :index="-1"
        :path="[String(key)]"
        :expanded="expanded"
        @toggle-expand="$emit('toggleExpand', $event)"
        @update-value="$emit('updateValue', $event)"
        @update-key="$emit('updateKey', $event)"
        @delete-node="$emit('deleteNode', $event)"
        @add-item="$emit('addItem', $event)"
        @copy-node="$emit('copyNode', $event)"
      />
    </template>

    <template v-else>
      <JsonTreeNodeItem
        :data="data"
        :index="-1"
        :path="[]"
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
</template>

<script setup lang="ts">
import JsonTreeNodeItem from './JsonTreeNodeItem.vue'

defineProps<{
  data: any
  path: string[]
  expanded: Set<string>
}>()

defineEmits<{
  toggleExpand: [path: string[]]
  updateValue: [{ path: string[], value: any }]
  updateKey: [{ path: string[], oldKey: string, newKey: string }]
  deleteNode: [path: string[]]
  addItem: [path: string[]]
  copyNode: [{ path: string[], data: any }]
}>()
</script>

<style scoped lang="scss">
.json-tree-node {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
