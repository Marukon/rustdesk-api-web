<template>
  <el-menu
          :class="['menus', { 'drawer-menu': drawer }]"
          :collapse="isCollapse"
          :default-active="activeIndex"
          background-color="#2d3a4b"
          text-color="#fff"
          active-text-color="#409eff"
          router
  >
    <menu-item v-for="(route,index) in routes" :key="route.name" :route="route"></menu-item>
  </el-menu>
</template>

<script>
  import { defineComponent, ref, computed } from 'vue'
  import { useRouteStore } from '@/store/router'
  import MenuItem from '@/layout/components/menu/item.vue'
  import { useRoute } from 'vue-router'
  import { useAppStore } from '@/store/app'

  export default defineComponent({
    name: 'Menu',
    created () {
    },
    components: { MenuItem },
    props: { drawer: Boolean },
    setup (props) {
      const routes = ref([])
      const route = useRoute()
      const app = useAppStore()
      const isCollapse = computed(() => !props.drawer && app.setting.sideIsCollapse)
      const activeIndex = computed(() => route.name)

      routes.value = useRouteStore().routes
      return {
        routes,
        activeIndex,
        isCollapse,
      }
    },

  })
</script>

<style lang="scss" scoped>
  .menus {
    min-height: 100vh;
    border-right: none;
    &:not(.el-menu--collapse) {
      width: var(--sideBarWidth);
    }

  }
  .drawer-menu { min-height: 100%; }
</style>
<style>
</style>
