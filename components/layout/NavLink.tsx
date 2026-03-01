'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-all duration-200 pb-0.5 border-b-2 ${
        isActive
          ? 'text-primary border-primary'
          : 'text-text-light border-transparent hover:text-primary hover:border-primary'
      }`}
    >
      {children}
    </Link>
  )
}
