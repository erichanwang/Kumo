import { useState, useEffect } from 'react'

const CACHE_KEY = 'kumo-github-timestamp'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CachedTimestamp {
  date: string
  fetchedAt: number
}

/** Fetch the latest commit date for manifest.json from GitHub API, cached in sessionStorage. */
export function useGitHubTimestamp(): { liveDate: string | null; loading: boolean } {
  const [liveDate, setLiveDate] = useState<string | null>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { date, fetchedAt } = JSON.parse(cached) as CachedTimestamp
        if (Date.now() - fetchedAt < CACHE_TTL_MS) return date
      }
    } catch { /* ignore */ }
    return null
  })
  const [loading, setLoading] = useState(!liveDate)

  useEffect(() => {
    if (liveDate) { setLoading(false); return }
    let cancelled = false
    fetch('https://api.github.com/repos/erichanwang/Kumo/commits?path=manifest.json&per_page=1')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (Array.isArray(data) && data.length > 0 && data[0].commit?.committer?.date) {
          const date = new Date(data[0].commit.committer.date).toISOString().split('T')[0]
          setLiveDate(date)
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ date, fetchedAt: Date.now() }))
          } catch { /* ignore */ }
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { liveDate, loading }
}
