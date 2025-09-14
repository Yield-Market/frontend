import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns a middle-ellipsized string to keep a single-line display.
// Example: truncateMiddle('0x1234567890abcdef', 8, 6) => '0x123456...abcdef'
export function truncateMiddle(
  value: string,
  leadingChars: number = 10,
  trailingChars: number = 8
): string {
  if (!value) return ""
  const totalKept = leadingChars + trailingChars
  if (value.length <= totalKept + 3) return value
  const head = value.slice(0, leadingChars)
  const tail = value.slice(-trailingChars)
  return `${head}...${tail}`
}