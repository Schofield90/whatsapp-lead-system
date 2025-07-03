import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import CryptoJS from 'crypto-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as +1XXXXXXXXXX for US numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // For international numbers, assume they're already formatted
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export function generateWebhookToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
}

export function encryptCredentials(credentials: Record<string, any>, secretKey: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(credentials), secretKey).toString()
}

export function decryptCredentials(encryptedCredentials: string, secretKey: string): Record<string, any> {
  const bytes = CryptoJS.AES.decrypt(encryptedCredentials, secretKey)
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTimeZoneOffset(timeZone: string): number {
  const now = new Date()
  const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
  const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone }))
  return (targetDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function calculateConversionRate(converted: number, total: number): number {
  if (total === 0) return 0
  return Math.round((converted / total) * 100)
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return targetDate.toLocaleDateString()
}