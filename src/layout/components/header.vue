<template>
  <button type="button" class="ex-icon" :aria-label="T('Navigation')"
          :aria-expanded="mobileNavigation ? navigationOpen : !setting.sideIsCollapse"
          :aria-controls="mobileNavigation ? 'mobile-navigation' : 'desktop-navigation'" @click="toggleNavigation">
    <el-icon aria-hidden="true">
      <el-icon-expand v-if="mobileNavigation || setting.sideIsCollapse"></el-icon-expand>
      <el-icon-fold v-else></el-icon-fold>
    </el-icon>
  </button>
  <div class="header-logo">
    <img :src="setting.logo" alt="" class="logo">
    <div class="title">{{setting.title}}</div>
  </div>
  <Setting></Setting>
</template>

<script>
  import { defineComponent, computed } from 'vue'
  import Setting from '@/layout/components/setting/index.vue'
  import { useAppStore } from '@/store/app'
  import { T } from '@/utils/i18n'

  export default defineComponent({
    name: 'LayerHeader',
    components: { Setting },
    props: { mobileNavigation: Boolean, navigationOpen: Boolean },
    emits: ['open-navigation'],
    setup (props, { emit }) {
      const appStore = useAppStore()
      const setting = computed(() => appStore.setting)
      const toggleNavigation = () => {
        if (props.mobileNavigation) emit('open-navigation')
        else appStore.sideCollapse()
      }
      return {
        setting,
        toggleNavigation,
        T,
      }
    },

  })
</script>

<style scoped lang="scss">
  .ex-icon {
    flex: 0 0 44px;
    min-height: 40px;
    align-self: center;
    display: flex;
    align-items: center;
    margin-right: 10px;
    justify-content: center;
    font-size: 16px;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: inherit;
  }
  .ex-icon:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }

  .header-logo {
    display: flex;
    min-width: 0;
    height: 100%;
    align-items: center;

    .title {
      display: block;
      margin-left: 10px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .logo {
      display: block;
      width: 30px;
      height: 30px;
    }
  }


</style>
<style lang="scss">

</style>
