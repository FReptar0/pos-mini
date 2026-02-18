'use client'

import { InputHTMLAttributes } from 'react'

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string | number
  onChange: (value: string) => void
  label?: string
  prefix?: string
}

export default function CurrencyInput({
  value,
  onChange,
  label,
  prefix = '$',
  className = '',
  ...props
}: CurrencyInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium uppercase tracking-wider text-[#888]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-sm font-medium text-[#555]">{prefix}</span>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 text-right text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none transition-colors ${className}`}
          {...props}
        />
      </div>
    </div>
  )
}
