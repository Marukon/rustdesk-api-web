<template>
  <el-scrollbar class="scroll-sidebar" :height="drawer ? '100%' : '100vh'">
    <menus :drawer="drawer" />
  </el-scrollbar>
</template>
<script>
  import Menus from '@/layout/components/menu/index.vue'
  import { defineComponent } from 'vue'

  export default defineComponent({
    name: 'GAside',
    components: { Menus },
    props: { drawer: Boolean },
  })
</script>

<style scoped lang="scss">
.scroll-sidebar {
  background-color: #2d3a4b;
}
</style>
