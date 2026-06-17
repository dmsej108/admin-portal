import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('out')

if (fs.existsSync('out') && fs.existsSync(path.join('out', 'index.html'))) {
  fs.writeFileSync(path.join('out', '.nojekyll'), '')

  const indexHtml = path.join('out', 'index.html')
  const notFoundHtml = path.join('out', '404.html')
  if (fs.existsSync(indexHtml) && !fs.existsSync(notFoundHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml)
  }

  console.log('Using Next.js static export at ./out')
  process.exit(0)
}

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true })
}
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, '.nojekyll'), '')

if (fs.existsSync('.next/static')) {
  fs.cpSync('.next/static', path.join(outDir, '_next/static'), { recursive: true })
}

if (fs.existsSync('public')) {
  for (const entry of fs.readdirSync('public')) {
    const src = path.join('public', entry)
    const dest = path.join(outDir, entry)
    fs.cpSync(src, dest, { recursive: true })
  }
}

console.log('Prepared GH Pages artifact at ./out')
