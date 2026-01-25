<template>
  <div class="knowledge-edit-page" v-loading="loading">
    <div class="edit-container">
      <!-- 页面头部 -->
      <header class="edit-header">
        <div class="header-left">
          <el-button link @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="title-info">
            <h1 class="page-title">{{ isEdit ? '编辑知识库' : '新建知识库' }}</h1>
            <span v-if="lastSaveTime" class="last-save">
              {{ lastSaveTime }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="handleCancel" size="large">
            取消
          </el-button>
          <el-button type="primary" @click="handleSave" :loading="saving" size="large">
            <el-icon><Select /></el-icon>
            保存
          </el-button>
        </div>
      </header>

      <!-- 编辑表单 -->
      <div class="edit-content">
        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-position="top"
          class="knowledge-form"
        >
          <!-- 基本信息卡片 -->
          <div class="form-section">
            <div class="section-title">
              <el-icon><Edit /></el-icon>
              <span>基本信息</span>
            </div>

            <div class="form-row">
              <el-form-item label="知识库名称" prop="title" class="title-item">
                <el-input
                  v-model="form.title"
                  placeholder="请输入知识库名称（必填）"
                  maxlength="200"
                  show-word-limit
                  size="large"
                  clearable
                />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="知识库描述" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入知识库描述，简要说明知识库的内容和用途（可选）"
                  maxlength="1000"
                  show-word-limit
                  resize="none"
                  size="large"
                />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="分类" prop="category">
                <el-select
                  v-model="form.category"
                  placeholder="选择分类"
                  clearable
                  size="large"
                  style="width: 200px"
                >
                  <el-option label="缠论基础" value="缠论基础">
                    <span class="category-option">
                      <el-icon><Reading /></el-icon>
                      缠论基础
                    </span>
                  </el-option>
                  <el-option label="走势分析" value="走势分析">
                    <span class="category-option">
                      <el-icon><TrendCharts /></el-icon>
                      走势分析
                    </span>
                  </el-option>
                  <el-option label="实战案例" value="实战案例">
                    <span class="category-option">
                      <el-icon><Briefcase /></el-icon>
                      实战案例
                    </span>
                  </el-option>
                  <el-option label="技术总结" value="技术总结">
                    <span class="category-option">
                      <el-icon><Memo /></el-icon>
                      技术总结
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="标签" prop="tags">
                <el-select
                  v-model="form.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或输入标签"
                  size="large"
                  style="width: 100%"
                  :max-collapse-tags="3"
                  collapse-tags
                >
                  <el-option
                    v-for="tag in commonTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  >
                    <span class="tag-option"># {{ tag }}</span>
                  </el-option>
                </el-select>
                <div class="form-tip">可选择已有标签或输入新标签</div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="封面图片" prop="coverImage">
                <el-input
                  v-model="form.coverImage"
                  placeholder="请输入封面图片URL（可选）"
                  clearable
                  size="large"
                >
                  <template #prepend>
                    <el-icon><Picture /></el-icon>
                  </template>
                </el-input>
                <div v-if="form.coverImage" class="cover-preview">
                  <img :src="form.coverImage" alt="封面预览" />
                  <el-button
                    type="danger"
                    size="small"
                    @click="form.coverImage = ''"
                    class="remove-cover-btn"
                  >
                    移除封面
                  </el-button>
                </div>
              </el-form-item>
            </div>

            <div class="form-row options-row">
              <el-form-item label="可见性">
                <el-radio-group v-model="form.isPublic" size="large">
                  <el-radio :value="1">
                    <span class="radio-label">
                      <el-icon><View /></el-icon>
                      公开
                      <span class="radio-desc">所有人可见</span>
                    </span>
                  </el-radio>
                  <el-radio :value="0">
                    <span class="radio-label">
                      <el-icon><Lock /></el-icon>
                      私有
                      <span class="radio-desc">仅自己可见</span>
                    </span>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="排序序号" prop="sortOrder">
                <el-input-number
                  v-model="form.sortOrder"
                  :min="0"
                  :max="9999"
                  size="large"
                  controls-position="right"
                  style="width: 150px"
                />
                <div class="form-tip">数值越小排序越靠前，默认为0</div>
              </el-form-item>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  Select,
  Edit,
  Reading,
  TrendCharts,
  Briefcase,
  Memo,
  Picture,
  View,
  Lock
} from '@element-plus/icons-vue'
import {
  createKnowledgeBase,
  updateKnowledgeBase,
  getKnowledgeBaseDetail,
  type KnowledgeBaseCreateRequest,
  type KnowledgeBaseUpdateRequest
} from '@/api/knowledge'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const lastSaveTime = ref('')

