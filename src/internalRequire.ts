// Built-in modules:
import path from 'node:path'
import vm from 'node:vm'

// Third-party modules:
import fs from 'fs-extra'

// Internal modules:
import builtinModules from './builtinModules.js'
import internalResolve from './internalResolve.js'

/**
 * Synchronously load a CommonJS module.
 *
 * @internal
 * @param id - Module name or path.
 * @param baseDir - The directory to resolve relative paths from.
 * @returns Exported module content.
 * @see https://nodejs.org/api/modules.html#requireid
 */
// eslint-disable-next-line max-lines-per-function, @typescript-eslint/no-explicit-any
export default function internalRequire(id: string, baseDir: string): any {
  // Is it a built-in module?
  if (Object.hasOwn(builtinModules, id)) {
    return builtinModules[id]
  }

  const resolvedId = internalResolve(id, baseDir)
  const resolvedPathDirname = path.dirname(resolvedId)

  const code = fs.readFileSync(resolvedId, 'utf8')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let exportsObject: any = {}
  const context = vm.createContext({
    /** Path to the root directory of the currently executing script. */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    get __dirname() {
      return resolvedPathDirname
    },
    /** Path of the currently executing file. */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    get __filename() {
      return resolvedId
    },
    clearInterval,
    clearTimeout,
    console,
    /** Exports of the module being required. */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    get exports(): any {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return exportsObject
    },
    /** Exports of the module being required. */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    set exports(value: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      exportsObject = value
    },
    global,
    module: {
      /** Exports of the module being required. */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      get exports(): any {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return exportsObject
      },
      /** Exports of the module being required. */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      set exports(value: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        exportsObject = value
      }
    },
    process,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    require: (request: string) => internalRequire(request, resolvedPathDirname),
    setInterval,
    setTimeout
  })

  vm.runInContext(code, context, {
    breakOnSigint: true,
    displayErrors: true,
    filename: resolvedId,
    timeout: undefined,

    // Offsets:
    columnOffset: 0,
    lineOffset: 0
  })

  return context['exports']
}
