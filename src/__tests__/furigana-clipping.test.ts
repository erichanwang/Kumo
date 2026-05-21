import { describe, it, expect } from 'vitest'
import { fixContainerClipping } from '../content/furigana'

/**
 * Helper: create a DOM tree and return the inner span.
 *
 *   <div id="root" style="...">
 *     <span id="inner">日本語</span>
 *   </div>
 */
function makeTree(rootStyle: Partial<CSSStyleDeclaration> = {}): {
  root: HTMLDivElement
  inner: HTMLSpanElement
} {
  const root = document.createElement('div')
  root.id = 'root'
  Object.assign(root.style, rootStyle)

  const inner = document.createElement('span')
  inner.id = 'inner'
  inner.textContent = '日本語'

  // Insert a ruby element so the guard in processNode() would pass
  // (fixContainerClipping itself doesn't check for ruby, but we test
  // it in isolation)
  inner.appendChild(document.createTextNode(' '))
  const ruby = document.createElement('ruby')
  ruby.className = 'kanjilens-ruby'
  ruby.innerHTML = '<rb>日</rb><rt>にち</rt>'
  inner.appendChild(ruby)

  root.appendChild(inner)
  document.body.appendChild(root)
  return { root, inner }
}

/** Remove all DOM children and attributes so each test starts clean. */
function cleanup(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }
}

// ── overflow: hidden / clip → visible ──────────────────────────────

describe('fixContainerClipping: overflow', () => {
  it('sets overflow to visible when ancestor has overflow: hidden', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'hidden'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('overflow')).toContain('visible')
    expect(root.style.getPropertyPriority('overflow')).toBe('important')
  })

  it('sets overflow to visible when ancestor has overflow: clip', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'clip'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('overflow')).toContain('visible')
    expect(root.style.getPropertyPriority('overflow')).toBe('important')
  })

  it('sets overflow-y to visible when ancestor has overflow-y: hidden', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflowY = 'hidden'

    fixContainerClipping(inner)

    const yVal = root.style.getPropertyValue('overflow-y')
    expect(yVal).toContain('visible')
  })

  it('does NOT patch overflow when ancestor has overflow: auto', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'auto'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('overflow')).not.toContain('visible')
    expect(root.style.getPropertyPriority('overflow')).not.toBe('important')
  })

  it('does NOT patch overflow when ancestor has overflow: scroll', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'scroll'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('overflow')).not.toContain('visible')
    expect(root.style.getPropertyPriority('overflow')).not.toBe('important')
  })
})

// ── line-height patching ───────────────────────────────────────────

describe('fixContainerClipping: line-height', () => {
  it('sets line-height to 1.22 when computed line-height is < 1.15', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.lineHeight = '1.1'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('line-height')).toContain('1.22')
    expect(root.style.getPropertyPriority('line-height')).toBe('important')
  })

  it('does NOT patch line-height when it is 1.15 or higher', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.lineHeight = '1.15'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('line-height')).not.toContain('1.22')
    expect(root.style.getPropertyPriority('line-height')).not.toBe('important')
  })

  it('does NOT patch line-height when it is 2.0 (ample room)', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.lineHeight = '2.0'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('line-height')).not.toContain('1.22')
    expect(root.style.getPropertyPriority('line-height')).not.toBe('important')
  })

  it('does NOT patch line-height when it is normal', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.lineHeight = 'normal'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('line-height')).not.toContain('1.22')
    expect(root.style.getPropertyPriority('line-height')).not.toBe('important')
  })

  it('patches line-height when it is exactly 1.0 (common default)', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.lineHeight = '1'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('line-height')).toContain('1.22')
    expect(root.style.getPropertyPriority('line-height')).toBe('important')
  })
})

// ── self-clipping — startEl itself has overflow ─────────────────────

describe('fixContainerClipping: self-clipping', () => {
  it('patches overflow on startEl itself when it has overflow: hidden', () => {
    cleanup()
    const inner = document.createElement('span')
    inner.style.overflow = 'hidden'
    inner.textContent = 'test'
    document.body.appendChild(inner)

    fixContainerClipping(inner)

    expect(inner.style.getPropertyValue('overflow')).toContain('visible')
    expect(inner.style.getPropertyPriority('overflow')).toBe('important')
    expect(inner.hasAttribute('data-kl-room')).toBe(true)
  })

  it('patches line-height on startEl itself when it is < 1.15', () => {
    cleanup()
    const inner = document.createElement('span')
    inner.style.lineHeight = '1.1'
    inner.textContent = 'test'
    document.body.appendChild(inner)

    fixContainerClipping(inner)

    expect(inner.style.getPropertyValue('line-height')).toContain('1.22')
    expect(inner.style.getPropertyPriority('line-height')).toBe('important')
  })
})

