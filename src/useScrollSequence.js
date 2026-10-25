import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FrameBacklog } from './frameBacklog'

gsap.registerPlugin(ScrollTrigger)

export default function useScrollSequence(storyRef, canvasRef, onChapterChange, onBufferProgress, onBufferReady, smoothScroll) {
  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const story = storyRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) return
      const abort = new AbortController()
      const blobs = new Map()
      const bitmaps = new Map()
      const decoding = new Map()
      let disposed = false
      let raf = 0
      let trigger
      let backlog
      let manifest
      let lastPaint = 0
      let ready = false
      let chapter = 0
      let holding = false
      const bufferSize = 48
      // Choose once per mount so resizing never replaces the playback sequence.
      const variant = window.matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop'
      const cacheLimit = variant === 'mobile' ? 10 : 14
      const prefetchAhead = cacheLimit - 2
      const decodedBufferSize = variant === 'mobile' ? 8 : 12
      const prefix = `/assets/hero-sequence/${variant}`

      const trim = () => {
        for (const [index, bitmap] of bitmaps) {
          if (bitmaps.size <= cacheLimit) break
          if (index === backlog?.current || index === backlog?.next()) continue
          bitmap.close()
          bitmaps.delete(index)
        }
      }
      const fetchFrame = (index, priority = 'high') => {
        if (!blobs.has(index)) {
          const promise = (async () => {
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                const response = await fetch(`${prefix}/frame-${String(index).padStart(4, '0')}.webp`, { signal: abort.signal, priority })
                if (!response.ok) throw new Error(`Frame ${index}: HTTP ${response.status}`)
                return await response.blob()
              } catch (error) {
                if (disposed || attempt === 2) throw error
              }
            }
          })()
          blobs.set(index, promise)
        }
        return blobs.get(index)
      }
      const preventScroll = (event) => {
        if (event.cancelable) event.preventDefault()
        event.stopImmediatePropagation()
      }
      const preventScrollKey = (event) => {
        if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) preventScroll(event)
      }
      const releaseHold = () => {
        if (!holding) return
        holding = false
        window.removeEventListener('wheel', preventScroll, true)
        window.removeEventListener('touchmove', preventScroll, true)
        window.removeEventListener('keydown', preventScrollKey)
        delete story.dataset.sequenceHold
      }
      const fail = (error) => {
        if (disposed) return
        console.warn('Hero sequence unavailable; keeping the last visible frame.', error)
        releaseHold()
        disposed = true
        abort.abort()
        cancelAnimationFrame(raf)
        trigger?.kill()
        // Retain the scroll geometry after activation to avoid a layout jump.
        story.dataset.sequenceState = 'error'
        onBufferReady()
      }
      const loadFrame = (index) => {
        if (index < 0 || (manifest && index >= manifest.frameCount)) return Promise.resolve()
        if (bitmaps.has(index)) return Promise.resolve()
        if (!decoding.has(index)) {
          const promise = fetchFrame(index).then(blob => createImageBitmap(blob)).then(bitmap => {
            if (disposed) { bitmap.close(); return }
            bitmaps.set(index, bitmap)
            trim()
          }).finally(() => decoding.delete(index))
          decoding.set(index, promise)
        }
        return decoding.get(index)
      }
      const draw = (index) => {
        const bitmap = bitmaps.get(index)
        if (!bitmap) return false
        bitmaps.delete(index)
        bitmaps.set(index, bitmap)
        const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height)
        const width = bitmap.width * scale
        const height = bitmap.height * scale
        context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
        story.style.setProperty('--film-progress', index / Math.max(1, manifest.frameCount - 1))
        story.dataset.displayedFrame = String(index)
        const nextChapter = Math.min(3, Math.floor(index / manifest.frameCount * 4))
        if (nextChapter !== chapter) {
          chapter = nextChapter
          onChapterChange(chapter)
        }
        return true
      }
      const prefetch = () => {
        const next = backlog.next()
        if (next === null) return
        const direction = Math.sign(next - backlog.current)
        const endpoint = backlog.targets[0]
        for (let offset = 1; offset <= prefetchAhead; offset++) {
          const index = backlog.current + direction * offset
          if ((direction > 0 && index > endpoint) || (direction < 0 && index < endpoint)) break
          loadFrame(index).catch(fail)
        }
      }
      const tick = (time) => {
        raf = 0
        if (disposed || !ready) return
        const next = backlog.next()
        if (next === null) { story.dataset.sequenceState = 'idle'; return }
        prefetch()
        // Increase playback cadence with queue depth, never skip a source frame.
        const fps = Math.min(60, manifest.fps + backlog.remaining * 1.2)
        if (time - lastPaint >= 1000 / fps) {
          if (draw(next)) {
            backlog.advance(next)
            const interval = 1000 / fps
            lastPaint = time - Math.min(time - lastPaint - interval, interval)
            story.dataset.backlog = String(backlog.remaining)
            story.dataset.sequenceState = 'playing'
            trim()
            if (backlog.current === manifest.frameCount - 1) releaseHold()
          } else {
            story.dataset.sequenceState = 'buffering'
          }
        }
        if (backlog.next() !== null) raf = requestAnimationFrame(tick)
        else story.dataset.sequenceState = 'idle'
      }
      const wake = () => {
        if (!disposed && ready && !raf && backlog.next() !== null) raf = requestAnimationFrame(tick)
      }
      const holdAtHeroEnd = () => {
        if (!ready || disposed) return
        if (story.dataset.skipSequence === 'true') { releaseHold(); return }
        if (backlog.current >= manifest.frameCount - 1) { releaseHold(); return }
        const end = story.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
        if (holding) {
          if (window.scrollY > end + 1) {
            if (smoothScroll.current) smoothScroll.current.scrollTo(end, { immediate: true, force: true })
            else window.scrollTo(0, end)
          }
          return
        }
        if (window.scrollY < end - 1) return
        holding = true
        story.dataset.sequenceHold = 'true'
        backlog.request(manifest.frameCount - 1)
        story.dataset.targetFrame = String(backlog.requested)
        wake()
        window.addEventListener('wheel', preventScroll, { capture: true, passive: false })
        window.addEventListener('touchmove', preventScroll, { capture: true, passive: false })
        window.addEventListener('keydown', preventScrollKey)
        if (smoothScroll.current) smoothScroll.current.scrollTo(end, { immediate: true, force: true })
        else window.scrollTo(0, end)
      }
      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        if (ready) draw(backlog.current)
      }
      const observer = new ResizeObserver(resize)
      observer.observe(canvas)

      const initialize = async () => {
        const [response] = await Promise.all([
          fetch('/assets/hero-sequence/manifest.json', { signal: abort.signal, priority: 'high' }),
          loadFrame(0),
        ])
        if (!response.ok) throw new Error('Hero manifest unavailable')
        manifest = await response.json()
        backlog = new FrameBacklog(manifest.frameCount)
        if (disposed) return
        onBufferProgress(1, bufferSize)
        resize()
        draw(0)
        ready = true
        story.dataset.sequenceReady = 'true'
        story.dataset.sequenceState = 'idle'
        story.dataset.backlog = '0'
        const update = (self) => {
          backlog.request(self.progress * (manifest.frameCount - 1))
          story.dataset.targetFrame = String(backlog.requested)
          story.dataset.backlog = String(backlog.remaining)
          wake()
        }
        trigger = ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { update(self); holdAtHeroEnd() }, onRefresh: (self) => { update(self); holdAtHeroEnd() } })
        window.addEventListener('scroll', holdAtHeroEnd, { passive: true })
        ScrollTrigger.refresh()
        update(trigger)
        holdAtHeroEnd()
        // Download two seconds of frames, decoding only the first few to bound memory.
        let buffered = 1
        let openingCursor = 1
        const fillOpeningBuffer = async () => {
          while (!disposed && openingCursor < Math.min(bufferSize, manifest.frameCount)) {
            const index = openingCursor++
            if (index < decodedBufferSize) await loadFrame(index)
            else await fetchFrame(index)
            if (disposed) return
            buffered += 1
            onBufferProgress(buffered, bufferSize)
          }
        }
        await Promise.all(Array.from({ length: 6 }, fillOpeningBuffer))
        if (disposed) return
        onBufferReady()
        // Keep compressed data for reverse playback; decoded image memory is bounded.
        let cursor = bufferSize
        const worker = async () => {
          while (!disposed && cursor < manifest.frameCount) {
            const index = cursor++
            try { await fetchFrame(index, backlog.remaining > 0 ? 'high' : 'low') } catch (error) {
              // A distant failure should not stop playback of already loaded frames.
              blobs.delete(index)
              if (disposed) return
            }
          }
        }
        await Promise.all(Array.from({ length: 8 }, worker))
      }
      initialize().catch(fail)
      return () => {
        releaseHold()
        disposed = true
        abort.abort()
        cancelAnimationFrame(raf)
        observer.disconnect()
        window.removeEventListener('scroll', holdAtHeroEnd)
        trigger?.kill()
        bitmaps.forEach(bitmap => bitmap.close())
        bitmaps.clear()
        blobs.clear()
        for (const key of ['sequenceReady', 'sequenceState', 'sequenceHold', 'displayedFrame', 'targetFrame', 'backlog']) delete story.dataset[key]
        story.style.removeProperty('--film-progress')
        onChapterChange(0)
      }
    })
    return () => media.revert()
  }, [storyRef, canvasRef, onChapterChange, onBufferProgress, onBufferReady, smoothScroll])
}
