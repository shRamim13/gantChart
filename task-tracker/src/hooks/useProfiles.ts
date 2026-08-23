import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQuery = any

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name') as SupabaseQuery

    if (!error && data) setProfiles(data as Profile[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return { profiles, loading, refetch: fetchProfiles }
}
