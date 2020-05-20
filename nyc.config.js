'use strict'

// const isWindows = require('is-windows')
// const defaultExclude = require('@istanbuljs/schema/default-exclude')

// const platformExclude = [
// isWindows() ? 'lib/posix.js' : 'lib/win32.js'
// ]

module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  include: [
    'src/**/*.ts'
  ],
  'check-coverage': true
  // all: true,
  // exclude: platformExclude.concat(defaultExclude)
}
