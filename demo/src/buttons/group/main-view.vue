<template>
  <demo-page path="buttons/group">
    <demo-section
      title="基础用法"
      note="点击切换选中项（active 由外部控制）"
      :code="basicCode">
      <mu-button-group>
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
    </demo-section>

    <demo-section
      title="色彩与风格"
      note="color 设置组内按钮色彩；button-style 仅支持 normal / outline">
      <mu-button-group color="primary">
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
      <mu-button-group
        color="primary"
        button-style="outline">
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
      <mu-button-group
        color="danger"
        button-style="outline">
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
    </demo-section>

    <demo-section
      title="尺寸与形状"
      note="size 统一设置组内尺寸，pill 为胶囊形">
      <mu-button-group size="small">
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
      <mu-button-group
        color="primary"
        pill>
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
      <mu-button-group size="large">
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
    </demo-section>

    <demo-section
      title="整体禁用"
      note="disabled 禁用组内全部按钮">
      <mu-button-group disabled>
        <mu-button
          v-for="n in 3"
          :key="n"
          :active="activeItem === n"
          @click="activeItem = n">
          {{ text[n] }}
        </mu-button>
      </mu-button-group>
    </demo-section>

    <demo-section
      title="IconButton 基础用法"
      note="图标按钮，支持 size 与 color">
      <mu-icon-button
        size="small"
        icon="chevronUp" />
      <mu-icon-button
        size="small"
        icon="chevronRight"
        color="danger" />
      <mu-icon-button
        size="small"
        icon="chevronDown"
        disabled />
      <mu-icon-button icon="chevronUp" />
      <mu-icon-button
        icon="chevronRight"
        color="danger" />
      <mu-icon-button
        icon="chevronDown"
        disabled />
      <mu-icon-button
        size="large"
        icon="chevronUp" />
      <mu-icon-button
        size="large"
        icon="chevronRight"
        color="danger" />
      <mu-icon-button
        size="large"
        icon="chevronDown"
        disabled />
    </demo-section>

    <demo-section
      title="IconButton 切换态"
      note="toggle 开启后点击切换 active，支持 v-model:active">
      <mu-icon-button
        v-model:active="active1"
        icon="dots"
        toggle />
      <mu-icon-button
        v-model:active="active2"
        icon="star"
        color="danger"
        toggle />
      <mu-icon-button
        v-model:active="active1"
        size="large"
        icon="dots"
        toggle />
      <mu-icon-button
        v-model:active="active2"
        size="large"
        icon="star"
        color="danger"
        toggle />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="子按钮覆盖组属性与禁用组内子按钮"
      regression
      vertical>
      <div class="demo-group-row">
        <span>子按钮 size 覆盖组 size：</span>
        <mu-button-group
          color="danger"
          pill
          button-style="outline"
          size="small">
          <mu-button
            v-for="n in 3"
            :key="n"
            :size="n === 2 ? 'large' : undefined"
            :active="activeItem === n"
            @click="activeItem = n">
            {{ text[n] }}
          </mu-button>
        </mu-button-group>
      </div>
      <div class="demo-group-row">
        <span>禁用组内 active 不丢失：</span>
        <mu-button-group
          size="small"
          disabled>
          <mu-button
            v-for="n in 3"
            :key="n"
            :active="activeItem === n"
            @click="activeItem = n">
            {{ text[n] }}
          </mu-button>
        </mu-button-group>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-button-group>
  <mu-button :active="active === 1" @click="active = 1">One</mu-button>
  <mu-button :active="active === 2" @click="active = 2">Two</mu-button>
  <mu-button :active="active === 3" @click="active = 3">Three</mu-button>
</mu-button-group>`

  const text = { 1: 'One', 2: 'Two', 3: 'Three' }

  const activeItem = ref(null)
  const active1 = ref(true)
  const active2 = ref(true)
</script>

<style>
  .demo-group-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
</style>
