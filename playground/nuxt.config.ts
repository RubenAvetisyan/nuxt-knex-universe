export default defineNuxtConfig({
  modules: ['../src/module'],
  knexConnections: {
    configs: [
      {
        client: "sqlite3",
        connection: {
          filename: './server/databases/sqlite3.db',
        }
      }
      // Add other configurations as needed
    ]
  },
  devtools: { enabled: true }
})
