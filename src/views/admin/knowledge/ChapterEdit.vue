<template>
  <div class="chapter-edit-page" v-loading="loading">
    <div class="edit-container">
      <!-- 页面头部 -->
      <header class="edit-header">
        <div class="header-left">
          <el-button link @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="title-info">
            <h1 class="page-title">{{ isEdit ? '编辑章节' : '添加章节' }}</h1>
            <span v-if="knowledgeBase" class="kb-name">知识库：{{ knowledgeBase.title }}</span>
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
          class="chapter-form"
        >
          <!-- 基本信息卡片 -->
          <div class="form-section">
            <div class="section-title">
              <el-icon><Edit /></el-icon>
              <span>基本信息</span>
            </div>

            <div class="form-row">
              <el-form-item label="父章节" prop="parentId">
                <el-tree-select
                  v-model="form.parentId"
                  :data="chapterTreeOptions"
                  :props="{ label: 'title', value: 'id', children: 'children' }"
                  placeholder="选择父章节（不选则为根章节）"
                  clearable
                  check-strictly
                  size="large"
                  style="width: 100%"
                  :render-after-expand="false"
                />
              </el-form-item>

              <el-form-item label="排序序号" prop="sortOrder">
                <el-input-number
                  v-model="form.sortOrder"
                  :min="0"
                  :max="9999"
                  size="large"
                  controls-position="right"
                  style="width: 150px"
                />
                <div class="form-tip">数值越小排序越靠前</div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="章节标题" prop="title" class="title-item">
                <el-input
                  v-model="form.title"
                  placeholder="请输入章节标题（必填）"
                  maxlength="200"
                  show-word-limit
                  size="large"
                  clearable
                />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="内容类型" prop="contentType">
                <el-radio-group v-model="form.contentType" size="large">
                  <el-radio value="markdown">
                    <span class="radio-label">
                      <el-icon><Document /></el-icon>
                      独立内容
                      <span class="radio-desc">直接编写 Markdown 内容</span>
                    </span>
                  </el-radio>
                  <el-radio value="reference">
                    <span class="radio-label">
                      <el-icon><Link /></el-icon>
                      引用博客
                      <span class="radio-desc">引用已有博客文章</span>
                    </span>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
          </div>

          <!-- 独立内容卡片 -->
          <div v-if="form.contentType === 'markdown'" class="form-section content-section">
            <div class="section-title">
              <el-icon><Document /></el-icon>
              <span>章节内容</span>
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

          <!-- 引用博客卡片 -->
          <div v-if="form.contentType === 'reference'" class="form-section">
            <div class="section-title">
              <el-icon><Link /></el-icon>
              <span>选择博客</span>
              <el-tag v-if="!form.blogId" type="danger" size="small" effect="plain">必填</el-tag>
            </div>

            <div class="form-row">
              <el-form-item label="选择博客文章" prop="blogId">
                <el-select
                  v-model="form.blogId"
                  filterable
                  remote
                  :remote-method="searchBlogs"
                  :loading="searchingBlogs"
                  placeholder="搜索博客标题"
                  size="large"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="blog in blogOptions"
                    :key="blog.id"
                    :label="blog.title"
                    :value="blog.id"
                  >
                    <div class="blog-option">
                      <div class="blog-title">{{ blog.title }}</div>
                      <div class="blog-meta">{{ blog.category }} · {{ formatRelativeTime(blog.createTime) }}</div>
                    </div>
                  </el-option>
                </el-select>
                <div class="form-tip">搜索并选择要引用的博客文章</div>
              </el-form-item>
            </div>

            <!-- 预览 -->
            <div v-if="selectedBlog" class="blog-preview">
              <h4>博客内容预览</h4>
              <div class="preview-meta">
                <el-tag size="small" type="info">{{ selectedBlog.category }}</el-tag>
                <span class="preview-time">{{ formatRelativeTime(selectedBlog.createTime) }}</span>
              </div>
              <p v-if="selectedBlog.summary" class="preview-summary">{{ selectedBlog.summary }}</p>
              <div class="preview-stats">
                <span>{{ formatWordCount(selectedBlog.content?.length) }}</span>
              </div>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  Select,
  Edit,
  Document,
  Link
} from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  getKnowledgeBaseDetail,
  getChapterTree,
  createChapter,
  updateChapter,
  getChapterDetail,
  type KnowledgeBase,
  type ChapterTree,
  type ChapterCreateRequest,
  type ChapterUpdateRequest,
  type Chapter
} from '@/api/knowledge'
import { getBlogList, type Blog } from '@/api/blog'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)

const isEdit = ref(false)
const kbId = ref<number>()
const chapterId = ref<number>()
const knowledgeBase = ref<KnowledgeBase>()
const chapterTree = ref<ChapterTree[]>([])
const blogOptions = ref<Blog[]>([])
const searchingBlogs = ref(false)

const form = ref<ChapterCreateRequest>({
  parentId: undefined,
  title: '',
  content: '',
  contentType: 'markdown',
  blogId: undefined,
  sortOrder: 0
})

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

