import MobileMenu from './MobileMenu'

export default function Navbar() {
  return (
    <header className="bg-white border-b border-border h-nav sticky top-0 z-[1000] shadow-sm flex items-center">
      <nav
        className="max-w-container mx-auto px-8 flex items-center relative w-full"
        role="navigation"
        aria-label="메인 네비게이션"
      >
        <MobileMenu />
      </nav>
    </header>
  )
}
