# Hero WebP pipeline

## Source and build

Source: `public/assets/silver-textile-hero-original.mp4` (1920x1080, 24 fps, approximately 9.04 seconds).

Rebuild with:

```powershell
python -m pip install imageio-ffmpeg
python scripts/build-hero-sequence.py
```

The script uses FFmpeg to extract 217 sequential WebP images at 24 fps, quality 76. Desktop frames are 1440x810 (10,818,954 bytes total); mobile frames are 864x486 (5,876,410 bytes total). `manifest.json` records the dimensions, frame count, frame rate and actual sizes. Only one variant is downloaded per mount. The source MP4 files remain available as production inputs but are no longer requested by the hero.

## Runtime

1. Render the existing poster immediately.
2. If reduced motion is requested, use only the poster; do not fetch the manifest or sequence.
3. Select mobile at viewport widths up to 900px; otherwise select desktop.
4. Load the manifest and decode frame 0 with `createImageBitmap`.
5. Draw to a canvas with centered cover cropping, reveal it and retain the existing 300svh scroll story.
6. ScrollTrigger maps scroll progress onto frames 0-216 and sends targets to `FrameBacklog`.
7. Playback visits every adjacent frame, at most one per animation callback. For a 20-to-50 scroll change, it paints 21, 22, 23, ... 50. It continues after scrolling stops until the backlog is empty.
8. Consecutive targets in the same direction combine into an endpoint. Reversals preserve their turning points: 20 -> 50 -> 30 plays forward through 50 before returning through 49 ... 30.
9. Cadence increases from 24 toward 60 fps as the backlog grows. It never skips frames to catch up. A long backlog therefore takes time to finish, and lower-refresh displays take longer. The browser may drop displayed paints under load; the application never intentionally skips frame indices.
10. Prefetch the next 12 desktop or 8 mobile queued frames for decoding. Eight background workers fetch compressed frames, raising priority while playback has a backlog. Keep at most 14 decoded desktop bitmaps or 10 mobile bitmaps, releasing the others with `close()`. Keep compressed data for reverse playback.
11. If the next image is not ready, hold the current frame until it loads. Retry failed image fetches up to three attempts. A persistent playback failure keeps the last visible image and preserves scroll geometry. Before initialization, the poster remains the fallback.
12. On resize, redraw the current frame with the new cover crop. On unmount or motion preference changes, abort requests, remove triggers and observers, cancel animation, and release image memory.

The hero's sticky scroll duration stays fixed. If a large scroll reaches its end before frame 216 is drawn, scrolling pauses once at that boundary while the backlog finishes, then resumes. This avoids repeated scroll corrections that can shake the viewport.

The intro now waits for the first 144 frames to download (six seconds at 24 fps). It also decodes the first 12 desktop frames or 8 mobile frames before revealing the page, keeping decoded memory bounded. The percentage counts completed opening frames: decoded for the first group, downloaded for the rest. Ten workers fill this opening buffer. Skip intro reveals the page immediately while buffering continues. Later compressed frames continue loading in the background. At the end of the sticky hero, scrolling is held until frame 216 has been drawn; navigation buttons can still jump to their destination.

## Files and checks

- `src/useScrollSequence.js`: loading, drawing, caching, scroll integration and cleanup.
- `src/frameBacklog.js`: ordered targets and adjacent-frame stepping.
- `scripts/build-hero-sequence.py`: reproducible frame extraction.
- `tests/frameBacklog.test.js`: jumps, reversals, target merging, buffering and bounds.

```powershell
node --test tests/frameBacklog.test.js
npm run build
```

## Scroll narrative

The displayed frame also selects one of four hero chapters: Made with purpose (0-54), From a thread (55-108), Made with care (109-162), and Ready for the world (163-216). Headings and supporting copy fade between chapters. They follow actual playback, including the backlog and reverse motion. The hero actions remain in a shared, fixed layout footprint across all chapters. Reduced-motion visitors see the opening chapter.


## First-load priority

HTML preloads the matching first WebP frame (68,406 bytes desktop or 36,784 bytes mobile) at high priority. The responsive hero picture uses that same asset instead of the 1,992,847-byte PNG. The manifest is also preloaded for visitors allowing motion. First-frame decoding and manifest loading run concurrently. The 144-frame opening buffer uses ten workers; later compressed frames load through eight workers, with higher priority during playback. Below-the-fold images load near their sections to reduce initial bandwidth competition. Priority is a browser hint, and actual timings still depend on network, device and hosting.
