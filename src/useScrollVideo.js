import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function useScrollVideo(storyRef, videoRef) {
  useEffect(() => {
    const story = storyRef.current
    const video = videoRef.current
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      let disposed = false
      let tween
      let seekFrame = 0
      const playhead = { progress: 0 }

      // Coalesce scroll updates to one seek per animation frame. The scrub
      // encode has a keyframe every four frames, so a newer seek can safely
      // supersede one already in progress without a long decoder backtrack.
      const seek = () => {
        seekFrame = 0
        if (disposed || video.readyState < 2) return
        const target = playhead.progress * Math.max(0, video.duration - 0.04)
        if (Number.isFinite(target) && Math.abs(video.currentTime - target) > 1 / 48) {
          video.currentTime = target
        }
      }
      const queueSeek = () => {
        if (!disposed && !seekFrame) seekFrame = requestAnimationFrame(seek)
      }
      const update = () => {
        story.style.setProperty('--film-progress', playhead.progress)
        queueSeek()
      }
      const setup = () => {
        if (disposed || tween || !Number.isFinite(video.duration)) return
        story.dataset.videoReady = 'true'
        tween = gsap.to(playhead, {
          progress: 1,
          ease: 'none',
          onUpdate: update,
          scrollTrigger: {
            trigger: story,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: queueSeek,
          },
        })
        ScrollTrigger.refresh()
        queueSeek()
      }
      const fail = () => {
        tween?.scrollTrigger?.kill()
        tween?.kill()
        story.dataset.videoReady = 'false'
        ScrollTrigger.refresh()
      }

      video.addEventListener('loadeddata', setup)
      video.addEventListener('error', fail)
      video.src = '/assets/silver-textile-hero-scrub.mp4'
      video.load()
      if (video.readyState >= 2) setup()

      return () => {
        disposed = true
        cancelAnimationFrame(seekFrame)
        video.removeEventListener('loadeddata', setup)
        video.removeEventListener('error', fail)
        tween?.scrollTrigger?.kill()
        tween?.kill()
        video.pause()
        video.removeAttribute('src')
        video.load()
        delete story.dataset.videoReady
        story.style.removeProperty('--film-progress')
      }
    })

    return () => media.revert()
  }, [storyRef, videoRef])
}
