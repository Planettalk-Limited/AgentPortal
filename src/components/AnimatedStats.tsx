'use client'

import { useEffect, useState } from 'react'

interface StatItemProps {
  end: number
  suffix: string
  label: string
  duration?: number
  prefix?: string
}

const StatItem = ({ end, suffix, label, duration = 2000, prefix = '' }: StatItemProps) => {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
      
      const increment = end / (duration / 16) // 60fps
      let current = 0
      
      const counter = setInterval(() => {
        current += increment
        if (current >= end) {
          setCount(end)
          clearInterval(counter)
        } else {
          setCount(Math.floor(current))
        }
      }, 16)

      return () => clearInterval(counter)
    }, 500) // Start animation after 500ms

    return () => clearTimeout(timer)
  }, [end, duration])

  return (
    <div className={`text-center transform transition-all duration-1000 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    }`}>
      <div className="text-2xl font-bold">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm">{label}</div>
    </div>
  )
}

const AnimatedStats = () => {
  return (
    <div className="flex items-center justify-center space-x-8 text-white/80">
      <StatItem end={2500} suffix="+" label="Active Agents" />
      <StatItem end={45} suffix="+" label="Countries" />
      <StatItem end={2.5} suffix="M+" label="Earnings Paid" prefix="$" />
    </div>
  )
}

export default AnimatedStats
