// Built-in modules:
import path from 'node:path'
import url from 'node:url'

// Internal modules:
// import createRequire from './createRequire.js'
import internalRequire from './internalRequire.js'
import internalResolve from './internalResolve.js'

/**
 * Get the directory to resolve relative paths from. Used for `require.resolve`.
 *
 * @internal
 * @returns The directory to resolve relative paths from.
 */
function getBaseDir(): string {
  try {
    return cjs.__dirname
  } catch (e) {
    return process.cwd()
  }
}

/**
 * Synchronously load a CommonJS module; the behavior is *similar* to the
 * built-in CommonJS `require()` function.
 *
 * > **NOTE:** Use of this function is discouraged in favor of the EcmaScript
 * `import` statement or function. This function was exclusively added for the
 * sake of completeness.
 *
 * @param id - Module name or path.
 * @returns Exported module content.
 * @see https://nodejs.org/api/modules.html#requireid
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow
function require(id: string): any {
  return internalRequire(id, getBaseDir())
}

/**
 * Use the internal require() machinery to look up the location of a module, but
 * rather than loading the module, just return the resolved filename.
 *
 * @param request - The module path to resolve.
 * @returns The resolved filename.
 * @throws MODULE_NOT_FOUND error if the module can not be found.
 * @see https://nodejs.org/api/modules.html#requireresolverequest-options
 * @see https://nodejs.org/api/modules.html#all-together
 * @since 1.0.0
 */
require.resolve = (request: string): string =>
  internalResolve(request, getBaseDir())

/**
 * Matches, in an error stack trace, the first occurance of a path name that is
 * not located in the directory in which this file resides.
 *
 * @internal
 */
const pathRegex = new RegExp(
  `.+${path.dirname(
    url.fileURLToPath(import.meta.url)
  )}(?:[^\n]+\n[^/]+(?:\\/\\/)?(?<path>[^:]+))?`,
  'su'
)

/**
 * Mimics some CommonJS globals, such as `__dirname` and `__filename`, in an
 * ECMAScript module.
 *
 * @license MIT
 * @example
 * // File: /home/user/project/example.js
 * import cjs from 'cjs-globals'
 *
 * cjs.__dirname // => /home/user/project
 * cjs.__filename // => /home/user/project/example.js
 * cjs.resolve('./other.js') // => /home/user/project/other.js
 *
 * // Discouraged, but added for completeness:
 * cjs.require('./other.js') // => "other.js" exports.
 * @author Daniel Beck
 */
const cjs = {
  /**
   * Path to the root directory of the currently executing script.
   *
   * @throws If the path cannot be determined.
   * @since 1.0.0
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get __dirname(): string {
    return path.dirname(this.__filename)
  },
  /**
   * Path of the currently executing file.
   *
   * @throws If the path cannot be determined. For example, if the script is run
   * from the Node REPL.
   * @since 1.0.0
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get __filename(): string {
    const matchedPath = new Error().stack?.match(pathRegex)?.groups?.['path']

    if (typeof matchedPath === 'undefined') {
      throw new ReferenceError(
        'cjs.__dirname and cjs.__filename could not be determined. ' +
          'This is likely because the code is run from the Node REPL.'
      )
    }

    return matchedPath
  },
  require
}

export default cjs
