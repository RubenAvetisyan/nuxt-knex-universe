export default defineNuxtConfig({
  modules: ['../src/module'],
  knexConnections: {
    configs: [{
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        flags: ['OPEN_URI', 'OPEN_SHAREDCACHE']
      },
      useNullAsDefault: true,
    }]
  },
  devtools: { enabled: true }
})
