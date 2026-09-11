/**
 * Receives baked poster frames from the browser and writes them to public/posters/.
 *
 * The world only exists inside the page, so the frame has to be grabbed there; getting a 200 KB
 * JPEG back out of a console evaluation is the awkward part. This is a five-line sink the page can
 * POST to instead. Run it while baking, stop it after.
 *
 *   npm run posters:sink                      # terminal 1
 *   open /?mode=world&capture=1 and follow docs/redesign/HANDOFF.md
 */
import { createServer } from 'node:http'
import { writeFileSync, mkdirSync } from 'node:fs'

const DIR = new URL('../public/posters/', import.meta.url)
mkdirSync(DIR, { recursive: true })

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.end('poster sink')
  const name = (req.url || '').replace(/[^a-z0-9-]/gi, '')
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const b64 = body.slice(body.indexOf(',') + 1)
    const buf = Buffer.from(b64, 'base64')
    writeFileSync(new URL(`${name}.jpg`, DIR), buf)
    console.log(`wrote ${name}.jpg  ${(buf.length / 1024).toFixed(0)} kB`)
    res.end('ok')
  })
}).listen(4321, () => console.log('poster sink on http://localhost:4321'))
