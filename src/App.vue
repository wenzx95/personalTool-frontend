<template>
  <router-view />
</template>

<script setup lang="ts">
// Main app component - router view is handled by layouts
// Authentication is handled by router guards
</script>

<style>
/* Global styles */
#app {
  width: 100%;
  min-height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: auto;
  min-height: 100vh;
  overflow-x: hidden;
}
</style>
