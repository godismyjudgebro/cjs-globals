import { builtinModules as moduleNames } from 'node:module'

/**
 * The built-in modules of Node.js preloaded by `esm`.
 *
 * @internal
 * @see https://nodejs.org/api/module.html#modulebuiltinmodules
 */
const builtinModules: Record<string, unknown> = {}

const promises: Array<Promise<unknown>> = []
for (const moduleName of moduleNames) {
  promises.push(
    import(moduleName).then(moduleExport => {
      builtinModules[moduleName] = moduleExport
      builtinModules[`node:${moduleName}`] = moduleExport
    })
  )
}

await Promise.all(promises)

export default builtinModules
