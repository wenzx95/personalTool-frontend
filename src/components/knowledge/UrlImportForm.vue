<template>
  <div class="url-import-form">
    <el-alert
        title="功能开发中"
        type="warning"
        description="从URL导入功能正在开发中，请使用ZIP或Markdown文件导入。"
        :closable="false"
        style="margin-bottom: 20px"
    />

    <el-form :model="form" label-width="120px" disabled>
      <!-- 导入位置选择 -->
      <el-form-item label="导入到">
        <el-radio-group v-model="importTarget">
          <el-radio :value="0">新知识库</el-radio>
          <el-radio :value="1">现有知识库</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 新知识库信息 -->
      <template v-if="importTarget === 0">
        <el-form-item label="知识库名称">
          <el-input
              v-model="form.newKbTitle"
              placeholder="请输入知识库名称"
              disabled
          />
        </el-form-item>
      </template>

      <!-- 现有知识库选择 -->
      <el-form-item v-else label="选择知识库">
        <el-select
            v-model="form.kbId"
            placeholder="请选择知识库"
            filterable
            disabled
            style="width: 100%"
        >
          <el-option
              v-for="kb in knowledgeBases"
              :key="kb.id"
              :label="kb.title"
              :value="kb.id"
          />
        </el-select>
      </el-form-item>

      <!-- URL输入 -->
      <el-form-item label="语雀URL">
        <el-input
            v-model="form.url"
            placeholder="请输入语雀文档URL"
            disabled
        />
        <div class="form-tip">
          示例：https://www.yuque.com/username/reponame/docs/docid
        </div>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" disabled size="large">
          开始导入（开发中）
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { KnowledgeBase } from '@/api/knowledge'

interface Props {
  knowledgeBases: KnowledgeBase[]
  loading: boolean
}

interface Emits {
  (e: 'import', data: any): void
}

const props = defineProps<Props>()
// emit 不需要，因为功能未实现

// 状态
const importTarget = ref<0 | 1>(0)
const form = ref({
  kbId: undefined as number | undefined,
  newKbTitle: '',
  url: ''
})
</script>

<style scoped>
.url-import-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
