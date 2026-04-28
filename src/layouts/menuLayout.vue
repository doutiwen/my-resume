<template>
  <div class="layout-container">
    <!-- 左侧菜单栏 -->
    <div class="sidebar">
      <div class="logo">DTWStudio</div>
      <ul class="menu-list">
        <li
          v-for="item in store.menus"
          :key="item.path"
          :class="{ active: currentRoute === item.path }"
          @click="navigateTo(item.path)"
        >
          {{ item.title }}
        </li>
      </ul>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-area">
      <div class="header">
        <h2>{{ getCurrentPageTitle }}</h2>
      </div>
      <div class="content-wrapper">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup name="menuLayout">
  import useStore from '@/store';

  const router = useRouter();
  const route = useRoute();
  const store = useStore();

  // 当前路由
  const currentRoute = computed(() => route.path);

  // 获取当前页面标题
  const getCurrentPageTitle = computed(() => {
    const currentItem = store.menus.find((item) => item.path === route.path);
    return currentItem ? currentItem.title : '首页';
  });

  // 导航到指定路由
  const navigateTo = (path) => {
    if (route.path !== path) {
      router.push(path);
    }
  };
</script>

<style lang="scss" scoped>
  .layout-container {
    display: flex;
    height: 100vh;
    width: 100%;
  }

  .sidebar {
    width: 250px;
    background-color: #2c3e50;
    color: white;
    height: 100%;
    display: flex;
    flex-direction: column;

    .logo {
      padding: 20px;
      font-size: 18px;
      font-weight: bold;
      border-bottom: 1px solid #34495e;
      text-align: center;
    }

    .menu-list {
      list-style: none;
      margin: 0;
      padding: 0;
      flex-grow: 1;

      li {
        padding: 15px 20px;
        cursor: pointer;
        transition: background-color 0.3s;
        border-left: 4px solid transparent;

        &:hover {
          background-color: #3498db;
        }

        &.active {
          background-color: #3498db;
          border-left: 4px solid #1abc9c;
        }
      }
    }
  }

  .content-area {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .header {
      padding: 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

      h2 {
        margin: 0;
        color: #2c3e50;
        font-size: 20px;
      }
    }

    .content-wrapper {
      flex-grow: 1;
      padding: 20px;
      overflow-y: auto;
      background-color: #ecf0f1;
    }
  }
</style>
