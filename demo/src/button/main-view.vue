<template>
  <div>
    <h2>
      BUTTON, BUTTON GROUP & TOOL BUTTON
      <theme-switch />
    </h2>
    <div class="group button-w-100">
      <h3>NORMAL STYLE</h3>
      <div class="group-row">
        <mu-button>
          NORMAL
        </mu-button>
        <mu-button active>
          ACTIVE
        </mu-button>
        <mu-button disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button primary>
          PRIMARY
        </mu-button>
        <mu-button primary active>
          ACTIVE
        </mu-button>
        <mu-button primary disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button secondary>
          SECONDARY
        </mu-button>
        <mu-button secondary active>
          ACTIVE
        </mu-button>
        <mu-button secondary disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button danger>
          DANGER
        </mu-button>
        <mu-button danger active>
          ACTIVE
        </mu-button>
        <mu-button danger disabled>
          DISABLED
        </mu-button>
      </div>
    </div>
    <div class="group button-w-100">
      <h3>OUTLINE STYLE</h3>
      <div class="group-row">
        <mu-button button-style="outline">
          OUTLINE
        </mu-button>
        <mu-button button-style="outline" active>
          ACTIVE
        </mu-button>
        <mu-button button-style="outline" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button primary button-style="outline">
          PRIMARY
        </mu-button>
        <mu-button primary button-style="outline" active>
          ACTIVE
        </mu-button>
        <mu-button primary button-style="outline" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button secondary button-style="outline">
          SECONDARY
        </mu-button>
        <mu-button secondary button-style="outline" active>
          ACTIVE
        </mu-button>
        <mu-button secondary button-style="outline" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button danger button-style="outline">
          DANGER
        </mu-button>
        <mu-button danger button-style="outline" active>
          ACTIVE
        </mu-button>
        <mu-button danger button-style="outline" disabled>
          DISABLED
        </mu-button>
      </div>
    </div>
    <div class="group button-w-100">
      <h3>TEXT STYLE</h3>
      <div class="group-row">
        <mu-button button-style="text">
          TEXT
        </mu-button>
        <mu-button button-style="text" active>
          ACTIVE
        </mu-button>
        <mu-button button-style="text" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button primary button-style="text">
          PRIMARY
        </mu-button>
        <mu-button primary button-style="text" active>
          ACTIVE
        </mu-button>
        <mu-button primary button-style="text" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button secondary button-style="text">
          SECONDARY
        </mu-button>
        <mu-button secondary button-style="text" active>
          ACTIVE
        </mu-button>
        <mu-button secondary button-style="text" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button danger button-style="text">
          DANGER
        </mu-button>
        <mu-button danger button-style="text" active>
          ACTIVE
        </mu-button>
        <mu-button danger button-style="text" disabled>
          DISABLED
        </mu-button>
      </div>
    </div>
    <div class="group">
      <h3>LINK STYLE</h3>
      <div class="group-row link-group">
        <mu-button button-style="link">
          LINK
        </mu-button>
        <mu-button button-style="link" active>
          ACTIVE
        </mu-button>
        <mu-button button-style="link" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row link-group">
        <mu-button primary button-style="link">
          PRIMARY
        </mu-button>
        <mu-button primary button-style="link" active>
          ACTIVE
        </mu-button>
        <mu-button primary button-style="link" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row link-group">
        <mu-button secondary button-style="link">
          SECONDARY
        </mu-button>
        <mu-button secondary button-style="link" active>
          ACTIVE
        </mu-button>
        <mu-button secondary button-style="link" disabled>
          DISABLED
        </mu-button>
      </div>
      <div class="group-row link-group">
        <mu-button danger button-style="link">
          DANGER
        </mu-button>
        <mu-button danger button-style="link" active>
          ACTIVE
        </mu-button>
        <mu-button danger button-style="link" disabled>
          DISABLED
        </mu-button>
      </div>
    </div>
    <div class="group">
      <h3>ICON</h3>
      <mu-button class="mu-icon-button" icon="bolt" />
      <mu-button icon="loading:spin" primary caption="Loading" />
      <mu-button icon="file" secondary caption="中文" />
      <mu-button icon="check" danger caption="中文 ENGLISH" />
    </div>
    <div class="group">
      <h3>BADGE</h3>
      <mu-button>badge<span class="mu-badge">Default</span></mu-button>
      <mu-button>badge<span class="mu-badge" primary>Primary</span></mu-button>
      <mu-button>badge<span class="mu-badge" secondary>SECONDARY</span></mu-button>
      <mu-button>badge<span class="mu-badge" warning>Warning</span></mu-button>
      <mu-button>badge<span class="mu-badge" danger>Danger</span></mu-button>
    </div>
    <div class="group">
      <h3>SIZE</h3>
      <mu-button size="small" caption="SMALL" />
      <mu-button size="small" primary pill caption="SMALL" />
      <mu-button size="large" caption="LARGE" />
      <mu-button size="large" primary pill caption="LARGE" />
    </div>
    <div class="group">
      <h3>BUTTON GROUP</h3>
      <mu-button-group>
        <mu-button :active="activeItem === 1" @click="select(1)">
          One
        </mu-button>
        <mu-button :active="activeItem === 2" @click="select(2)">
          Two
        </mu-button>
        <mu-button :active="activeItem === 3" @click="select(3)">
          Three
        </mu-button>
      </mu-button-group>
      <mu-button-group primary button-style="outline">
        <mu-button :active="activeItem === 1" @click="select(1)">
          One
        </mu-button>
        <mu-button :active="activeItem === 2" @click="select(2)">
          Two
        </mu-button>
        <mu-button :active="activeItem === 3" @click="select(3)">
          Three
        </mu-button>
      </mu-button-group>
      <mu-button-group primary>
        <mu-button :active="activeItem === 1" @click="select(1)">
          One
        </mu-button>
        <mu-button :active="activeItem === 2" @click="select(2)">
          Two
        </mu-button>
        <mu-button :active="activeItem === 3" @click="select(3)">
          Three
        </mu-button>
      </mu-button-group>
      <div class="flex-break" />
      <mu-button-group danger pill button-style="outline" size="small">
        <mu-button :active="activeItem === 1" @click="select(1)">
          One
        </mu-button>
        <mu-button :active="activeItem === 2" size="large" @click="select(2)">
          Two
        </mu-button>
        <mu-button :active="activeItem === 3" @click="select(3)">
          Three
        </mu-button>
      </mu-button-group>
      <mu-button-group disabled small>
        <mu-button :active="activeItem === 1" @click="select(1)">
          One
        </mu-button>
        <mu-button :active="activeItem === 2" @click="select(2)">
          Two
        </mu-button>
        <mu-button :active="activeItem === 3" @click="select(3)">
          Three
        </mu-button>
      </mu-button-group>
    </div>
    <div class="group">
      <h3>ICON BUTTON</h3>
      <mu-icon-button size="small" icon="chevronUp" />
      <mu-icon-button size="small" icon="chevronRight" danger />
      <mu-icon-button size="small" icon="chevronDown" disabled />
      <mu-icon-button v-model:active="active1" size="small" icon="dots" toggle />
      <mu-icon-button v-model:active="active2" size="small" icon="album" danger toggle />
      <mu-icon-button icon="chevronUp" />
      <mu-icon-button icon="chevronRight" danger />
      <mu-icon-button icon="chevronDown" disabled />
      <mu-icon-button v-model:active="active1" icon="dots" toggle />
      <mu-icon-button v-model:active="active2" icon="album" danger toggle />
      <mu-icon-button size="large" icon="chevronUp" />
      <mu-icon-button size="large" icon="chevronRight" danger />
      <mu-icon-button size="large" icon="chevronDown" disabled />
      <mu-icon-button v-model:active="active1" size="large" icon="dots" toggle />
      <mu-icon-button v-model:active="active2" size="large" icon="album" danger toggle />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  import ThemeSwitch from '../common/theme-switch.vue'

  const activeItem = ref(null)
  const active1 = ref(true)
  const active2 = ref(true)

  const select = (v) => {
    activeItem.value = v
  }

</script>

<style>
  .group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .group-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .link-group {
    gap: 16px;
    padding: 8px;
    border: 1px dashed #ddd;
    border-radius: 8px;
  }

  .button-w-100 .mu-button {
    width: 100px;
  }
</style>
