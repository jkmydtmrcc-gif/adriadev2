import { cn } from '../../lib/utils'

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20',
        variant === 'secondary' && 'bg-bg-elevated text-text-primary border border-border hover:bg-border/50',
        variant === 'danger' && 'bg-danger/20 text-danger border border-danger/50 hover:bg-danger/30',
        variant === 'ghost' && 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      {...props}
    />
  )
}
