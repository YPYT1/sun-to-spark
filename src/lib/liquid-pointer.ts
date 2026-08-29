import type { PointerEvent as ReactPointerEvent } from 'react'

export function trackLiquidPointer(event: ReactPointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - bounds.left) / bounds.width) * 100
  const y = ((event.clientY - bounds.top) / bounds.height) * 100
  event.currentTarget.style.setProperty('--liquid-x', `${Math.max(0, Math.min(100, x))}%`)
  event.currentTarget.style.setProperty('--liquid-y', `${Math.max(0, Math.min(100, y))}%`)
}

export function resetLiquidPointer(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--liquid-x', '50%')
  event.currentTarget.style.setProperty('--liquid-y', '50%')
}
