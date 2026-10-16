<template>
  <div class="point-edit-wrap">
    <div class="edit-title">
      <span>{{ data?.key ? '更新标记' : '添加标记' }}</span>
    </div>
    <div class="edit-from">
      <ElForm :model="form" label-width="auto">
        <ElFormItem label="标记名称" prop="signName">
          <ElInput
            :clearable="false"
            maxlength="30"
            minlength="2"
            v-model.trim="form.signName"
            placeholder="请输入(最多30个字符)"
          />
        </ElFormItem>
        <ElFormItem label="标记图标" prop="signImg">
          <div class="sign-icon-wrap">
            <div
              :class="['icon-item', activeIconIndex === item.value && 'is-active']"
              v-for="(item, index) in MarkerIconImage"
              :key="index"
              @click.stop="onIconClick(item)"
            >
              <img :src="item?.href" alt="" />
            </div>
          </div>
        </ElFormItem>
      </ElForm>
    </div>
    <div class="edit-handle-wrap">
      <button
        class="el-button el-button--danger is-plain"
        v-if="data?.key"
        @click.stop="onRemoveHandle(1)"
      >
        从历史记录中删除
      </button>
      <button class="el-button el-button--danger is-plain" @click.stop="onRemoveHandle(2)">
        从地图中删除
      </button>
      <button class="el-button el-button--primary" @click.stop="onSave">
        {{ data?.key ? '更新' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, toRefs, reactive, useSlots, onMounted } from 'vue';
  import { ElInput, ElForm, ElFormItem } from 'element-plus';
  import { MarkerIconImage } from './_Data.js';

  const props = defineProps({
    data: { type: Object, default: () => ({}) },
    onSave: { type: Function, default: null },
    onRemove: { type: Function, default: null },
  });

  const { data } = toRefs(props);

  const slots = useSlots();
  const emits = defineEmits(['onSave', 'onRemove']);

  const InitFormValue = {
    signName: props?.data?.name || `我的标记${new Date().getTime()}`,
    signImg: '',
  };

  let form = reactive({ ...InitFormValue });
  const activeIconIndex = ref(props?.data?.iconIndex);

  const onIconClick = (item) => {
    if (item.value === activeIconIndex.value) return;
    activeIconIndex.value = item.value;
  };

  const onSave = () => {
    const params = {
      ...data?.value,
      name: form.signName,
      iconIndex: activeIconIndex.value,
    };
    if (props?.onSave) {
      props?.onSave(params);
    }
    emits('onSave', params);
  };

  const onRemoveHandle = (type) => {
    if (props?.onRemove) {
      props?.onRemove(data?.value, type);
    }
    emits('onRemove', data?.value, type);
  };

  defineExpose({});

  onMounted(() => {});
</script>

<style lang="less" scoped>
  @import './index.less';
</style>
<style lang="less">
  .arcgisTooltip .tooltip-container .point-edit-tooltip {
    margin: 0 auto;
    border-radius: 4px;
    font-size: 12px;
  }
</style>
