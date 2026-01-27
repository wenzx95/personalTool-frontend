<template>
  <div class="blog-edit-page" v-loading="loading">
    <div class="edit-container">
      <!-- 页面头部 -->
      <header class="edit-header">
        <div class="header-left">
          <el-button link @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="title-info">
            <h1 class="page-title">{{ isEdit ? '编辑博客' : '新建博客' }}</h1>
            <span v-if="lastSaveTime" class="last-save">
              {{ lastSaveTime }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="saveDraft" :loading="saving" size="large">
            <el-icon><DocumentCopy /></el-icon>
            保存草稿
          </el-button>
          <el-button type="primary" @click="publish" :loading="saving" size="large">
            <el-icon><Promotion /></el-icon>
            {{ isEdit && form.status === 'published' ? '更新发布' : '发布文章' }}
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
          class="blog-form"
        >
          <!-- 基本信息卡片 -->
          <div class="form-section">
            <div class="section-title">
              <el-icon><Edit /></el-icon>
              <span>基本信息</span>
            </div>

            <div class="form-row">
              <el-form-item label="文章标题" prop="title" class="title-item">
                <el-input
                  v-model="form.title"
                  placeholder="请输入文章标题（必填）"
                  maxlength="200"
                  show-word-limit
                  size="large"
                  clearable
                />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="文章分类" prop="category">
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

              <el-form-item label="文章标签" prop="tags">
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
                </div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="文章摘要" prop="summary">
                <el-input
                  v-model="form.summary"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入文章摘要，简要描述文章内容（可选）"
                  maxlength="500"
                  show-word-limit
                  resize="none"
                />
              </el-form-item>
            </div>

            <div class="form-row options-row">
              <el-checkbox v-model="form.isTop" :true-label="1" :false-label="0" size="large">
                <span class="checkbox-label">
                  <el-icon><Top /></el-icon>
                  置顶文章
                </span>
              </el-checkbox>
              <el-checkbox v-model="form.isRecommended" :true-label="1" :false-label="0" size="large">
                <span class="checkbox-label">
                  <el-icon><Star /></el-icon>
                  推荐文章
                </span>
              </el-checkbox>
            </div>
          </div>

          <!-- 文章内容卡片 -->
          <div class="form-section content-section">
            <div class="section-title">
              <el-icon><Document /></el-icon>
              <span>文章内容</span>
              <el-tag v-if="!form.content" type="danger" size="small" effect="plain">必填</el-tag>
            </div>

            <el-form-item prop="content" class="content-item">
              <MdEditor
                v-model="form.content"
                :toolbars="toolbars"
                @onUploadImg="handleUploadImg"
                :placeholder="editorPlaceholder"
                class="markdown-editor"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  DocumentCopy,
  Promotion,
  Edit,
  Reading,
  TrendCharts,
  Briefcase,
  Memo,
  Picture,
  Top,
  Star,
  Document
} from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  createBlog,
  updateBlog,
  getBlogDetail,
  type Blog,
  type BlogCreateRequest,
  type BlogUpdateRequest
} from '@/api/blog'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const lastSaveTime = ref('')

const isEdit = ref(false)
const blogId = ref<number>()

const form = ref<BlogCreateRequest & { status?: string }>({
  title: '',
  content: '',
  summary: '',
  coverImage: '',
  category: '',
  tags: [],
  isTop: 0,
  isRecommended: 0
})

const commonTags = [
  '缠论', '走势', '背驰', '中枢', '买卖点',
  '实战', '案例分析', '技术分析', '交易策略',
  '线段', '笔', '分型', '盘整', '趋势'
]

const toolbars = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  '-',
  'revoke',
  'next',
  'save',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'htmlPreview',
  'catalog'
]

const editorPlaceholder = `开始写作...

支持 Markdown 语法：
# 一级标题
## 二级标题
**粗体** *斜体*
> 引用
\`代码\`
[链接](url)

祝你写作愉快！✨`

const rules = ref<FormRules>({
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { max: 200, message: '标题长度不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 10, message: '文章内容至少10个字符', trigger: 'blur' }
  ],
  summary: [
    { max: 500, message: '摘要长度不能超过500个字符', trigger: 'blur' }
  ]
})

const updateSaveTime = () => {
  const now = new Date()
  lastSaveTime.value = `上次保存：${now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

const fetchBlogDetail = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const blog = await getBlogDetail(id)
    blogId.value = blog.id
    form.value = {
      title: blog.title,
      content: blog.content,
      summary: blog.summary || '',
      coverImage: blog.coverImage || '',
      category: blog.category || '',
      tags: blog.tags || [],
      isTop: blog.isTop || 0,
      isRecommended: blog.isRecommended || 0,
      status: blog.status
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章详情失败')
  } finally {
    loading.value = false
  }
}

const saveDraft = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (isEdit.value && blogId.value) {
      await updateBlog(blogId.value, {
        ...form.value,
        status: 'draft'
      } as BlogUpdateRequest)
      ElMessage.success('草稿保存成功')
    } else {
      const blog = await createBlog({
        ...form.value
      } as BlogCreateRequest)
      blogId.value = blog.id
      isEdit.value = true
      ElMessage.success('草稿创建成功')
    }
    updateSaveTime()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const publish = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (isEdit.value && blogId.value) {
      await updateBlog(blogId.value, {
        ...form.value,
        status: 'published'
      } as BlogUpdateRequest)
      ElMessage.success('发布成功')
    } else {
      const blog = await createBlog({
        ...form.value
      } as BlogCreateRequest)
      blogId.value = blog.id
      ElMessage.success('发布成功')
    }
    goBack()
  } catch (error: any) {
    ElMessage.error(error.message || '发布失败')
  } finally {
    saving.value = false
  }
}

const handleUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  // TODO: 实现图片上传逻辑
  // 可以上传到OSS或本地存储
  const urls = files.map(file => URL.createObjectURL(file))
  ElMessage.warning('图片上传功能待实现，当前使用临时URL')
  callback(urls)
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  if (route.params.id) {
    isEdit.value = true
    fetchBlogDetail()
  }
})
</script>

<style scoped lang="scss">
.blog-edit-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.edit-container {
  max-width: 1200px;
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

.blog-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  &.content-section {
    padding: 0;
    overflow: hidden;
  }
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

  img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    display: block;
  }
}

.options-row {
  display: flex;
  gap: 32px;
  padding-top: 8px;

  :deep(.el-checkbox__label) {
    font-size: 14px;
  }
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 16px;
  }
}

.content-item {
  width: 100%;

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.markdown-editor {
  width: 100%;

  :deep(.md-editor) {
    border: none;
    border-radius: 0;
    min-height: 600px;

    .md-editor-toolbar-wrapper {
      border-top: none;
      border-left: none;
      border-right: none;
      border-radius: 0;
    }

    .md-editor-content {
      min-height: 550px;
    }

    .md-editor-preview-wrapper {
      border: none;
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .edit-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
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
