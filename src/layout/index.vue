<template>
  <el-config-provider :locale="appStore.setting.locale.value">
    <el-container :style="{'--sideBarWidth': sideBarWidth}">
      <el-aside v-if="!useDrawer" :width="leftWidth" class="app-left" id="desktop-navigation">
        <g-aside></g-aside>
      </el-aside>
      <el-container class="app-container ">
        <el-header class="app-header">
          <g-header :mobile-navigation="useDrawer" :navigation-open="navigationOpen" @open-navigation="openNavigation" />
        </el-header>
        <div class="header-tags">
          <tags></tags>
        </div>

        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition mode="out-in" name="el-fade-in-linear">
              <keep-alive :include="cachedTags">
                <component :is="Component"/>
              </keep-alive>
            </transition>
          </router-view>
        </el-main>
      </el-container>
      <dialog v-if="useDrawer" id="mobile-navigation" ref="drawer" class="navigation-drawer"
              aria-labelledby="navigation-title" @close="navigationOpen = false" @click.self="closeNavigation">
        <div class="drawer-panel">
          <header>
            <h2 id="navigation-title">{{ T('Navigation') }}</h2>
            <button type="button" autofocus @click="closeNavigation">{{ T('Close') }}</button>
          </header>
          <g-aside drawer />
        </div>
      </dialog>
    </el-container>
  </el-config-provider>
</template>

<script setup>
  import { useAppStore } from '@/store/app'
  import { useTagsStore } from '@/store/tags'
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { T } from '@/utils/i18n'
  import Tags from '@/layout/components/tags/index.vue'
  import GAside from '@/layout/components/aside.vue'
  import GHeader from '@/layout/components/header.vue'

  const appStore = useAppStore()
  const tagStore = useTagsStore()
  const sideBarWidth = computed(() => useDrawer.value ? '100%' : appStore.setting.locale.sideBarWidth)
  const leftWidth = computed(() => appStore.setting.sideIsCollapse ? '64px' : 'var(--sideBarWidth)')

  const cachedTags = ref([])
  const drawer = ref(null)
  const useDrawer = ref(false)
  const navigationOpen = ref(false)
  const route = useRoute()
  const mobile = window.matchMedia('(max-width: 760px)')
  const closeNavigation = () => {
    if (drawer.value?.open) drawer.value.close()
    navigationOpen.value = false
  }
  const syncNavigation = () => {
    const enabled = mobile.matches && typeof document.createElement('dialog').showModal === 'function'
    if (!enabled) closeNavigation()
    useDrawer.value = enabled
  }
  const openNavigation = () => {
    if (!drawer.value || drawer.value.open) return
    drawer.value.showModal()
    navigationOpen.value = true
  }
  onMounted(() => {
    syncNavigation()
    if (mobile.addEventListener) mobile.addEventListener('change', syncNavigation)
    else mobile.addListener(syncNavigation)
  })
  onUnmounted(() => {
    if (mobile.removeEventListener) mobile.removeEventListener('change', syncNavigation)
    else mobile.removeListener(syncNavigation)
  })
  watch(() => route.fullPath, closeNavigation)

  cachedTags.value = tagStore.cached
</script>

<style lang="scss" scoped>
.app-header {
  background-color: #182d48;
  color: var(--basicWhite);
  display: flex;
  height: 50px;
}

.header-tags {
  height: auto;
  border-bottom: 1px solid #eee;
  display: flex;
  padding: 0;
}

.app-left {
  transition: width 0.5s;
}

.app-container {
  min-height: 100vh;
  min-height: 100dvh;
  min-width: 0;
}

.navigation-drawer {
  margin: 0;
  padding: 0;
  border: 0;
  width: min(86vw, 310px);
  max-width: none;
  height: 100%;
  height: 100dvh;
  max-height: none;
  background: #2d3a4b;
  color: white;
}
.navigation-drawer::backdrop { background: #0a1728a8; }
.drawer-panel { height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr); }
.drawer-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #182d48;
}
.drawer-panel h2 { margin: 0; font-size: 1rem; }
.drawer-panel button {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #6e88a6;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.drawer-panel button:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
@media (max-width: 760px) {
  .app-main { padding: 12px; }
  .app-header { padding-inline: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .app-left { transition: none; }
}
</style>


