import { cn } from '../../lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-bg-surface p-4 md:p-6 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-heading font-semibold text-lg text-text-primary', className)} {...props} />
}