const isEdit = ref(false)
const kbId = ref<number>()

const form = ref<KnowledgeBaseCreateRequest>({
  title: '',
  description: '',
  coverImage: '',
  category: '',
  tags: [],
  isPublic: 1,
  sortOrder: 0
})

const commonTags = [
  '缠论', '走势', '背驰', '中枢', '买卖点',
  '实战', '案例分析', '技术分析', '交易策略',
  '线段', '笔', '分型', '盘整', '趋势',
  '基础', '入门', '进阶', '高级'
]

const rules = ref<FormRules>({
  title: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' },
    { max: 200, message: '标题长度不能超过200个字符', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '描述长度不能超过1000个字符', trigger: 'blur' }
  ]
})

const updateSaveTime = () => {
  const now = new Date()
  lastSaveTime.value = `上次保存：${now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

const fetchKnowledgeBaseDetail = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const kb = await getKnowledgeBaseDetail(id)
    kbId.value = kb.id
    form.value = {
      title: kb.title,
      description: kb.description || '',
      coverImage: kb.coverImage || '',
      category: kb.category || '',
      tags: kb.tags || [],
      isPublic: kb.isPublic ?? 1,
      sortOrder: kb.sortOrder ?? 0
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取知识库详情失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (isEdit.value && kbId.value) {
      await updateKnowledgeBase(kbId.value, form.value as KnowledgeBaseUpdateRequest)
      ElMessage.success('知识库更新成功')
    } else {
      const kb = await createKnowledgeBase(form.value)
      kbId.value = kb.id
      isEdit.value = true
      ElMessage.success('知识库创建成功')
    }
    updateSaveTime()
    // 保存成功后跳转到管理页面
    setTimeout(() => {
      goBack()
    }, 500)
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  if (form.value.title || form.value.description) {
    // 有内容时提示确认
    ElMessage.info('如需放弃修改，请直接点击返回按钮')
  } else {
    goBack()
  }
}

const goBack = () => {
  router.push('/admin/knowledge/list')
}

onMounted(() => {
  if (route.params.id) {
    isEdit.value = true
    fetchKnowledgeBaseDetail()
  }
})
</script>

<style scoped lang="scss">
.knowledge-edit-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.edit-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 页面头部 */
.edit-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  padding: 16px 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 15px;
  padding: 8px 12px;

  .el-icon {
    margin-right: 4px;
  }
}

.title-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.last-save {
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 编辑内容 */
.edit-content {
  padding: 0 24px 24px;
}

.knowledge-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;

  .el-icon {
    font-size: 18px;
    color: #409eff;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 8px;

  &:has(.el-form-item:not(:last-child)) {
    grid-template-columns: repeat(2, 1fr);

    .title-item {
      grid-column: 1 / -1;
    }
  }
}

.title-item {
  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  :deep(.el-input__wrapper) {
    padding: 8px 15px;
  }

  :deep(.el-textarea__inner) {
    padding: 8px 15px;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.category-option,
.tag-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cover-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  position: relative;

  img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    display: block;
  }

  .remove-cover-btn {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}

.options-row {
  display: flex;
  align-items: center;

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.radio-label {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;

  .el-icon {
    font-size: 16px;
    vertical-align: middle;
  }

  .radio-desc {
    font-size: 12px;
    color: #909399;
    margin-left: 20px;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .edit-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-actions {
    justify-content: stretch;

    .el-button {
      flex: 1;
    }
  }

  .edit-content {
    padding: 0 16px 16px;
  }

  .form-row:has(.el-form-item:not(:last-child)) {
    grid-template-columns: 1fr;
  }

  .form-section {
    padding: 16px;
  }

  .options-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
