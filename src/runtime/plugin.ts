export default defineNitroPlugin(async (nitroApp) => {
  // const { dbConfigs } = useRuntimeConfig()
  try {
    const dbs = await useStorage('databases').getItem(`billing`)
    console.log('dbs: ', dbs);

    useStorage('databases').getMounts().forEach((mount) => {
      console.log('mount: ', mount.base);
    })

    nitroApp.hooks.hookOnce('request', async (event) => {
      if (!event.context.data) event.context.data = {}
      if (!event.context.data.dbs) event.context.data.dbs = dbs
    })
  } catch (error) {
    console.error(error)
  }
})