// ── walk behaviour — stopping at layout tags ───────────────────────

describe('fixContainerClipping: walk boundaries', () => {
  it('stops at a BODY ancestor (does not patch body)', () => {
    cleanup()
    const inner = document.createElement('span')
    inner.textContent = 'test'
    document.body.appendChild(inner)

    // Set body overflow to hidden — should NOT be patched
    document.body.style.overflow = 'hidden'

    fixContainerClipping(inner)

    // BODY is in LAYOUT_TAGS, so the walk should return before patching it
    expect(document.body.style.getPropertyValue('overflow')).not.toContain('visible')
    expect(document.body.style.getPropertyPriority('overflow')).not.toBe('important')
  })

  it('stops at a SECTION ancestor', () => {
    cleanup()
    const section = document.createElement('section')
    section.style.overflow = 'hidden'
    section.style.lineHeight = '1.2'
    const inner = document.createElement('span')
    inner.textContent = 'test'
    section.appendChild(inner)
    document.body.appendChild(section)

    fixContainerClipping(inner)

    // SECTION is in LAYOUT_TAGS — should not be patched
    expect(section.style.getPropertyValue('overflow')).not.toContain('visible')
    expect(section.style.getPropertyValue('line-height')).not.toContain('1.22')
  })

  it('stops at a HEADER ancestor', () => {
    cleanup()
    const header = document.createElement('header')
    header.style.overflow = 'hidden'
    const inner = document.createElement('span')
    inner.textContent = 'test'
    header.appendChild(inner)
    document.body.appendChild(header)

    fixContainerClipping(inner)

    expect(header.style.getPropertyValue('overflow')).not.toContain('visible')
  })

  it('patches an intermediate DIV between inner span and layout container', () => {
    cleanup()
    const header = document.createElement('header') // LAYOUT_TAG — skipped
    const div = document.createElement('div')         // DIV — should be patched
    const inner = document.createElement('span')

    div.style.overflow = 'hidden'
    div.style.lineHeight = '1.1'

    inner.textContent = 'test'
    div.appendChild(inner)
    header.appendChild(div)
    document.body.appendChild(header)

    fixContainerClipping(inner)

    // The DIV should be patched
    expect(div.style.getPropertyValue('overflow')).toContain('visible')
    expect(div.style.getPropertyValue('line-height')).toContain('1.22')

    // The HEADER should NOT be patched
    expect(header.style.getPropertyPriority('overflow')).not.toBe('important')
  })

  it('walks up to 5 levels deep', () => {
    cleanup()
    let parent: HTMLElement = document.body
    const levels: HTMLElement[] = []

    for (let i = 0; i < 7; i++) {
      const el = document.createElement('div')
      el.style.overflow = 'hidden'
      parent.appendChild(el)
      parent = el
      levels.push(el)
    }

    const inner = document.createElement('span')
    inner.textContent = 'test'
    parent.appendChild(inner)

    fixContainerClipping(inner)

    // The loop starts at inner (level 0) and visits MAX_LEVELS=5 levels total
    // (0,1,2,3,4). That covers inner + 4 ancestor divs:
    //   level 0: inner (no overflow)
    //   level 1: levels[6] → patched
    //   level 2: levels[5] → patched
    //   level 3: levels[4] → patched
    //   level 4: levels[3] → patched
    // levels[2], [1], [0] should NOT be patched.
    for (let i = 0; i < 7; i++) {
      const idx = 6 - i
      if (i < 4) {
        expect(levels[idx].style.getPropertyValue('overflow')).toContain('visible')
      } else {
        expect(levels[idx].style.getPropertyPriority('overflow')).not.toBe('important')
      }
    }
  })
})

// ── data-kl-room caching ───────────────────────────────────────────

