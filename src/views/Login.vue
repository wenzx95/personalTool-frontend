<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
          <rect width="24" height="24" rx="6" fill="#409EFF"/>
          <path d="M7 8h10M7 12h10M7 16h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <circle cx="18" cy="16" r="3" fill="white"/>
          <path d="M18 14.5v3M18 15.5l1.5-1.5M18 16.5l-1.5 1.5" stroke="#409EFF" stroke-width="1" stroke-linecap="round"/>
        </svg>
        <h1 class="login-title">工具集</h1>
        <p class="login-subtitle">个人效率工具平台</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button
            size="large"
            @click="handleSkip"
            class="skip-button"
          >
            跳过，前往工具集
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-text size="small" type="info">个人工具集 · 效率提升平台</el-text>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login(loginForm.username, loginForm.password)

      console.log('[Login] Login successful')
      console.log('[Login] User store:', userStore.user)
      console.log('[Login] Is logged in:', userStore.isLoggedIn)
      console.log('[Login] Token in localStorage:', localStorage.getItem('token'))

      ElMessage.success('登录成功')

      // Redirect to the page user was trying to access, or default to tools/json
      const redirect = (route.query.redirect as string) || '/tools/json'
      router.push(redirect)
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      loading.value = false
    }
  })
}

const handleSkip = () => {
  router.push('/tools/json')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
  padding: var(--spacing-lg);
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.logo-icon {
  width: 48px;
  height: 48px;
  color: var(--color-primary);
  margin: 0 auto var(--spacing-md);
}

.login-title {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.login-form {
  margin-top: var(--spacing-xl);
}

.login-button {
  width: 100%;
}

.skip-button {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}
</style>
