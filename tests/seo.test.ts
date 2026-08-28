import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { json } from '../functions/_lib/http'
import { FAQ_ITEMS } from '../src/components/SeoContent'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(`${root}/${path}`, 'utf8')

describe('SEO and GEO discovery assets', () => {
  it('publishes one canonical indexable production URL with complete sharing metadata', () => {
    const html = read('index.html')

    expect(html).toContain('<link rel="canonical" href="https://sun-to-spark.pages.dev/">')
    expect(html).toContain('<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">')
    expect(html).toContain('<meta property="og:url" content="https://sun-to-spark.pages.dev/">')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(html).toContain('<link rel="sitemap" type="application/xml" href="/sitemap.xml">')
  })

  it('keeps FAQ structured data aligned with the visible FAQ', () => {
    const html = read('index.html')
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
    expect(script).toBeTruthy()

    const graph = (JSON.parse(script!) as { '@graph': Array<Record<string, unknown>> })['@graph']
    const faq = graph.find((entry) => entry['@type'] === 'FAQPage') as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>
    }
    expect(faq.mainEntity.map((item) => ({ question: item.name, answer: item.acceptedAnswer.text })))
      .toEqual(FAQ_ITEMS.map((item) => ({ question: item.question, answer: item.answer })))
  })

  it('exposes sitemap and AI-readable product documentation while excluding private routes', () => {
    const robots = read('public/robots.txt')
    const sitemap = read('public/sitemap.xml')
    const headers = read('public/_headers')
    const llms = read('public/llms.txt')
    const llmsFull = read('public/llms-full.txt')

    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain('https://sun-to-spark.pages.dev/sitemap.xml')
    expect(sitemap).toContain('<loc>https://sun-to-spark.pages.dev/</loc>')
    expect(headers.match(/X-Robots-Tag: noindex, nofollow, noarchive/g)).toHaveLength(2)
    expect(llms).toContain('# 余生账单')
    expect(llmsFull).toContain('## 工作占用')
  })

  it('marks every API JSON response as non-indexable', () => {
    const response = json({ ok: true })
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
  })
})
