import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function offlineWorker(): Plugin {
  let output: string
  return {
    name: 'astral-offline-worker',
    apply: 'build',
    configResolved(config) {
      output = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const source = await readFile(new URL('./scripts/service-worker.js', import.meta.url), 'utf8')
      const entries = await readdir(output, { recursive: true, withFileTypes: true })
      const paths = entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.') && entry.name !== 'sw.js')
        .map((entry) => relative(output, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
        .sort()
      const hash = createHash('sha256').update(source)
      for (const path of paths) hash.update(path).update(await readFile(join(output, path)))
      const worker = source.replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 20))
        .replace('/* PRECACHE_FILES */ []', JSON.stringify(paths))
      await writeFile(join(output, 'sw.js'), worker)
    },
  }
}

export default defineConfig({ base: './', plugins: [offlineWorker()] })
