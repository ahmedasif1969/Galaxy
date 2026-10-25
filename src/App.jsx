import React, { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import useScrollSequence from './useScrollSequence'

gsap.registerPlugin(ScrollTrigger)

const capabilities = [
  {
    id: '01',
    title: 'Knitting',
    copy: 'Pakistan’s largest yarn-dyed and jacquard circular knitting facility, creating fabric lines for every season.',
    image: '/assets/editorial-knitting.webp',
  },
  {
    id: '02',
    title: 'Dyeing',
    copy: 'An integrated supply chain that begins with greige fabric and keeps color, consistency and quality in view.',
    image: '/assets/editorial-dyeing.webp',
  },
  {
    id: '03',
    title: 'Stitching',
    copy: 'Apparel production at scale, backed by real-time ERP reporting and an exacting approach to delivery.',
    image: '/assets/editorial-stitching.webp',
  },
  {
    id: '04',
    title: 'Printing',
    copy: 'A full-service manufacturing process built to carry ideas from development through finished garments.',
    image: '/assets/editorial-printing.webp',
  },
  {
    id: '05',
    title: 'R & D',
    copy: 'Dedicated development across new yarns, washes, embroidery and fashion styling for commercially sharper products.',
    image: '/assets/editorial-research.webp',
  },
]

const capabilityDetails = [
  { process: 'Circular knitting · yarn-dyed structures · jacquards', materials: 'Single jersey, pique, interlock and double knit jacquard', benefit: 'Build a fabric direction around the feel and structure of your collection.' },
  { process: 'Greige fabric · color development · finishing', materials: 'Knitted fabric developed for consistent color and handle', benefit: 'Keep the material story connected as fabric moves through production.' },
  { process: 'Cutting · assembly · production reporting', materials: 'Finished apparel made from the developed fabric range', benefit: 'Follow your collection from fabric through garment construction.' },
  { process: 'Artwork development · application · finished detail', materials: 'Print-led apparel and collection-specific surface details', benefit: 'Carry your creative direction into the finished garment.' },
  { process: 'Yarn exploration · wash development · styling', materials: 'New yarns, embroidery, washes and seasonal fabric ideas', benefit: 'Explore material and finish options before defining your collection.' },
]

const heroChapters = [
  { first: 'Made with', second: 'purpose.', copy: 'Integrated textile and apparel manufacturing—from fabric development to finished garments, built for global brands.' },
  { first: 'From a', second: 'thread.', copy: 'Every collection begins with a material. Yarn, texture and structure shape the possibilities.' },
  { first: 'Made with', second: 'care.', copy: 'Development, knitting, dyeing and stitching bring the details together, one step at a time.' },
  { first: 'Ready for', second: 'the world.', copy: 'From the first fabric to the finished collection. Apparel made to carry your vision forward.' },
]

const values = ['Honesty & integrity', 'Dedication & accountability', 'Teamwork', 'Diversity & inclusion']

function Arrow({ diagonal = false }) {
  return (
    <svg className="arrow-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={diagonal ? 'M5 19 19 5M8 5h11v11' : 'M5 12h14M14 7l5 5-5 5'} />
    </svg>
  )
}

function DeferredImage({ enabled = true, src, ...props }) {
  const imageRef = useRef(null)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    if (!enabled || requested) return
    const image = imageRef.current
    if (!image || !('IntersectionObserver' in window)) {
      setRequested(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRequested(true)
        observer.disconnect()
      }
    }, { rootMargin: '400px 0px' })
    observer.observe(image)
    return () => observer.disconnect()
  }, [enabled, requested])

  return <img ref={imageRef} src={requested ? src : undefined} loading="lazy" decoding="async" {...props} />
}

