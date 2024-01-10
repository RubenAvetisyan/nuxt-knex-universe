import { Nitro } from 'nitropack'

export default async (_nitroApp: Nitro) => {
    console.log('_nitroApp: ', _nitroApp.options);

}