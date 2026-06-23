'use client'

import { useEffect, useRef } from 'react'

/**
 * Observes all elements with .reveal, .reveal-left, .reveal-right, .reveal-scale
 * within the given ref and adds .revealed when they enter the viewport.
 * 
 * Usage:
 *   const ref = useScrollReveal()
 *   <div ref={ref}> ... elements with className="reveal" ... </div>
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const elements = container.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    )

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '0px 0px -40px 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return ref
}
