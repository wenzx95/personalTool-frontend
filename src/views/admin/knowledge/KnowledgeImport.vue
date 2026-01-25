<template>
  <div class="knowledge-import-page">
    <div class="import-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <h1 class="page-title">导入知识库</h1>
        <el-button @click="goBack">返回</el-button>
      </header>

      <!-- 导入方式选择 -->
      <el-tabs v-model="activeTab" class="import-tabs">
        <!-- ZIP导入 -->
        <el-tab-pane label="ZIP文件" name="zip">
          <ZipImportForm
              :knowledge-bases="knowledgeBases"
              @import="handleZipImport"
              :loading="importing"
          />
        </el-tab-pane>

        <!-- Markdown导入 -->
        <el-tab-pane label="Markdown文件" name="markdown">
          <MarkdownImportForm
              :knowledge-bases="knowledgeBases"
              @import="handleMarkdownImport"
              :loading="importing"
          />
        </el-tab-pane>

        <!-- URL导入 -->
        <el-tab-pane label="语雀URL" name="url">
          <UrlImportForm
              :knowledge-bases="knowledgeBases"
              @import="handleUrlImport"
              :loading="importing"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- 导入进度对话框 -->
      <el-dialog
          v-model="showProgressDialog"
          title="导入中"
          width="500px"
          :close-on-click-modal="false"
          :close-on-press-escape="false"
          :show-close="false"
      >
        <div class="progress-content">
          <el-progress :percentage="importProgress" :status="importStatus" />
          <p class="progress-text">{{ progressText }}</p>
          <p v-if="importDetail" class="progress-detail">{{ importDetail }}</p>
        </div>
      </el-dialog>

      <!-- 导入结果对话框 -->
      <el-dialog v-model="showResultDialog" title="导入完成" width="600px">
        <ImportResultComponent :result="importResult" @confirm="goToKnowledge" />
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyKnowledgeBases, importFromZip, importFromMarkdown, importFromUrl } from '@/api/knowledge'
import type { ImportResult, KnowledgeBase } from '@/api/knowledge'
import ZipImportForm from '@/components/knowledge/ZipImportForm.vue'
import MarkdownImportForm from '@/components/knowledge/MarkdownImportForm.vue'
import UrlImportForm from '@/components/knowledge/UrlImportForm.vue'
import ImportResultComponent from '@/components/knowledge/ImportResult.vue'

const router = useRouter()

// 状态
const activeTab = ref('zip')
const importing = ref(false)
const showProgressDialog = ref(false)
const showResultDialog = ref(false)
const importProgress = ref(0)
const importStatus = ref<'success' | 'exception' | ''>('')
const progressText = ref('')
const importDetail = ref('')
const importResult = ref<ImportResult | null>(null)
const knowledgeBases = ref<KnowledgeBase[]>([])

// 加载知识库列表
const loadKnowledgeBases = async () => {
  try {
    const res = await getMyKnowledgeBases({ page: 1, pageSize: 100 })
    knowledgeBases.value = res.items
  } catch (error) {
    console.error('加载知识库列表失败', error)
  }
}

// ZIP导入
const handleZipImport = async (data: any) => {
  startImport('正在导入ZIP文件...')
  try {
    const result = await importFromZip(data)
    handleImportSuccess(result)
  } catch (error: any) {
    handleImportError(error)
  }
}

// Markdown导入
const handleMarkdownImport = async (data: any) => {
  startImport('正在导入Markdown文件...')
  try {
    const result = await importFromMarkdown(data)
    handleImportSuccess(result)
  } catch (error: any) {
    handleImportError(error)
  }
}

// URL导入
const handleUrlImport = async (data: any) => {
  startImport('正在从URL导入...')
  try {
    const result = await importFromUrl(data)
    handleImportSuccess(result)
  } catch (error: any) {
    handleImportError(error)
  }
}

// 开始导入
const startImport = (text: string) => {
  importing.value = true
  showProgressDialog.value = true
  importProgress.value = 0
  importStatus.value = ''
  progressText.value = text
  importDetail.value = ''

  // 模拟进度
  let progress = 0
  const interval = setInterval(() => {
    if (progress < 90) {
      progress += 10
      importProgress.value = progress
    }
  }, 500)

  // 保存interval ID以便清理
  ;(window as any).progressInterval = interval
}

// 导入成功
const handleImportSuccess = (result: ImportResult) => {
  clearInterval((window as any).progressInterval)
  importProgress.value = 100
  importStatus.value = 'success'
  progressText.value = '导入成功！'

  setTimeout(() => {
    showProgressDialog.value = false
    importResult.value = result
    showResultDialog.value = true
    importing.value = false
  }, 1000)

  ElMessage.success(`导入完成！成功 ${result.successCount} 个，失败 ${result.failureCount} 个`)
}

// 导入失败
const handleImportError = (error: any) => {
  clearInterval((window as any).progressInterval)
  importProgress.value = 100
  importStatus.value = 'exception'
  progressText.value = '导入失败'

  const errorMsg = error.response?.data?.message || error.message || '未知错误'
  importDetail.value = errorMsg

  setTimeout(() => {
    showProgressDialog.value = false
    importing.value = false
  }, 2000)

  ElMessage.error('导入失败: ' + errorMsg)
}

// 返回
const goBack = () => {
  router.back()
}

// 跳转到知识库
const goToKnowledge = () => {
  if (importResult.value) {
    router.push(`/admin/knowledge/edit/${importResult.value.kbId}`)
  }
}

// 页面加载时执行
onMounted(() => {
  loadKnowledgeBases()
})
</script>

<style scoped>
.knowledge-import-page {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.import-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.import-tabs {
  margin-top: 20px;
}

.progress-content {
  padding: 20px 0;
  text-align: center;
}

.progress-text {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
}

.progress-detail {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}
</style>
