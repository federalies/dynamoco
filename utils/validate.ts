import globby from 'globby'
import { safeLoad } from 'js-yaml'
import { promisify } from 'util'
import { readFile } from 'fs'
import { resolve } from 'path'
import JSON5 from 'json5'
const readFileP = promisify(readFile)

;(async () => {
  const yamlRelPaths = await globby(['!node_modules/', './.github/**/*.yml', '.*.yml', '.**/*.yml'])
  const yamlPaths = yamlRelPaths.map(p => resolve('', p))
  console.log({ yamlPaths })
  const yamlFiles = await Promise.all(yamlPaths.map(async p => ({ path: p, file: await readFileP(p) })))
  yamlFiles.forEach(({ path, file }) => {
    try {
      safeLoad(file.toString())
    } catch (er) {
      console.error(path)
      console.error(er)
      console.error('\n\n\n', file.toString())
    }
  })
})()

;(async () => {
  const jsonRelPaths = await globby(['./**/*.json', '!node_modules/'])
  const jsonPaths = jsonRelPaths.map(p => resolve('', p))
  console.log({ jsonPaths })
  const jsonFiles = await Promise.all(jsonPaths.map(async p => ({ path: p, file: await readFileP(p) })))
  jsonFiles.forEach(({ path, file }) => {
    if (path.includes('tsconfig.json')) {
      try {
        JSON5.parse(file.toString())
      } catch (er) {
        console.error(path)
        console.error(er)
        console.error('\n\n\n', file.toString())
      }
    } else {
      try {
        JSON.parse(file.toString())
      } catch (er) {
        console.error(path)
        console.error(er)
        console.error('\n\n\n', file.toString())
      }
    }
  })
})()
