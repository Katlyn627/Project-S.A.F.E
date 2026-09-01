import React from 'react'

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export const SafeLogo: React.FC<LogoProps> = ({ className = '', size = 40, showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Dynamic S.A.F.E. Brand Emblem */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-700 to-sky-500 shadow-md shadow-indigo-500/20 p-2 text-white ring-1 ring-white/20"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow"
        >
          {/* Shield Boundary */}
          <path
            d="M24 4L8 10V22C8 32.5 14.8 42.2 24 45C33.2 42.2 40 32.5 40 22V10L24 4Z"
            fill="url(#shieldGradient)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          {/* Rising Sun of Empowerment */}
          <circle cx="24" cy="20" r="7" fill="#FBBF24" opacity="0.9" />
          <path
            d="M24 10V12M24 28V30M14 20H16M32 20H34M17 13L18.5 14.5M29.5 25.5L31 27M17 27L18.5 25.5M29.5 14.5L31 13"
            stroke="#FEF3C7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Open Book of Education */}
          <path
            d="M14 28C17 26.5 21 27 24 29C27 27 31 26.5 34 28V38C31 36.5 27 37 24 39C21 37 17 36.5 14 38V28Z"
            fill="#FFFFFF"
          />
          <path
            d="M24 29V39"
            stroke="#4338CA"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="shieldGradient" x1="8" y1="4" x2="40" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F46E5" />
              <stop offset="0.6" stopColor="#2563EB" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-wider text-white font-sans">
              PROJECT <span className="text-sky-400">S.A.F.E.</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-300 border border-sky-400/30">
              PWA 2G
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-300 tracking-tight">
            School Attendance &amp; Foundational Empowerment
          </span>
        </div>
      )}
    </div>
  )
}
