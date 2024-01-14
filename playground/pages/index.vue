<script setup lang="ts">
const route = useRoute()
const { data } = await useFetch('/api/knex')
</script>

<template>
  <div>
    <h1>Nuxt Routing set up successfully!</h1>
    <p>Current route: {{ route.path }}</p>
    <a href="https://nuxt.com/docs/getting-started/routing" target="_blank">Learn more about Nuxt Routing</a>
    <pre>{{ data }}</pre>
  </div>
</template>