// 章节树选项（排除自己和子孙节点）
const chapterTreeOptions = computed(() => {
  if (!isEdit.value) return chapterTree.value

  // 编辑模式下，需要排除当前节点及其子孙节点
  const excludeIds = new Set<number>()
  const collectDescendantIds = (node: ChapterTree) => {
    excludeIds.add(node.id)
    node.children?.forEach(child => collectDescendantIds(child))
  }

  const findAndExclude = (nodes: ChapterTree[]): ChapterTree[] => {
    const result: ChapterTree[] = []
    for (const node of nodes) {
      if (node.id === chapterId.value) {
        collectDescendantIds(node)
      } else {
        const filtered = {
          ...node,
          children: node.children ? findAndExclude(node.children) : undefined
        }
        result.push(filtered)
      }
    }
    return result
  }

  return findAndExclude(chapterTree.value)
})

const rules = ref<FormRules>({
  title: [
    { required: true, message: '请输入章节标题', trigger: 'blur' },
    { max: 200, message: '标题长度不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入章节内容', trigger: 'blur' },
    { min: 10, message: '章节内容至少10个字符', trigger: 'blur' }
  ],
  blogId: [
    { required: true, message: '请选择要引用的博客', trigger: 'change' }
  ]
})

// 当内容类型变化时，调整验证规则
watch(() => form.value.contentType, (newType) => {
  if (newType === 'markdown') {
    rules.value.content = [
      { required: true, message: '请输入章节内容', trigger: 'blur' },
      { min: 10, message: '章节内容至少10个字符', trigger: 'blur' }
    ]
    rules.value.blogId = []
    form.value.blogId = undefined
  } else {
    rules.value.content = []
    rules.value.blogId = [
      { required: true, message: '请选择要引用的博客', trigger: 'change' }
    ]
    form.value.content = ''
  }
})

// 选中的博客
const selectedBlog = computed(() => {
  if (!form.value.blogId) return null
  return blogOptions.value.find(b => b.id === form.value.blogId)
})

const fetchKnowledgeBase = async () => {
  const id = Number(route.params.kbId)
  if (!id) return

  loading.value = true
  try {
    const [kb, tree] = await Promise.all([
      getKnowledgeBaseDetail(id),
      getChapterTree(id)
    ])

    kbId.value = id
    knowledgeBase.value = kb
    chapterTree.value = tree
  } catch (error: any) {
    ElMessage.error(error.message || '获取知识库信息失败')
  } finally {
    loading.value = false
  }
}

const fetchChapterDetail = async () => {
  const id = Number(route.params.chapterId)
  if (!id) return

  loading.value = true
  try {
    const chapter = await getChapterDetail(kbId.value!, id)
    chapterId.value = id
    form.value = {
      parentId: chapter.parentId || undefined,
      title: chapter.title,
      content: chapter.content || '',
      contentType: chapter.contentType || 'markdown',
      blogId: chapter.blogId,
      sortOrder: chapter.sortOrder || 0
    }

    // 如果是引用博客，加载博客列表
    if (chapter.blogId) {
      await searchBlogs('')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取章节详情失败')
  } finally {
    loading.value = false
  }
}

const searchBlogs = async (query: string) => {
  searchingBlogs.value = true
  try {
    const result = await getBlogList({
      keyword: query || undefined,
      status: 'published',
      orderBy: 'createTime',
      orderDirection: 'desc',
      pageNum: 1,
      pageSize: 20
    })
    blogOptions.value = result.items
  } catch (error: any) {
    ElMessage.error(error.message || '搜索博客失败')
  } finally {
    searchingBlogs.value = false
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
    if (isEdit.value && chapterId.value) {
      await updateChapter(kbId.value!, chapterId.value, form.value as ChapterUpdateRequest)
      ElMessage.success('章节更新成功')
    } else {
      await createChapter(kbId.value!, form.value)
      ElMessage.success('章节创建成功')
    }
    goBack()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  if (form.value.title || form.value.content) {
    ElMessage.info('如需放弃修改，请直接点击返回按钮')
  } else {
    goBack()
  }
}

const handleUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  // TODO: 实现图片上传逻辑
  const urls = files.map(file => URL.createObjectURL(file))
  ElMessage.warning('图片上传功能待实现，当前使用临时URL')
  callback(urls)
}

const goBack = () => {
  router.push(`/knowledge/${kbId.value}`)
}

const formatWordCount = (count?: number) => {
  if (!count) return '0 字'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万字'
  }
  return count + '字'
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}月前`
  return `${Math.floor(days / 365)}年前`
}

onMounted(() => {
  if (route.params.kbId) {
    fetchKnowledgeBase()
  }
  if (route.params.chapterId) {
    isEdit.value = true
    fetchChapterDetail()
  }
})
</script>

<style scoped lang="scss">
.chapter-edit-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.edit-container {
  max-width: 1000px;
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

.kb-name {
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

.chapter-form {
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

.blog-option {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .blog-title {
    font-size: 14px;
    color: #303133;
  }

  .blog-meta {
    font-size: 12px;
    color: #909399;
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

.blog-preview {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
  }

  .preview-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .preview-time {
    font-size: 12px;
    color: #909399;
  }

  .preview-summary {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    margin: 0 0 12px 0;
  }

  .preview-stats {
    font-size: 12px;
    color: #909399;
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
}
</style>
