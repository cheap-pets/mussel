<template>
  <div>
    <H2>
      BUTTON, BUTTON GROUP & TOOL BUTTON
      <mu-switch
        v-model="darkMode"
        active-label="Dark"
        inactive-label="Light"
        @update:model-value="onUIModeChange" />
    </H2>
    <div class="group button-w-90">
      <h3>NORMAL STYLE</h3>
      <div class="group-row">
        <mu-button x>
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
        <mu-button accent>
          ACCENT
        </mu-button>
        <mu-button accent active>
          ACTIVE
        </mu-button>
        <mu-button accent disabled>
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
    <div class="group button-w-90">
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
        <mu-button accent button-style="outline">
          ACCENT
        </mu-button>
        <mu-button accent button-style="outline" active>
          ACTIVE
        </mu-button>
        <mu-button accent button-style="outline" disabled>
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
    <div class="group button-w-90">
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
        <mu-button accent button-style="text">
          ACCENT
        </mu-button>
        <mu-button accent button-style="text" active>
          ACTIVE
        </mu-button>
        <mu-button accent button-style="text" disabled>
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
        <mu-button accent button-style="link">
          ACCENT
        </mu-button>
        <mu-button accent button-style="link" active>
          ACTIVE
        </mu-button>
        <mu-button accent button-style="link" disabled>
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
      <h3>X-COLOR</h3>
      <div class="group-row">
        <mu-button x-color="gray">
          GRAY
        </mu-button>
        <mu-button x-color="#ff0000">
          #FF0000
        </mu-button>
        <mu-button x-color="pink">
          PINK
        </mu-button>
        <mu-button x-color="grape">
          GRAPE
        </mu-button>
        <mu-button x-color="violet">
          VIOLET
        </mu-button>
        <mu-button x-color="indigo">
          INDIGO
        </mu-button>
        <mu-button x-color="blue">
          BLUE
        </mu-button>
        <mu-button x-color="cyan">
          CYAN
        </mu-button>
        <mu-button x-color="teal">
          TEAL
        </mu-button>
        <mu-button x-color="green">
          GREEN
        </mu-button>
        <mu-button x-color="lime">
          LIME
        </mu-button>
        <mu-button x-color="yellow">
          YELLOW
        </mu-button>
        <mu-button x-color="orange">
          ORANGE
        </mu-button>
      </div>
      <div class="group-row">
        <mu-button x-color="gray" button-style="outline">
          GRAY
        </mu-button>
        <mu-button x-color="#ff0000" button-style="outline">
          #FF0000
        </mu-button>
        <mu-button x-color="pink" button-style="outline">
          PINK
        </mu-button>
        <mu-button x-color="grape" button-style="outline">
          GRAPE
        </mu-button>
        <mu-button x-color="violet" button-style="outline">
          VIOLET
        </mu-button>
        <mu-button x-color="indigo" button-style="outline">
          INDIGO
        </mu-button>
        <mu-button x-color="blue" button-style="outline">
          BLUE
        </mu-button>
        <mu-button x-color="cyan" button-style="outline">
          CYAN
        </mu-button>
        <mu-button x-color="teal" button-style="outline">
          TEAL
        </mu-button>
        <mu-button x-color="green" button-style="outline">
          GREEN
        </mu-button>
        <mu-button x-color="lime" button-style="outline">
          LIME
        </mu-button>
        <mu-button x-color="yellow" button-style="outline">
          YELLOW
        </mu-button>
        <mu-button x-color="orange" button-style="outline">
          ORANGE
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
      <mu-button>badge<span class="mu-badge" accent>Accent</span></mu-button>
      <mu-button>badge<span class="mu-badge" warning>Warning</span></mu-button>
      <mu-button>badge<span class="mu-badge" danger>Danger</span></mu-button>
    </div>
    <div class="group">
      <h3>SIZE</h3>
      <mu-button size="small" caption="SMALL" />
      <mu-button size="small" primary caption="SMALL" />
      <mu-button size="large" caption="LARGE" />
      <mu-button size="large" primary caption="LARGE" />
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
      <div class="mu-space" space="100%" />
      <mu-button-group x-color="var(--mu-cyan)">
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
      <mu-button-group danger round button-style="outline" size="small">
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
      <h3>TOOL BUTTON</h3>
      <mu-tool-button size="small" icon="chevronUp" />
      <mu-tool-button size="small" icon="chevronRight" danger />
      <mu-tool-button size="small" icon="chevronDown" disabled />
      <mu-tool-button v-model:active="active1" size="small" icon="chevronLeft" toggle />
      <mu-tool-button v-model:active="active2" size="small" icon="album" danger toggle />
      <mu-tool-button icon="chevronUp" />
      <mu-tool-button icon="chevronRight" danger />
      <mu-tool-button icon="chevronDown" disabled />
      <mu-tool-button v-model:active="active1" icon="chevronLeft" toggle />
      <mu-tool-button v-model:active="active2" icon="album" danger toggle />
      <mu-tool-button size="large" icon="chevronUp" />
      <mu-tool-button size="large" icon="chevronRight" danger />
      <mu-tool-button size="large" icon="chevronDown" disabled />
      <mu-tool-button v-model:active="active1" size="large" icon="chevronLeft" toggle />
      <mu-tool-button v-model:active="active2" size="large" icon=".ti.ti-file" danger toggle />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const darkMode = ref(false)
  const activeItem = ref(null)
  const active1 = ref(true)
  const active2 = ref(true)

  const select = (v) => {
    activeItem.value = v
  }

  const onUIModeChange = (v) => {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }
</script>

<style scoped>
  .link-group {
    gap: 16px;
    padding: 8px;
    border: 1px dashed #ddd;
    border-radius: 8px;
  }

  .mu-button[x-color] {
    width: 80px;
  }

  .button-w-90 .mu-button {
    width: 90px;
  }
</style>