function App() {
  const root = useRef(null)
  const heroStory = useRef(null)
  const heroCanvas = useRef(null)
  const smoothScroll = useRef(null)
  const [activeCapability, setActiveCapability] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const [heroChapter, setHeroChapter] = useState(0)
  const [introVisible, setIntroVisible] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [bufferProgress, setBufferProgress] = useState({ ready: 0, total: 12 })
  const reportBufferProgress = useCallback((ready, total) => setBufferProgress({ ready, total }), [])
  const dismissIntro = useCallback(() => setIntroVisible(false), [])

  useScrollSequence(heroStory, heroCanvas, setHeroChapter, reportBufferProgress, dismissIntro, smoothScroll)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 0.9, smoothWheel: true, wheelMultiplier: 0.95 })
    smoothScroll.current = lenis
    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
    lenis.on('scroll', ScrollTrigger.update)

    let responsiveMotion
    const context = gsap.context(() => {
      gsap.from('.nav-inner', { y: -30, opacity: 0, duration: 1, ease: 'power3.out' })
      gsap.from('.hero-title', {
        yPercent: 110,
        rotate: 2,
        duration: 1.25,
        stagger: 0.09,
        ease: 'power4.out',
        delay: 0.12,
      })
      gsap.from('.hero-kicker, .hero-copy, .hero-actions, .hero-index', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.55,
        ease: 'power3.out',
      })

      gsap.utils.toArray('.reveal').forEach((element) => {
        gsap.from(element, {
          y: 55,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 86%', once: true },
        })
      })

      gsap.utils.toArray('.image-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.3,
            ease: 'power4.inOut',
            scrollTrigger: { trigger: element, start: 'top 82%', once: true },
          },
        )
      })

      responsiveMotion = gsap.matchMedia()
      responsiveMotion.add('(min-width: 901px)', () => {
        ScrollTrigger.create({ trigger: '.material-atlas', start: 'top top', end: 'bottom bottom', pin: '.material-heading', pinSpacing: false })
        gsap.utils.toArray('.material-panel').forEach((panel) => {
          gsap.fromTo(panel, { y: 70, opacity: 0.45 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: panel, start: 'top 90%', end: 'top 35%', scrub: 0.6 } })
        })
      })
      gsap.utils.toArray('.material-photo img, .fabric-main img, .responsibility-image img').forEach((element) => {
        gsap.fromTo(element, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 } })
      })
      const words = gsap.utils.toArray('.responsibility-title .reveal-word')
      gsap.fromTo(words, { opacity: 0.25 }, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: '.responsibility-title', start: 'top 85%', end: 'bottom 45%', scrub: 0.7 } })

      gsap.from('.stat-number', {
        textContent: 0,
        duration: 1.8,
        snap: { textContent: 1 },
        ease: 'power2.out',
        scrollTrigger: { trigger: '.stats', start: 'top 78%', once: true },
      })
    }, root)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      smoothScroll.current = null
      responsiveMotion?.revert()
      context.revert()
    }
  }, [])

  useEffect(() => {
    if (!introVisible) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    smoothScroll.current?.stop()
    return () => {
      document.body.style.overflow = previousOverflow
      smoothScroll.current?.start()
    }
  }, [introVisible])

  const scrollTo = (id) => {
    if (heroStory.current) heroStory.current.dataset.skipSequence = 'true'
    const target = document.querySelector(id)
    if (target) {
      if (smoothScroll.current) {
        smoothScroll.current.start()
        smoothScroll.current.scrollTo(target, { onComplete: () => {
          if (id === '#top' && heroStory.current) heroStory.current.dataset.skipSequence = 'false'
        } })
      } else {
        target.scrollIntoView({ behavior: 'instant' })
        if (id === '#top' && heroStory.current) heroStory.current.dataset.skipSequence = 'false'
      }
    }
    setMenuOpen(false)
  }

  return (
    <div ref={root} className="site-shell">
      {introVisible && (
        <div className="intro-loader" role="dialog" aria-modal="true" aria-label="Preparing your experience">
          <div className="intro-loader-top"><span>Silver Textile</span><span>Fabric to finished</span></div>
          <div className="intro-loader-center">
            <p className="intro-loader-label">Preparing your experience</p>
            <p className="intro-loader-count" aria-live="polite">{Math.round(bufferProgress.ready / bufferProgress.total * 100)}<span>%</span></p>
            <div className="intro-loader-track" role="progressbar" aria-label="Experience loading progress" aria-valuenow={bufferProgress.ready} aria-valuemin={0} aria-valuemax={bufferProgress.total}>
              <span style={{ transform: `scaleX(${bufferProgress.ready / bufferProgress.total})` }} />
            </div>
            <p className="intro-loader-detail">The story begins in a moment.</p>
          </div>
          <button className="intro-skip" onClick={dismissIntro}>Skip intro <Arrow /></button>
        </div>
      )}
      <header className="site-nav">
        <div className="nav-inner">
          <button className="brand" onClick={() => scrollTo('#top')} aria-label="Silver Textile home">
            <img src="/assets/silver-textile-logo.svg" alt="" />
            <span>Silver Textile</span>
          </button>

          <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Primary navigation">
            <button onClick={() => scrollTo('#about')}>About</button>
            <button onClick={() => scrollTo('#capabilities')}>Capabilities</button>
            <button onClick={() => scrollTo('#sustainability')}>Responsibility</button>
          </nav>

          <button className="nav-cta" onClick={() => scrollTo('#contact')}>
            Start a conversation <Arrow diagonal />
          </button>
          <button
            className={menuOpen ? 'menu-toggle active' : 'menu-toggle'}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
        <div id="top" className="hero-story" ref={heroStory}>
        <section className="hero" aria-label="Silver Textile introduction">
          <div className="hero-media" aria-hidden="true">
            <picture>
              <source media="(max-width: 900px)" srcSet="/assets/hero-sequence/mobile/frame-0000.webp" />
              <img src="/assets/hero-sequence/desktop/frame-0000.webp" alt="" fetchPriority="high" loading="eager" crossOrigin="anonymous" />
            </picture>
            <canvas ref={heroCanvas} className="hero-sequence" aria-hidden="true" />
            <div className="hero-wash" />
          </div>
          <div className="hero-grid grid-pad">
            <p className="hero-kicker eyebrow light">Integrated apparel manufacturing · Karachi</p>
            <h1 className="hero-title hero-narrative" aria-label={`${heroChapters[heroChapter].first} ${heroChapters[heroChapter].second}`}>
              {heroChapters.map((chapter, index) => (
                <span className={`hero-chapter${index === heroChapter ? ' is-active' : ''}`} key={chapter.second} aria-hidden="true">
                  <span className="hero-line"><span>{chapter.first}</span></span>
                  <span className="hero-line serif"><span>{chapter.second}</span></span>
                </span>
              ))}
            </h1>
            <div className="hero-bottom">
              <div className="hero-copy hero-copy-narrative">
                {heroChapters.map((chapter, index) => (
                  <p className={`hero-chapter-copy${index === heroChapter ? ' is-active' : ''}`} key={chapter.second} aria-hidden={index !== heroChapter}>
                    {chapter.copy}
                  </p>
                ))}
              </div>
              <div className="hero-actions">
                <button className="pill-button light-button" onClick={() => scrollTo('#about')}>
                  Discover ST <Arrow />
                </button>
                <button className="text-link light" onClick={() => scrollTo('#capabilities')}>
                  Explore capabilities <span>↘</span>
                </button>
              </div>
            </div>
            <div className="hero-index" aria-hidden="true">
              <span>Yarn</span><i /><span>Apparel</span>
            </div>
            <p className="hero-scroll-cue">Scroll to follow the thread <span aria-hidden="true">↓</span></p>
          </div>
          <div className="brand-stitch" aria-hidden="true"><i /><i /><i /></div>
        </section>
        </div>

        <section id="about" className="intro section-pad">
          <div className="section-head reveal">
            <p className="eyebrow">Who we are</p>
            <p className="section-number">01 — 05</p>
          </div>
          <div className="intro-layout">
            <h2 className="display-title reveal">
              We make apparel that <span className="serif">moves business</span> forward.
            </h2>
            <div className="intro-copy reveal">
              <p>
                Silver Textile is a leading apparel manufacturer with a supply chain that runs from greige fabric to finished garments.
              </p>
              <p>
                Performance, commitment and high standards of customer service have made us a trusted long-term partner to retailers across the world.
              </p>
            </div>
          </div>

          <div className="image-story">
            <figure className="image-reveal story-large">
              <DeferredImage src="/assets/silver-textile-about.webp" alt="Silver Textile team preparing a finished apparel shipment" />
              <figcaption><span>Every order, seen through</span><span>Karachi, Pakistan</span></figcaption>
            </figure>
            <div className="story-note reveal">
              <span className="big-mark">ST</span>
              <p>Built around reliability—from development and production to quality and delivery.</p>
            </div>
          </div>

          <div className="stats">
            <article className="stat reveal">
              <p><span className="stat-number">1</span><em>M</em></p>
              <span>garments produced every month</span>
            </article>
            <article className="stat reveal">
              <p><span className="stat-number">5</span></p>
              <span>integrated core capabilities</span>
            </article>
            <article className="stat reveal">
              <p><span className="stat-number">1</span><em>×</em></p>
              <span>supply chain, from fabric to apparel</span>
            </article>
          </div>
        </section>

        <section id="capabilities" className="capabilities-section section-pad dark-section">
          <div className="section-head reveal">
            <p className="eyebrow light">What we do</p>
            <p className="section-number light">02 — 05</p>
          </div>
          <div className="capability-heading reveal">
            <h2 className="display-title light">One process.<br /><span className="serif">Endless possibility.</span></h2>
            <p>
              State-of-the-art machinery and our proprietary ERP system connect every step, enabling live production and quality reporting.
            </p>
          </div>

          <div className="capability-explorer">
            <div className="capability-list" role="tablist" aria-label="Manufacturing capabilities" aria-orientation="vertical">
              {capabilities.map((item, index) => (
                <button
                  className={activeCapability === index ? 'capability-row active' : 'capability-row'}
                  key={item.title}
                  role="tab"
                  id={`capability-tab-${index}`}
                  aria-selected={activeCapability === index}
                  aria-controls="capability-panel"
                  onKeyDown={(event) => {
                    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                      event.preventDefault()
                      const next = event.key === 'Home' ? 0 : event.key === 'End' ? capabilities.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + capabilities.length) % capabilities.length
                      setActiveCapability(next)
                      document.getElementById(`capability-tab-${next}`)?.focus()
                    }
                  }}
                  onMouseEnter={() => setActiveCapability(index)}
                  onFocus={() => setActiveCapability(index)}
                  onClick={() => setActiveCapability(index)}
                >
                  <span className="cap-id">{item.id}</span>
                  <span className="cap-title">{item.title}</span>
                  <span className="cap-arrow">↗</span>
                </button>
              ))}
            </div>
            <div className="capability-display" id="capability-panel" role="tabpanel" aria-labelledby={`capability-tab-${activeCapability}`}><div className="capability-preview image-reveal">
              {capabilities.map((item, index) => (
                <DeferredImage enabled={activeCapability === index}
                  key={item.title}
                  className={activeCapability === index ? 'active' : ''}
                  src={item.image}
                  alt=""
                />
              ))}
              <div className="preview-copy" aria-live="polite">
                <span>{capabilities[activeCapability].id} / 05</span>
                <p>{capabilities[activeCapability].copy}</p>
              </div>
            </div>
            <div className="capability-detail" aria-live="polite">
              <p className="capability-benefit">{capabilityDetails[activeCapability].benefit}</p>
              <dl><div><dt>Process</dt><dd>{capabilityDetails[activeCapability].process}</dd></div><div><dt>Material & output</dt><dd>{capabilityDetails[activeCapability].materials}</dd></div></dl>
            </div></div>
          </div>
        </section>

        <section className="fabric-story section-pad">
          <div className="section-head reveal">
            <p className="eyebrow">Fabric to finished</p>
            <p className="section-number">03 — 05</p>
          </div>
          <div className="fabric-grid">
            <div className="fabric-copy">
              <h2 className="display-title reveal">Engineered for <span className="serif">the entire journey.</span></h2>
              <p className="reveal">
                Fleece, single jersey, pique, thermal, interlock, flat back rib, inter rib, double knit jacquard and auto-striper jacquard—developed to keep collections fresh and competitive.
              </p>
              <a className="pill-button dark-button reveal" href="mailto:hello@silvertextile.co">
                Discuss a collection <Arrow />
              </a>
            </div>
            <div className="fabric-images">
              <figure className="image-reveal fabric-main">
                <DeferredImage src="/assets/editorial-collection.webp" alt="Premium knitwear collection in Silver Textile's material palette" />
              </figure>
              <figure className="image-reveal fabric-detail">
                <DeferredImage src="/assets/editorial-development.webp" alt="Knit swatches and yarns in an apparel development studio" />
                <figcaption>New yarns · washes · embroidery · styling</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="material-atlas section-pad" aria-labelledby="material-title">
          <div className="material-heading reveal"><p className="eyebrow">A closer look</p><h2 id="material-title" className="display-title">The difference is <span className="serif">in the detail.</span></h2><p>Explore the textures, construction and finishing details that give a collection its character.</p></div>
          <div className="material-panels">
            <figure className="material-panel"><div className="material-photo"><DeferredImage src="/assets/editorial-development.webp" alt="Textured knit swatches beside yarn cones" /></div><figcaption><span>01 / Material</span><h3>Start with the handfeel.</h3><p>Yarn, texture and knit structure set the direction for everything that follows.</p></figcaption></figure>
            <figure className="material-panel"><div className="material-photo"><DeferredImage src="/assets/editorial-stitching.webp" alt="Garment stitching and construction detail" /></div><figcaption><span>02 / Construction</span><h3>Consider every seam.</h3><p>Construction brings the material together, shaping how a garment feels and moves.</p></figcaption></figure>
            <figure className="material-panel"><div className="material-photo"><DeferredImage src="/assets/editorial-collection.webp" alt="Finished knitwear in a coordinated collection" /></div><figcaption><span>03 / Collection</span><h3>Bring the vision together.</h3><p>Color, finish and styling turn individual pieces into a coherent collection.</p></figcaption></figure>
          </div>
        </section>

        <section className="partners">
          <div className="partner-track" aria-label="Retail partners">
            <span>Trusted by</span>
            <DeferredImage src="/assets/vf-corp.png" alt="VF Corporation" />
            <DeferredImage src="/assets/kohls.png" alt="Kohl's" />
            <DeferredImage src="/assets/jcpenney.png" alt="JCPenney" />
            <DeferredImage src="/assets/macys.png" alt="Macy's" />
            <DeferredImage src="/assets/burlington.png" alt="Burlington" />
            <span aria-hidden="true">Trusted by</span>
            <DeferredImage src="/assets/vf-corp.png" alt="" aria-hidden="true" />
            <DeferredImage src="/assets/kohls.png" alt="" aria-hidden="true" />
            <DeferredImage src="/assets/jcpenney.png" alt="" aria-hidden="true" />
            <DeferredImage src="/assets/macys.png" alt="" aria-hidden="true" />
            <DeferredImage src="/assets/burlington.png" alt="" aria-hidden="true" />
          </div>
        </section>

        <section id="sustainability" className="responsibility section-pad">
          <div className="section-head reveal">
            <p className="eyebrow">How we think</p>
            <p className="section-number">04 — 05</p>
          </div>
          <div className="responsibility-title reveal">
            <h2 className="display-title">{'Progress is only real when it is'.split(' ').map((word, index) => <React.Fragment key={index}><span className="reveal-word">{word}</span>{' '}</React.Fragment>)}<span className="serif reveal-word">responsible.</span></h2>
          </div>
          <div className="responsibility-grid">
            <figure className="image-reveal responsibility-image">
              <DeferredImage src="/assets/editorial-responsibility.webp" alt="Closed-loop water treatment system in a modern textile facility" />
              <div className="orbit-stamp"><span>GO GREEN · ST ·</span></div>
            </figure>
            <div className="responsibility-copy reveal">
              <p className="lead">
                Our ambition is clear: move toward a zero-carbon footprint and build a green factory aligned with global standards for eco-friendly textile manufacturing.
              </p>
              <div className="responsibility-item">
                <span>01</span>
                <div><h3>In-house laboratory</h3><p>Fabrics are rigorously tested before cutting, following AATCC standards for buyers.</p></div>
              </div>
              <div className="responsibility-item">
                <span>02</span>
                <div><h3>Smarter development</h3><p>Products are developed to increase customer sales, reduce costs and embody sustainability.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="values-strip" aria-label="Our values">
          <div className="values-track">
            {[...values, ...values].map((value, index) => (
              <span key={`${value}-${index}`}>{value}<i>✦</i></span>
            ))}
          </div>
        </section>

        <section id="contact" className="contact section-pad dark-section">
          <div className="section-head reveal">
            <p className="eyebrow light">Start something</p>
            <p className="section-number light">05 — 05</p>
          </div>
          <div className="contact-layout">
            <div className="contact-heading reveal">
              <h2>Let’s make what’s <span className="serif">next.</span></h2>
              <a className="contact-email" href="mailto:hello@silvertextile.co">
                hello@silvertextile.co <Arrow diagonal />
              </a>
            </div>
            <div className="contact-details reveal">
              <div>
                <span>Visit</span>
                <p>Plot 00, Silver Avenue<br />Textile District<br />Karachi 00000, Pakistan</p>
              </div>
              <div>
                <span>Call</span>
                <a href="tel:+923000000000">+92 300 000 0000</a>
              </div>
              <div>
                <span>Navigate</span>
                <button onClick={() => scrollTo('#about')}>About</button>
                <button onClick={() => scrollTo('#capabilities')}>Capabilities</button>
                <button onClick={() => scrollTo('#sustainability')}>Responsibility</button>
              </div>
            </div>
          </div>
          <footer>
            <div className="footer-brand"><DeferredImage src="/assets/silver-textile-logo.svg" alt="" /><span>Silver Textile</span></div>
            <p>© {new Date().getFullYear()} ST. Crafted for progress.</p>
            <button onClick={() => scrollTo('#top')}>Back to top ↑</button>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App
