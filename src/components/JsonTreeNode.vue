<template>
  <div class="json-tree-node">
    <!-- Render based on data type at root level -->
    <template v-if="Array.isArray(data)">
      <!-- 数组外层结构 -->
      <div class="root-array-wrapper">
        <div class="root-bracket open-bracket">[</div>
        <div class="root-children">
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
        </div>
        <div class="root-bracket close-bracket">]</div>
      </div>
    </template>

    <template v-else-if="typeof data === 'object' && data !== null">
      <!-- 对象外层结构 -->
      <div class="root-object-wrapper">
        <div class="root-bracket open-bracket">{</div>
        <div class="root-children">
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
        </div>
        <div class="root-bracket close-bracket">}</div>
      </div>
    </template>

    <template v-else>
      <!-- 原始值 -->
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

// 根节点数组/对象包装器
.root-array-wrapper,
.root-object-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// 根节点的括号
.root-bracket {
  color: #f59e0b;
  font-weight: bold;
  font-size: 16px;
  user-select: none;
  padding: 2px 0;
}

.open-bracket {
  margin-bottom: 2px;
}

.close-bracket {
  margin-top: 2px;
}

// 根节点的子元素容器
.root-children {
  // 不需要额外样式，子元素自己会处理缩进
}
</style>
