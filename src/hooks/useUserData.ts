import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { UsersApi, Configuration, HandlersUserInfo, HandlersUserPositionsResponse } from '@/generated/api/src'

interface UseUserDataReturn {
  userInfo: HandlersUserInfo | null
  userPositions: HandlersUserPositionsResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useUserData(): UseUserDataReturn {
  const { address, isConnected } = useAccount()
  const [userInfo, setUserInfo] = useState<HandlersUserInfo | null>(null)
  const [userPositions, setUserPositions] = useState<HandlersUserPositionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = useCallback(async () => {
    if (!address || !isConnected) {
      setUserInfo(null)
      setUserPositions(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const config = new Configuration({
        basePath: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
      })
      
      const usersApi = new UsersApi(config)
      
      // Fetch user info and positions in parallel
      const [userInfoResponse, userPositionsResponse] = await Promise.all([
        usersApi.apiV1UsersAddressGet({ address }),
        usersApi.apiV1UsersAddressPositionsGet({ address }).catch(() => null) // Allow positions to fail silently
      ])

      setUserInfo(userInfoResponse)
      setUserPositions(userPositionsResponse)
    } catch (err) {
      console.error('Failed to fetch user data:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return {
    userInfo,
    userPositions,
    loading,
    error,
    refetch: fetchUserData
  }
}