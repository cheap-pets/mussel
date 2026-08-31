<template>
  <div>
    <h2>
      COMBOBOX & SELECT
      <theme-switch />
    </h2>
    <div class="group flex flex-col gap-1x">
      <div class="mu-input-group">
        <mu-combo-box
          v-model="artist"
          prefix="Artist: "
          dropdown-host="$parent"
          :options="artists"
          @esc="console.log('esc')"
          @prefix-click="onPrefixClick"
          @dropdown:show="onDropdownShow" />
        <mu-button
          caption="Add Option"
          class="mu-input-addon"
          @click="addOption" />
      </div>
      <mu-combo-box
        v-model="artist"
        prefix="Artist: "
        @prefix-click="onPrefixClick"
        @dropdown:show="onDropdownShow">
        <template #dropdown>
          <mu-option value="Ludwig van Beethoven" />
          <mu-option value="Wolfgang Amadeus Mozart" />
          <mu-option value="Frédéric François Chopin" />
        </template>
      </mu-combo-box>
      <mu-combo-box v-model="artist" editable :options="artists" />
    </div>
    <div class="group flex flex-col gap-1x">
      <mu-select
        v-model="artist"
        class="my-select"
        dropdown-width="auto"
        placeholder="select an artist"
        prefix="Artist:"
        :disabled="false"
        :options="artists" />
      <mu-select
        v-model="selectedItem"
        placeholder="search & select"
        dropdown-class="combo-search-panel flex flex-col gap-half"
        :dropdown-scrollbar="false">
        <template #dropdown>
          <mu-search-input
            v-model="searchKey"
            class="flex-none"
            input-style="solid"
            style="width: 100%;" />
          <mu-scroll-box class="flex-auto">
            <mu-option
              v-for="el in filteredItems"
              :key="el"
              :value="el" />
          </mu-scroll-box>
        </template>
      </mu-select>
      <mu-select
        v-model="slotItem"
        placeholder="search & select (new slots)"
        :options="slotFilteredItems">
        <template #dropdown-header>
          <mu-search-input
            v-model="slotSearchKey"
            input-style="solid"
            class="mb-half"
            style="width: 100%;" />
        </template>
      </mu-select>
      <mu-multi-select
        v-model="selectedArtists"
        :options="artists"
        :max-tags="2"
        :tag-shrink="true"
        :tag-tooltip="true"
        value-mode="composite"
        style="width: 420px;" nowrap
        placeholder="select an artist" />
    </div>
    <div class="group fixed" style="bottom: 0; left: 0;">
      <mu-combo-box
        v-model="artistCn"
        value-mode="composite"
        dropdown-width="600px"
        :options="artistsCn" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const artist = ref('Johann Baptist Strauss')
  const selectedArtists = ref([{ value: 'Ludwig van Beethoven' }])
  const artists = ref([
    { is: '-', label: 'GROUP 1' },
    { value: 'Ludwig van Beethoven' },
    { value: 'Wolfgang Amadeus Mozart' },
    { value: 'Frédéric François Chopin', disabled: true },
    { is: '-', label: 'GROUP 2' },
    { value: 'Johann Baptist Strauss', disabled: false }
  ])
  const artistCn = ref()
  const slotItem = ref()
  const slotSearchKey = ref('')
  const slotFilteredItems = computed(() =>
    items.filter(item => !slotSearchKey.value || item.includes(slotSearchKey.value))
  )

  const searchKey = ref('')
  const selectedItem = ref()
  const items = new Array(50).fill(0).map((el, idx) => `items${idx}`)
  const filteredItems = computed(() =>
    items.filter(item => !searchKey.value || item.includes(searchKey.value))
  )
  const artistsCn = [
    { value: 'Ludwig van Beethoven', label: '贝多芬' },
    { value: 'Wolfgang Amadeus Mozart', label: '莫扎特' },
    { value: 'Frédéric François Chopin', label: '肖邦' },
    '-',
    { value: 'Johann Baptist Strauss', label: '斯特劳斯', disabled: true }
  ]

  function onPrefixClick () {
    console.log('prefix clicked')
  }

  function addOption () {
    artists.value.push({
      value: new Date()
    })
  }

  function onDropdownShow () {
    console.log('dropdown show')
  }

</script>

<style>
  .mu-combo-box {
    width: 300px;
  }

  .combo-search-panel {
    width: 300px;
    max-height: 240px;
  }

    .my-select :deep(input) {
    color: green;
  }
</style>
