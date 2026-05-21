// YouTube transcript fetcher for Kumo
// Uses YouTube's internal Innertube API to fetch caption data directly,
// providing a more reliable source than DOM scraping for furigana injection.

interface CaptionTrack {
  baseUrl: string
  languageCode: string
  name: string           // e.g. "Japanese", "Japanese (auto-generated)"
  kind: 'asr' | 'standard'
  isTranslatable: boolean
}

interface CaptionSegment {
  text: string
  startMs: number
  durationMs: number
}

export interface TranscriptResult {
  segments: CaptionSegment[]
  language: string
  trackKind: 'asr' | 'standard'
}

/** Cached transcript for the current video to avoid re-fetching. */
let cachedTranscript: TranscriptResult | null = null
let cachedVideoId: string | null = null

/** Extract the current YouTube video ID from the URL. */
export function getYouTubeVideoId(): string | null {
  const url = new URL(window.location.href)
  // Standard watch page: /watch?v=XXXXX
  if (url.searchParams.has('v')) return url.searchParams.get('v')
  // Short URL: /youtu.be/XXXXX — but this redirects, so check pathname
  if (url.pathname.startsWith('/shorts/')) {
    return url.pathname.split('/')[2] || null
  }
  // Embedded player
  if (url.pathname.startsWith('/embed/')) {
    return url.pathname.split('/')[2] || null
  }
  return null
}

/** Fetch the Innertube API key from YouTube's page HTML.
 *  YouTube embeds it as a JS variable: "INNERTUBE_API_KEY":"..."  */
function extractApiKey(): string | null {
  // Search all script tags for the key
  const scripts = document.querySelectorAll('script')
  for (const script of scripts) {
    const match = script.textContent?.match(/"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"/)
    if (match) return match[1]
  }
  // Also check the ytInitialPlayerResponse (sometimes embedded in the page)
  const ytPlayerResponse = (window as any).ytInitialPlayerResponse
  if (ytPlayerResponse) return null // no key here, but we can still parse
  return null
}

/** Fetch available caption tracks for a YouTube video via Innertube API. */
async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[] | null> {
  const apiKey = extractApiKey()
  if (!apiKey) {
    console.debug('Kumo: YouTube Innertube API key not found — falling back to DOM-based caption detection')
    return null
  }

  try {
    console.debug(`Kumo: Fetching YouTube caption tracks for video ${videoId}`)
    const response = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20250528.00.00',
              hl: 'en',
              gl: 'US',
              utcOffsetMinutes: -new Date().getTimezoneOffset(),
            },
          },
        }),
      }
    )

    if (!response.ok) {
      console.debug(`Kumo: Innertube API returned ${response.status} — falling back to DOM`)
      return null
    }

    const data = await response.json()
    const tracks: CaptionTrack[] = []

    // Navigate the nested response structure
    const captions = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!captions || !Array.isArray(captions)) {
      console.debug('Kumo: No caption tracks found in Innertube response')
      return []
    }

    console.debug(`Kumo: Found ${captions.length} caption tracks via Innertube API`)
    for (const track of captions) {
      tracks.push({
        baseUrl: track.baseUrl || '',
        languageCode: track.languageCode || '',
        name: (track.name?.simpleText || track.name || ''),
        kind: track.kind === 'asr' ? 'asr' : 'standard',
        isTranslatable: !!track.isTranslatable,
      })
    }

    return tracks
  } catch (e) {
    console.error('Kumo: Innertube API fetch failed:', e)
    return null
  }
}

/** Pick the best Japanese caption track from the available options.
 *  Prefers standard (human-made) over auto-generated, but both work. */
function pickJapaneseTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  const jaTracks = tracks.filter(t => t.languageCode === 'ja')
  if (jaTracks.length === 0) return null

  // Prefer standard captions over auto-generated
  const standard = jaTracks.find(t => t.kind === 'standard')
  if (standard) return standard

  return jaTracks[0]
}

/** Fetch and parse a caption track's XML into timestamped segments. */
async function fetchTranscript(track: CaptionTrack): Promise<CaptionSegment[]> {
  try {
    const response = await fetch(track.baseUrl)
    if (!response.ok) return []

    const xmlText = await response.text()
    return parseCaptionXml(xmlText)
  } catch (e) {
    console.debug('Kumo: Failed to fetch transcript XML:', e)
    return []
  }
}

/** Parse YouTube's caption XML format into typed segments.
 *  Format:
 *    <transcript>
 *      <text start="1.23" dur="2.5">Hello world</text>
 *      ...
 *    </transcript>
 */
function parseCaptionXml(xml: string): CaptionSegment[] {
  const segments: CaptionSegment[] = []

  // Use regex for lightweight parsing (avoids DOM parser overhead,
  // handles YouTube's sometimes-malformed XML)
  const textRegex = /<text\s+[^>]*?(?:start="([^"]*)")?\s*(?:dur="([^"]*)")?[^>]*>(.*?)<\/text>/gs

  let match
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1] || '0')
    const dur = parseFloat(match[2] || '2')
    // Decode XML entities (&amp;, &lt;, etc.) in the text
    const text = decodeXmlEntities(match[3]).trim()
    if (text) {
      segments.push({ text, startMs: start * 1000, durationMs: dur * 1000 })
    }
  }

  return segments
}

/** Decode common XML/HTML entities. */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

/**
 * Main entry point: fetch the Japanese transcript for the current YouTube video.
 * Results are cached per video ID to avoid repeated network requests.
 */
export async function fetchJapaneseTranscript(): Promise<TranscriptResult | null> {
  const videoId = getYouTubeVideoId()
  if (!videoId) return null

  // Return cached result if this is the same video
  if (cachedVideoId === videoId && cachedTranscript) {
    return cachedTranscript
  }

  // Invalidate cache if video changed
  if (cachedVideoId !== videoId) {
    cachedTranscript = null
    cachedVideoId = null
  }

  const tracks = await fetchCaptionTracks(videoId)
  if (!tracks || tracks.length === 0) return null

  const jaTrack = pickJapaneseTrack(tracks)
  if (!jaTrack) return null

  const segments = await fetchTranscript(jaTrack)
  if (segments.length === 0) return null

  const result: TranscriptResult = {
    segments,
    language: 'ja',
    trackKind: jaTrack.kind,
  }

  cachedTranscript = result
  cachedVideoId = videoId

  return result
}

/** Clear the cached transcript (e.g., when navigating to a new video). */
export function clearTranscriptCache(): void {
  cachedTranscript = null
  cachedVideoId = null
}

/** Check if the current page is a YouTube video watch page. */
export function isYouTubeWatchPage(): boolean {
  const hostname = window.location.hostname
  if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) return false

  const videoId = getYouTubeVideoId()
  return videoId !== null
}

/**
 * Find the caption segment that corresponds to the current playback time.
 * Returns the segment text if found, or null if no caption is active.
 */
export function getCaptionAtTime(
  transcript: TranscriptResult,
  timeMs: number
): string | null {
  // Binary search for the segment covering this timestamp
  let lo = 0
  let hi = transcript.segments.length - 1

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const seg = transcript.segments[mid]
    const segStart = seg.startMs
    const segEnd = segStart + seg.durationMs

    if (timeMs >= segStart && timeMs < segEnd) {
      return seg.text
    }
    if (timeMs < segStart) {
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  return null
}
