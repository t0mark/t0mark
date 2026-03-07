'use client'

import { useState } from 'react'
import NavLink from './NavLink'
import Image from 'next/image'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/paper', label: 'Paper' },
  { href: '/projects', label: 'Project' },
  { href: '/graduate', label: 'Graduate' },
  { href: '/cv', label: 'CV' },
]

const socialLinks = [
  { href: 'https://www.notion.so/184923d83eb5806bb153fca443c1d153?source=copy_link', src: '/images/notion_icon.svg', alt: 'Notion' },
  { href: 'https://solved.ac/profile/gusdnd5297', src: '/images/boj-icon.png', alt: '백준' },
  { href: 'https://github.com/t0mark', src: '/images/github_icon.png', alt: 'GitHub' },
  { href: 'mailto:iwagoho@gmail.com', src: '/images/Gmail_icon.svg', alt: 'Gmail' },
  { href: 'https://www.linkedin.com/in/%ED%98%84%EC%9B%85-%EC%96%91-531931339/', src: '/images/LinkedIn_icon.svg', alt: 'LinkedIn' },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 데스크톱 네비게이션 */}
      <div className="hidden md:flex items-center justify-between w-full">
        <nav className="flex gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="w-6 h-6 flex items-center justify-center hover:opacity-70 hover:scale-110 transition-all duration-200"
            >
              <Image src={link.src} alt={link.alt} width={18} height={18} />
            </a>
          ))}
        </div>
      </div>

      {/* 모바일 햄버거 버튼 */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-1 z-50"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="메뉴 열기/닫기"
        aria-expanded={isOpen}
      >
        <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-200 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-200 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* 모바일 드롭다운 메뉴 */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-card-custom py-4 px-6 flex flex-col gap-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
            ))}
          </nav>
          <div className="flex justify-center gap-4 pt-2 border-t border-border">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center hover:opacity-70 transition-opacity"
              >
                <Image src={link.src} alt={link.alt} width={20} height={20} />
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
