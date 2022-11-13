import { builtinModules as builtinModuleNames } from 'node:module'
import path from 'node:path'

import fs from 'fs-extra'

/**
 * Creates an error object for the `resolve()` function.
 *
 * @internal
 * @param request - The module path to resolve.
 * @returns The error object.
 */
function createErrorObject(request: string): Error {
  const error = new Error(`Cannot find module '${request}'`)
  // @ts-expect-error because it is valid to assign `code` to an `Error`.
  error.code = 'MODULE_NOT_FOUND'

  return error
}

/**
 * The internal require() machinery to look up the location of a module.
 *
 * @internal
 * @param request - The module path to resolve.
 * @param baseDir - The directory to resolve relative paths from.
 * @returns The resolved filename.
 * @throws MODULE_NOT_FOUND error if the module can not be found.
 * @see https://nodejs.org/api/modules.html#requireresolverequest-options
 * @see https://nodejs.org/api/modules.html#all-together
 */
// eslint-disable-next-line max-statements
export default function internalResolve(
  request: string,
  baseDir: string
): string {
  // Is it a core module?
  if (builtinModuleNames.includes(request.split('node:').slice(-1).join(''))) {
    return request
  }

  // Is it a path?
  if (
    request.startsWith('../') ||
    request.startsWith('./') ||
    request.startsWith('/')
  ) {
    const absolutePath = path.resolve(baseDir, request)

    // Is it a path to a file?
    const resolvedFile = resolveFile(absolutePath)
    if (typeof resolvedFile === 'string') return resolvedFile

    // Is it a path to a directory?
    const resolvedDirectory = resolveDirectory(absolutePath)
    if (typeof resolvedDirectory === 'string') return resolvedDirectory

    // The path is invalid.
    createErrorObject(request)
  }

  // Is it a locally installed Node module?
  const resolvedNodeModule = resolveNodeModule(request, baseDir)
  if (typeof resolvedNodeModule === 'string') return resolvedNodeModule

  throw createErrorObject(request)
}

/**
 * Resolves a file path.
 *
 * @internal
 * @param request - The file path to resolve.
 * @returns The resolved file path or `null` if the file does not exist.
 */
function resolveFile(request: string): string | null {
  const pathGuesses = [
    request,
    `${request}.js`,
    `${request}.json`,
    `${request}.node`
  ]

  for (const pathGuess of pathGuesses) {
    if (fs.existsSync(pathGuess) && fs.statSync(pathGuess).isFile()) {
      return pathGuess
    }
  }

  return null
}

/**
 * Resolves a directory path to a file path (e.g. `index.js`).
 *
 * @internal
 * @param request - The directory path to resolve.
 * @returns The resolved index path or `null` if the index file does not exist.
 */
function resolveIndex(request: string): string | null {
  return resolveFile(path.join(request, 'index'))
}

/**
 * Resolves a directory path to a file path.
 *
 * @internal
 * @param request - The directory path to resolve.
 * @returns The resolved directory path or `null` if no file was found.
 */
function resolveDirectory(request: string): string | null {
  const packageJsonPath = path.join(request, 'package.json')
  if (fs.existsSync(packageJsonPath) && fs.statSync(packageJsonPath).isFile()) {
    try {
      const mainField = (
        JSON.parse(
          fs.readFileSync(path.join(request, 'package.json'), 'utf8')
        ) as { main: unknown }
      ).main

      if (typeof mainField !== 'string') return resolveIndex(request)

      const mainPath = path.join(request, mainField)

      const resolvedFile = resolveFile(mainPath)
      if (typeof resolvedFile === 'string') return resolvedFile

      return resolveIndex(mainPath)
    } catch (e) {}
  }

  return resolveIndex(request)
}

/**
 * Resolves a Node module name to a file path.
 *
 * @internal
 * @param request - The module id to resolve.
 * @param baseDir - The directory to resolve relative paths from.
 * @returns The resolved file path or `null` if no module was found.
 */
function resolveNodeModule(request: string, baseDir: string): string | null {
  const directories = nodeModulePaths(baseDir)

  for (const directory of directories) {
    const resolvedFile = resolveFile(path.join(directory, request))
    if (typeof resolvedFile === 'string') return resolvedFile

    const resolvedDirectory = resolveDirectory(path.join(directory, request))
    if (typeof resolvedDirectory === 'string') return resolvedDirectory
  }

  return null
}

/**
 * Returns an array of paths in which to look for a Node module.
 *
 * @internal
 * @param start - The directory to start from.
 * @returns An array of all possible `node_module` paths.
 */
function nodeModulePaths(start: string): string[] {
  const parts = start.split('/')
  const directories: string[] = []

  for (let i = parts.length; i > 0; i--) {
    if (parts[i] !== 'node_modules') {
      directories.unshift(path.resolve(...parts.slice(0, i), 'node_modules'))
    }
  }

  return directories
}
