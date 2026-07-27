import { useState } from 'react'
import { ArrowUpRight, Award, X } from 'lucide-react'
import { getNoteAppUrl, getWhaleFallAppUrl } from './noteAppUrl'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_154941_df1a96e1-a06f-450c-bd02-d863414cc1a0.mp4'

const NAV_LINKS = [
  { label: 'Offerings', href: '#' },
  { label: 'Inquire', href: '#' },
]

function CetaeonMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="鲸序标志"
      className={className}
    >
      <rect
        x="8.5"
        y="8.5"
        width="47"
        height="47"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M17 19 C23 20.5 28 24.5 32 31 C36 24.5 41 20.5 47 19 C45.5 28 39 35 32 38 C25 35 18.5 28 17 19 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M32 31 L32 49"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="49" r="2.1" fill="currentColor" />
      <circle cx="24" cy="53" r="1.35" fill="#e24a39" />
      <circle cx="40" cy="53.5" r="1.35" fill="#e24a39" />
    </svg>
  )
}

function BrandLockup() {
  return (
    <span className="flex items-center gap-3 text-white">
      <CetaeonMark className="h-8 w-8 sm:h-9 sm:w-9" />
      <span className="flex items-baseline gap-2">
        <span className="font-podium text-2xl font-bold uppercase tracking-wider sm:text-3xl">
          CETAEON
        </span>
        <span className="hidden font-inter text-sm font-semibold text-white/70 sm:inline">
          鲸序
        </span>
      </span>
    </span>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const noteAppUrl = getNoteAppUrl()
  const whaleFallAppUrl = getWhaleFallAppUrl()
  const navLinks = [
    { label: '笔记生花', href: noteAppUrl },
    { label: '鲸落“生”', href: whaleFallAppUrl },
    ...NAV_LINKS,
  ]

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full w-full flex-col">
        <nav className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 lg:py-7">
          <BrandLockup />

          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href !== '#' ? '_blank' : undefined}
                rel={link.href !== '#' ? 'noopener noreferrer' : undefined}
                className="font-inter text-sm uppercase tracking-widest text-white/80 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href="#"
            className="hidden items-center gap-2 border border-white/30 px-6 py-3 font-inter text-xs uppercase tracking-widest text-white transition hover:border-white/60 hover:bg-white/10 md:flex"
          >
            Get in Touch
            <ArrowUpRight className="h-4 w-4" />
          </a>

          <button
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-end space-y-1.5 md:hidden"
          >
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-4 bg-white" />
          </button>
        </nav>

        <div
          className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-sm transition-all duration-500 md:hidden ${
            menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 sm:px-10">
            <BrandLockup />
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X className="h-7 w-7 text-white" />
            </button>
          </div>

          <div className="flex h-[calc(100%-88px)] flex-col items-center justify-center gap-6">
            {navLinks.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href !== '#' ? '_blank' : undefined}
                rel={link.href !== '#' ? 'noopener noreferrer' : undefined}
                onClick={() => setMenuOpen(false)}
                className="font-podium text-4xl uppercase text-white transition-all duration-500 sm:text-5xl"
                style={{
                  transitionDelay: `${i * 80 + 100}ms`,
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                {link.label}
              </a>
            ))}

            <a
              href="#"
              onClick={() => setMenuOpen(false)}
              className="mt-4 flex items-center gap-2 border border-white/30 px-6 py-3 font-inter text-xs uppercase tracking-widest text-white transition-all duration-500 hover:border-white/60 hover:bg-white/10"
              style={{
                  transitionDelay: `${navLinks.length * 80 + 100}ms`,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
              }}
            >
              Get in Touch
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 sm:px-10 lg:px-16">
          <div className="mb-6 flex animate-fade-up items-center gap-2 lg:mb-8">
            <CetaeonMark className="h-5 w-5 text-white/70" />
            <span className="font-inter text-xs uppercase tracking-[0.3em] text-white/70 sm:text-sm">
              World-Class AI Collective
            </span>
          </div>

          <h1 className="animate-fade-up-delay-1 font-podium uppercase leading-[0.92] tracking-tight text-white">
            <span className="block text-[clamp(2.8rem,8vw,7rem)]">Design.</span>
            <span className="block text-[clamp(2.8rem,8vw,7rem)]">Disrupt.</span>
            <span className="block text-[clamp(2.8rem,8vw,7rem)]">Conquer.</span>
          </h1>

          <p className="animate-fade-up-delay-2 mt-6 max-w-md font-inter text-sm leading-relaxed text-white/70 sm:text-base lg:mt-8">
            We build fierce brand identities
            <br />
            that don't just turn heads -- <span className="font-bold text-white">they lead.</span>
          </p>

          <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-4 sm:gap-6 lg:mt-10">
            <a
              href={noteAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-black px-5 py-3 font-inter text-[11px] uppercase tracking-widest text-white transition hover:bg-neutral-900 sm:px-7 sm:py-4 sm:text-xs"
            >
              See Our Work
              <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>

            <div className="hidden items-center gap-3 sm:flex">
              <Award className="h-8 w-8 text-white/50" />
              <div className="font-inter text-xs uppercase tracking-wider text-white/60">
                <div>Top-Rated</div>
                <div>Brand Studio</div>
              </div>
            </div>
          </div>

          <div className="animate-fade-up-delay-4 mt-4 flex flex-wrap gap-6 sm:mt-4 sm:gap-12 lg:mt-6 lg:gap-16">
            {[
              { value: '250+', label: 'Brands Transformed' },
              { value: '95%', label: 'Client Retention' },
              { value: '10+', label: 'Years in the Game' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-inter text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-1 font-inter text-[9px] uppercase tracking-widest text-white/50 sm:text-xs">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
