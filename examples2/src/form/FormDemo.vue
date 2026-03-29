<template>
  <div>
    <h2>
      FORM
      <mu-switch
        v-model="darkMode"
        active-label="Dark"
        inactive-label="Light"
        @update:model-value="onUIModeChange" />
    </h2>
    <div class="mu-box" position="fixed fit" padding="2x">
      <mu-form border="primary" label-width="60px" label-align="right">
        <mu-form-field label="Text 1" width="100" flex="1 auto">
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
            <mu-input underline value="Value 4" />
          </mu-form-field>
          <mu-form-field flex="1" label="Text 5" invalid>
            <mu-input solid value="Value 5" />
          </mu-form-field>
        </mu-form-row>
        <mu-form-field label="Text 6">
          <input type="text" class="mu-input">
        </mu-form-field>
        <mu-form-field label="Text 7" invalid>
          <textarea class="mu-input" solid />
        </mu-form-field>
      </mu-form>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const darkMode = ref(false)

  function onUIModeChange () {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }
</script>
