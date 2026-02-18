import { HTMLAttributes } from 'react'

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  noPadding?: boolean
}

export default function GlassCard({ className = '', noPadding, children, ...props }: GlassCardProps) {
  return (
    <div
      className={`glass rounded-[14px] transition-all duration-200 ${noPadding ? '' : 'p-4'} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
