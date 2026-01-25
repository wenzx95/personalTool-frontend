<template>
  <div class="zip-import-form">
    <el-form :model="form" label-width="120px">
      <!-- 导入位置选择 -->
      <el-form-item label="导入到">
        <el-radio-group v-model="importTarget">
          <el-radio :value="0">新知识库</el-radio>
          <el-radio :value="1">现有知识库</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 新知识库信息 -->
      <template v-if="importTarget === 0">
        <el-form-item label="知识库名称" required>
          <el-input
              v-model="form.newKbTitle"
              placeholder="请输入知识库名称"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
              v-model="form.newKbDescription"
              type="textarea"
              :rows="3"
              placeholder="请输入知识库描述"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类" clearable>
            <el-option label="技术文档" value="技术文档" />
            <el-option label="学习笔记" value="学习笔记" />
            <el-option label="项目文档" value="项目文档" />
            <el-option label="个人知识" value="个人知识" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 现有知识库选择 -->
      <el-form-item v-else label="选择知识库" required>
        <el-select
            v-model="form.kbId"
            placeholder="请选择知识库"
            filterable
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

      <!-- 文件上传 -->
      <el-form-item label="ZIP文件" required>
        <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".zip"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
            class="upload-area"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽ZIP文件到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传语雀导出的ZIP文件，包含Markdown文件（如 1_标题.md）
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button
            type="primary"
            @click="handleImport"
            :loading="loading"
            :disabled="!canImport"
            size="large"
        >
          开始导入
        </el-button>
        <el-button @click="handleReset" :disabled="loading">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { KnowledgeBase } from '@/api/knowledge'

interface Props {
  knowledgeBases: KnowledgeBase[]
  loading: boolean
}

interface Emits {
  (e: 'import', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const importTarget = ref<0 | 1>(0)
const form = ref({
  kbId: undefined as number | undefined,
  newKbTitle: '',
  newKbDescription: '',
  category: '',
  tags: ''
})
const uploadRef = ref()
const uploadedFile = ref<File | null>(null)

// 是否可以导入
const canImport = computed(() => {
  // 检查是否有文件
  if (!uploadedFile.value) {
    return false
  }

  // 检查新知识库标题
  if (importTarget.value === 0 && !form.value.newKbTitle.trim()) {
    return false
  }

  // 检查现有知识库选择
  if (importTarget.value === 1 && !form.value.kbId) {
    return false
  }

  return true
})

// 文件改变
const handleFileChange = (file: any) => {
  uploadedFile.value = file.raw
}

// 文件移除
const handleFileRemove = () => {
  uploadedFile.value = null
}

// 导入
const handleImport = () => {
  if (!canImport.value) {
    return
  }

  const data = {
    file: uploadedFile.value!,
    kbId: importTarget.value === 1 ? form.value.kbId : undefined,
    newKbTitle: importTarget.value === 0 ? form.value.newKbTitle : undefined,
    newKbDescription: importTarget.value === 0 ? form.value.newKbDescription : undefined,
    category: importTarget.value === 0 ? form.value.category : undefined,
    tags: importTarget.value === 0 ? form.value.tags : undefined
  }

  emit('import', data)
}

// 重置
const handleReset = () => {
  importTarget.value = 0
  form.value = {
    kbId: undefined,
    newKbTitle: '',
    newKbDescription: '',
    category: '',
    tags: ''
  }
  uploadedFile.value = null
  uploadRef.value?.clearFiles()
}
</script>

<style scoped>
.zip-import-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;
}

.upload-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 40px;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #409eff;
}

.el-upload__text {
  font-size: 14px;
  color: #606266;
  margin-top: 10px;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
}

.el-upload__tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
