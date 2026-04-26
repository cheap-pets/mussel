<template>
  <div>
    <h2>
      FORM
      <theme-switch />
    </h2>
    <div class="p-2x">
      <mu-form class="border border-primary" label-width="60px" label-align="left">
        <mu-form-field label="Text 1" :width="1/3">
          <mu-input value="Value 1" />
        </mu-form-field>
        <mu-form-field label="Text 2" :width="1/3" required>
          <mu-input value="Value 2" />
        </mu-form-field>
        <mu-flex-break />
        <mu-form-field label="Text 2A" :width="1/3" required>
          <mu-input value="Value 2" />
        </mu-form-field>
        <hr>
        <mu-form-row>
          <mu-form-field class="flex-1" label="Text 3" invalid>
            <mu-input value="Value 3" />
          </mu-form-field>
          <mu-form-field class="flex-1" label="Text 4" invalid>
            <mu-input input-style="underline" value="Value 4" />
          </mu-form-field>
          <mu-form-field class="flex-1" label="Text 5" invalid>
            <mu-input input-style="solid" value="Value 5" />
          </mu-form-field>
        </mu-form-row>
        <mu-form-field label="Text 6">
          <input type="text" class="mu-input">
        </mu-form-field>
        <mu-form-field label="Text 7" invalid>
          <textarea class="mu-input" style="height: 200px;" />
        </mu-form-field>
      </mu-form>
    </div>
  </div>
</template>

<script setup>
  import ThemeSwitch from '../common/theme-switch.vue'
</script>
