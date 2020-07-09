'use strict'

module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  'skip-full': true,
  include: ['src/**/*.ts'],
  watermarks: {
    lines: [80, 90],
    functions: [80, 90],
    branches: [80, 90],
    statements: [80, 90]
  },
  'check-coverage': {
    branches: 80,
    lines: 80,
    functions: 80,
    statements: 80
  }
}

/* istanbul ignore if */ /// /// ignore the next if statement.
/* istanbul ignore else */ /// ///  ignore the else portion of an if statement.
/* istanbul ignore next */ /// ///  ignore the next thing in the source-code ( functions, if statements, classes, you name it).
/* istanbul ignore file */ /// ///  ignore an entire source-file (this should be placed at the top of the file).
