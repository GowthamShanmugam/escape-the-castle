import { useState, useLayoutEffect } from 'react'

/**
 * Returns a scale factor so content of size (contentW, contentH) fits inside
 * the ref'd container. Used to fit game arenas/canvases on mobile without scrolling.
 */
export function useViewportScale(ref, contentW, contentH) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref && ref.current
    if (!el || contentW <= 0 || contentH <= 0) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      setScale(Math.min(1, w / contentW, h / contentH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, contentW, contentH])
  return scale
}