describe('fixContainerClipping: data-kl-room caching', () => {
  it('marks patched containers with data-kl-room', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'hidden'

    fixContainerClipping(inner)

    expect(root.hasAttribute('data-kl-room')).toBe(true)
  })

  it('skips already-patched containers but continues walking to unpatched ancestors', () => {
    cleanup()
    // Build: body > div2 (unpatched) > div1 (pre-patched) > span
    const div2 = document.createElement('div')
    div2.style.overflow = 'hidden'
    div2.style.lineHeight = '1.1'

    const div1 = document.createElement('div')
    div1.setAttribute('data-kl-room', 'true') // pre-patched, but NOT fixed
    div1.style.overflow = 'hidden'
    div1.style.lineHeight = '1.1'

    const inner = document.createElement('span')
    inner.textContent = 'test'

    div1.appendChild(inner)
    div2.appendChild(div1)
    document.body.appendChild(div2)

    fixContainerClipping(inner)

    // div1 was already marked — should be skipped, its styles unchanged
    expect(div1.style.getPropertyPriority('overflow')).not.toBe('important')

    // div2 is unpatched and should be fixed
    expect(div2.style.getPropertyValue('overflow')).toContain('visible')
    expect(div2.style.getPropertyValue('line-height')).toContain('1.22')
  })

  it('does not duplicate-patch a container already fixed', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'hidden'

    fixContainerClipping(inner)
    // Reset the style to check if it gets re-patched
    root.style.removeProperty('overflow')
    root.style.overflow = 'hidden'
    root.removeAttribute('data-kl-room')

    // First call patches it
    fixContainerClipping(inner)
    expect(root.style.getPropertyValue('overflow')).toContain('visible')

    // Remove the style again to simulate a style that wasn't patched
    root.style.removeProperty('overflow')
    root.style.overflow = 'hidden'
    // But keep data-kl-room — simulating the case where the walk hits
    // a container it had already marked in a previous call
    root.setAttribute('data-kl-room', 'true')
    fixContainerClipping(inner)

    // Should NOT be patched again since data-kl-room was set
    expect(root.style.getPropertyPriority('overflow')).not.toBe('important')
  })
})

// ── combined scenarios ─────────────────────────────────────────────

describe('fixContainerClipping: combined', () => {
  it('patches both overflow and line-height on the same container', () => {
    cleanup()
    const { root, inner } = makeTree()
    root.style.overflow = 'hidden'
    root.style.lineHeight = '1.1'

    fixContainerClipping(inner)

    expect(root.style.getPropertyValue('overflow')).toContain('visible')
    expect(root.style.getPropertyValue('line-height')).toContain('1.22')
    expect(root.hasAttribute('data-kl-room')).toBe(true)
  })

  it('patches multiple ancestors in a realistic YouTube-like DOM', () => {
    cleanup()
    // YouTube title DOM structure (simplified):
    //   <ytd-watch-metadata>
    //     <h1 style="overflow:hidden; line-height:1.3">
    //       <yt-formatted-string style="overflow:hidden">
    //         <span>日本語タイトル</span>
    //       </yt-formatted-string>
    //     </h1>
    //   </ytd-watch-metadata>

    const container = document.createElement('ytd-watch-metadata')

    const h1 = document.createElement('h1')
    h1.style.overflow = 'hidden'
    h1.style.lineHeight = '1.1'

    const formatted = document.createElement('yt-formatted-string')
    formatted.style.overflow = 'hidden'

    const inner = document.createElement('span')
    inner.textContent = '日本語タイトル'
    const ruby = document.createElement('ruby')
    ruby.className = 'kanjilens-ruby'
    ruby.innerHTML = '<rb>日本</rb><rt>にほん</rt>'
    inner.appendChild(ruby)

    formatted.appendChild(inner)
    h1.appendChild(formatted)
    container.appendChild(h1)
    document.body.appendChild(container)

    fixContainerClipping(inner)

    // yt-formatted-string (DIV-like) should be patched
    expect(formatted.style.getPropertyValue('overflow')).toContain('visible')

    // h1 should be patched (overflow + line-height)
    expect(h1.style.getPropertyValue('overflow')).toContain('visible')
    expect(h1.style.getPropertyValue('line-height')).toContain('1.22')

    // ytd-watch-metadata is not in LAYOUT_TAGS (custom element), so it
    // should also be patched if it has clipping — but it doesn't here
  })

  it('does nothing when no ancestor has clipping styles', () => {
    cleanup()
    const { root, inner } = makeTree()
    // No overflow or small line-height set

    fixContainerClipping(inner)

    // Should still be marked
    expect(root.hasAttribute('data-kl-room')).toBe(true)
    // But no styles should have been forcefully set
    expect(root.style.getPropertyPriority('overflow')).not.toBe('important')
    expect(root.style.getPropertyPriority('line-height')).not.toBe('important')
  })
})
