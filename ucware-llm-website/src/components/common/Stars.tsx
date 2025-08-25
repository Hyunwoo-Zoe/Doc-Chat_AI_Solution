// src/components/common/Stars.tsx
'use client'
interface StarsProps {
  value: number
  onChange: (v: number) => void
}
export default function Stars({ value, onChange }: StarsProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`h-6 w-6 text-yellow-400 ${star <= value ? '' : 'opacity-30'} transition-opacity hover:opacity-80`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
