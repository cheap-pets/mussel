<template>
  <div>
    <h2>
      FORM
      <theme-switch />
    </h2>
    <div class="p-2x">
      <mu-form class="border border-primary border-r4 p-3x" label-width="60px" label-align="left">
        <mu-form-field label="Text 1" width="200" flex="1 auto">
          <mu-input value="Value 1" />
        </mu-form-field>
        <mu-form-field label="Text 2" width="300" required flex="1 auto">
          <mu-input value="Value 2" />
        </mu-form-field>
        <mu-form-row>
          <mu-form-field flex="1" label="Text 3" invalid>
            <mu-input value="Value 3" />
          </mu-form-field>
          <mu-form-field flex="1" label="Text 4" invalid>
            <mu-input input-style="underline" value="Value 4" />
          </mu-form-field>
          <mu-form-field flex="1" label="Text 5" invalid>
            <mu-input input-style="solid" value="Value 5" />
          </mu-form-field>
        </mu-form-row>
        <mu-form-field label="Text 6">
          <input type="text" class="mu-input">
        </mu-form-field>
        <mu-form-field label="Text 7" invalid>
          <textarea class="mu-input" input-style="solid" style="height: 200px;" />
        </mu-form-field>
      </mu-form>
    </div>
  </div>
</template>

<script setup>
  import ThemeSwitch from '../common/theme-switch.vue'
</script>
