import { MarketCategory } from '@/types'

interface MarketIconProps {
  category: MarketCategory
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MarketIcon({ category, size = 'md', className = '' }: MarketIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  }
  
  const baseClasses = `${sizeClasses[size]} ${className}`

  switch (category) {
    case MarketCategory.Crypto:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-orange-100 text-orange-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M12 2L13.06 8.52L17 5.9L16.06 12.42L19 9.8L17.94 16.32L21 13.7L19.94 20.22L24 17.6L23.06 24.12L18 21.5L19.06 15L16 17.6L17 11.1L14 13.7L15 7.2L12 9.8L9 7.2L10 13.7L7 11.1L8 17.6L5 15L6.06 21.5L1 24.12L0.06 17.6L4 20.22L2.94 13.7L6 16.32L4.94 9.8L8 12.42L7 5.9L10.94 8.52z"/>
          </svg>
        </div>
      )
    case MarketCategory.Political:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-blue-100 text-blue-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z"/>
          </svg>
        </div>
      )
    case MarketCategory.Weather:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-sky-100 text-sky-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 13H16C16.55 13 17 12.55 17 12C17 11.45 16.55 11 16 11H8C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13Z"/>
          </svg>
        </div>
      )
    case MarketCategory.Sports:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-green-100 text-green-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
          </svg>
        </div>
      )
    case MarketCategory.Economics:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M11.8 10.9C10.5 10.9 9.4 11.8 9.4 13S10.5 15.1 11.8 15.1C13.1 15.1 14.2 14.2 14.2 13S13.1 10.9 11.8 10.9ZM7 4H17V20H7V4Z"/>
          </svg>
        </div>
      )
    case MarketCategory.Technology:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-purple-100 text-purple-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M20 3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3ZM20 19H4V5H20V19Z"/>
          </svg>
        </div>
      )
    default:
      return (
        <div className={`${baseClasses} flex items-center justify-center bg-gray-100 text-gray-600 rounded-full`}>
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
          </svg>
        </div>
      )
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-green-100 text-green-800'
    case 'resolved':
      return 'bg-blue-100 text-blue-800'
    case 'expired':
      return 'bg-gray-100 text-gray-800'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function getCategoryColor(category: MarketCategory) {
  switch (category) {
    case MarketCategory.Crypto:
      return 'bg-orange-50 border-orange-200'
    case MarketCategory.Political:
      return 'bg-blue-50 border-blue-200'
    case MarketCategory.Weather:
      return 'bg-sky-50 border-sky-200'
    case MarketCategory.Sports:
      return 'bg-green-50 border-green-200'
    case MarketCategory.Economics:
      return 'bg-emerald-50 border-emerald-200'
    case MarketCategory.Technology:
      return 'bg-purple-50 border-purple-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}