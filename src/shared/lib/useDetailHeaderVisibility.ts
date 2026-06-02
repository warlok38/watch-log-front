import { useEffect, useRef, useState } from 'react'

const HEADER_SCROLL_THRESHOLD = 14
const HEADER_TOP_OFFSET = 24

export function useDetailHeaderVisibility(): boolean {
  const [isHidden, setIsHidden] = useState(false)
  const previousScrollYRef = useRef(0)

  useEffect(() => {
    previousScrollYRef.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - previousScrollYRef.current

      if (currentScrollY <= HEADER_TOP_OFFSET) {
        setIsHidden(false)
        previousScrollYRef.current = currentScrollY
        return
      }

      if (Math.abs(delta) < HEADER_SCROLL_THRESHOLD) {
        return
      }

      setIsHidden(delta < 0)
      previousScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return isHidden
}
