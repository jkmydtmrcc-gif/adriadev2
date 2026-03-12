import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatHRPhone(phone) {
  if (!phone) return null
  let num = String(phone).replace(/\D/g, '')
  if (num.startsWith('0')) num = '385' + num.slice(1)
  if (!num.startsWith('385')) num = '385' + num
  return num
}

export function getWhatsAppLink(phone, message = '') {
  const num = formatHRPhone(phone)
  if (!num) return null
  return `https://wa.me/${num}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
