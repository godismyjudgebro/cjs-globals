[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

# `cjs-globals`

This module mimics some CommonJS globals, such as `__dirname` and `__filename`,
in an ECMAScript module.

## Installation

```sh
npm install cjs-globals
```

## Usage

```js
// File: example.mjs
import cjs from 'cjs-globals'

cjs.__filename // => /Users/JohnDoe/Documents/example.mjs
cjs.__dirname // => /Users/JohnDoe/Documents
```

## Caveats

This module is not a complete implementation of CommonJS globals. The `require`
function is not properly implemented, and is discouraged in favor of native
ECMAScript `import` syntax.

## Contributing

Contributions are welcome! Please open an issue or pull request on GitHub.
