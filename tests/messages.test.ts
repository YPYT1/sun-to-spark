import { describe, expect, it } from 'vitest'
import {
  assignPaletteIndices,
  countCharacters,
  distributeMessages,
  excerptMessage,
  normalizeMessageBody,
  type PublicMessage,
} from '../src/lib/messages'

const message = (id: string, body: string): PublicMessage => ({
  id,
  body,
  likes: 0,
  colorSeed: Number(id.replace(/\D/g, '') || 0),
  createdAt: '2026-08-28T00:00:00.000Z',
})

describe('message wall', () => {
  it('normalizes plain text and counts Unicode graphemes', () => {
    expect(normalizeMessageBody('  第一行\r\n\r\n\r\n第二行  ')).toBe('第一行\n\n第二行')
    expect(countCharacters('我👩‍💻好')).toBe(3)
  })

  it('folds only messages longer than 50 characters', () => {
    const exact = '一'.repeat(50)
    const long = `${exact}二三`
    expect(excerptMessage(exact)).toEqual({ text: exact, expandable: false })
    expect(excerptMessage(long)).toEqual({ text: `${exact}…`, expandable: true })
  })

  it('balances estimated card height across the requested columns', () => {
    const columns = distributeMessages([
      message('1', '短'),
      message('2', '很长'.repeat(70)),
      message('3', '中等'.repeat(25)),
      message('4', '短一点'),
      message('5', '中等'.repeat(20)),
      message('6', '短'),
    ], 3)

    expect(columns).toHaveLength(3)
    expect(columns.flat()).toHaveLength(6)
    expect(new Set(columns.flat().map((item) => item.id)).size).toBe(6)
    expect(columns.every((column) => column.length > 0)).toBe(true)
  })

  it('assigns one of 18 palettes without adjacent duplicates', () => {
    const indices = assignPaletteIndices(Array.from({ length: 30 }, (_, index) => message(String(index), `留言 ${index}`)))
    expect(new Set(indices.values()).size).toBeGreaterThan(8)
    expect([...indices.values()].every((index) => index >= 0 && index < 18)).toBe(true)
    const values = [...indices.values()]
    expect(values.slice(1).every((value, index) => value !== values[index])).toBe(true)
  })
})
