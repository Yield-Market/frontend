/**
 * Logging utility functions
 * Automatically disables debug logs in production environment for improved security and performance
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private shouldLog(level: LogLevel): boolean {
    // Disable all logs in test environment
    if (this.isTest) return false
    
    // Only show warn and error in production environment
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error'
    }
    
    // Show all logs in development environment
    return true
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }

  // Transaction-related logs (more sensitive, only shown in development environment)
  transaction(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[TX] ${message}`, ...args)
    }
  }

  // Balance query-related logs (contains user addresses, needs caution)
  balance(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[BALANCE] ${message}`, ...args)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for use elsewhere
export type { LogLevel }
