<template>
  <el-container>
    <el-header>
      <div class="header-content">
        <h1>PersonalTool</h1>
        <el-menu
          mode="horizontal"
          :default-active="activeIndex"
          @select="handleSelect"
        >
          <el-menu-item index="blog">博客</el-menu-item>
          <el-menu-item index="stock">A股复盘</el-menu-item>
          <el-menu-item index="account">记账</el-menu-item>
          <el-menu-item index="json">JSON工具</el-menu-item>
        </el-menu>
      </div>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeIndex = ref('blog')

const handleSelect = (key: string) => {
  router.push(`/${key}`)
}
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
}
</style>

