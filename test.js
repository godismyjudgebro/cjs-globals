import path from 'node:path'
import url from 'node:url'

import cjs from './src/index.js'

const filename = url.fileURLToPath(import.meta.url)
test('__filename', () => {
  expect(cjs.__filename).toBe(filename)
})

const dirname = path.dirname(filename)
test('__dirname', () => {
  expect(cjs.__dirname).toBe(dirname)
})

test('require()', () => {
  expect(cjs.require('node:module')).toHaveProperty('builtinModules')
  expect(cjs.require('@godismyjudgebro/eslint-config')).toHaveProperty(
    'extends'
  )
})

test('require.resolve()', () => {
  expect(cjs.require.resolve('path')).toBe('path')
  expect(cjs.require.resolve('node:fs')).toBe('node:fs')
  expect(cjs.require.resolve('./src/builtinModules.js')).toBe(
    path.join(dirname, 'src', 'builtinModules.js')
  )
  expect(cjs.require.resolve('./src')).toBe(
    path.join(dirname, 'src', 'index.js')
  )
  expect(cjs.require.resolve(path.join(dirname, 'src'))).toBe(
    path.join(dirname, 'src', 'index.js')
  )
  expect(cjs.require.resolve(filename)).toBe(filename)
  expect(cjs.require.resolve('fs-extra')).toBe(
    path.join(dirname, 'node_modules', 'fs-extra', 'lib', 'index.js')
  )
  expect(() => cjs.require.resolve('src')).toThrowError(
    "Cannot find module 'src'"
  )
})

// import cjs from './src/index.js'

// cjs.require('module')
