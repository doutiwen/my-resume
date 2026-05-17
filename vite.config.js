import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import vueJsx from '@vitejs/plugin-vue-jsx';
import VueSetupExtend from 'vite-plugin-vue-setup-extend';
import compressPlugin from 'vite-plugin-compression';
import Pages from 'vite-plugin-pages';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    server: {
      host: '0.0.0.0',
      port: 8088,
      proxy: {
        '/api': {
          target: '',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    plugins: [
      vue(),
      //自动引入ES模块
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/,
          /\.vue\?vue/, // .vue
        ],
        //引入index.js中的模块
        fileFilter: (filePath) => {
          return /\.(js|ts)$/.test(filePath) && !filePath.includes('node_modules');
        },
        resolvers: [ElementPlusResolver()], //自动引入element-plus组件
        imports: ['vue', 'pinia', 'vue-router'],
        dirs: ['./src/utils'],
        eslintrc: {
          enabled: true,
        },
      }),
      //自动按需引入vue组件
      Components({
        resolvers: [ElementPlusResolver()], //自动引入element-plus、antD组件
        directoryAsNamespace: true, //解决命名冲突
        include: [/\.vue$/, /\.vue\?vue/, /\.jsx$/, /\.tsx$/],
      }),
      vueJsx({
        transformOn: true,
        mergeProps: true,
      }), //vue文件中使用jsx
      VueSetupExtend(), //支持在setup标签中直接添加vue组件name属性
      command === 'build' &&
        mode === 'prod' &&
        compressPlugin({
          ext: '.gz',
          algorithm: 'gzip',
          deleteOriginFile: true,
        }), //产品模式下开启gzip压缩
      Pages({
        exclude: ['**/common/**'],
        extensions: ['vue', 'js', 'jsx', 'tsx'],
      }),
    ].filter((i) => !!i),
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.geojson', '.vue'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          //自动引入全局scss变量定义文件
          additionalData: '@use "/src/styles/vars.scss" as *;',
          charset: false,
          api: 'modern',
        },
      },
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove();
                }
              },
            },
          },
        ],
      },
    },
    build: {
      outDir: 'dist', // 打包输出目录
      assetsDir: 'assets', // 静态资源目录
      sourcemap: false, // 生产环境通常关闭 sourcemap 以保护源码并减小体积
      minify: 'esbuild', // 使用 esbuild 压缩 (更快)
      cssCodeSplit: true, // CSS 代码分割
      chunkSizeWarningLimit: 1500, // 增大 chunk 警告限制
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor';
            }
            if (id.includes('element-plus')) {
              return 'ui-vendor';
            }
          },
          chunkFileNames: 'assets/chunk/[hash]_[name].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo?.name || '';
            if (name.includes('/src/asyncRequestApi/mockFile/mock')) {
              return 'assets/static/mockFile/[name].[ext]';
            } else {
              return 'assets/static/[ext]/[hash]_[name].[ext]';
            }
          },
          entryFileNames: 'assets/entry/[name].js',
        },
      },
      // Terser 压缩配置
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除 console
          drop_debugger: true, // 移除 debugger
        },
      },
    },
    assetsInclude: ['**/*.glb', '**/*.gltf'],
  };
});
