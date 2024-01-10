<template>
  <div>
      Nuxt module playground! {{ data }}
  </div>
</template>

<script setup>
const { data } = await useFetch('/api/knex', {
  method: 'get',
  server: flase
}
)
</script>
