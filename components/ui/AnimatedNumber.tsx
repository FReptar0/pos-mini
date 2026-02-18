'use client'

import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/utils/formatters'

type AnimatedNumberProps = {
  value: number
  currency?: boolean
  currencyCode?: string
  className?: string
  color?: string
  duration?: number
}

export default function AnimatedNumber({
  value,
  currency = false,
  currencyCode = 'MXN',
  className = '',
  color,
  duration = 600,
}: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(value)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const fromRef = useRef<number>(value)

  useEffect(() => {
    cancelAnimationFrame(frameRef.current)
    fromRef.current = displayed
    startRef.current = performance.now()

    function animate(now: number) {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = fromRef.current + (value - fromRef.current) * eased
      setDisplayed(current)
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatted = currency
    ? formatCurrency(displayed, currencyCode)
    : displayed.toFixed(0)

  return <span className={className} style={color ? { color } : undefined}>{formatted}</span>
}
