import {readFile, writeFile} from 'fs'
import {brotliCompress} from 'zlib'
import {resolve} from 'path'
import {promisify} from 'util'


const readFileP = promisify(readFile)
const writeFileP = promisify(writeFile)
const brotliP = (b:Buffer)=> {
    return new Promise((resolve, reject)=>{
        brotliCompress(b,(err, data)=>{
            if(err) reject(err)
            resolve(data)
        })
    })
}

(async()=>{
    const f = await readFileP(resolve(__dirname, './reserved.txt'))
    const b = await brotliP(f)
    await writeFileP(resolve(__dirname, './reserved.txt.br'), b)
})()