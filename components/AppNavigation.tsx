"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  MessageSquare, 
  PhoneCall, 
  Menu, 
  X 
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Listings',
      href: '/',
      icon: Users,
    },
    {
      name: 'Virtual Phone',
      href: '/virtual-phone',
      icon: PhoneCall,
    },
    {
      name: 'Contacts',
      href: '/contacts',
      icon: Users,
    },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-6">
        <div className="md:hidden mr-2">
          <button onClick={toggleMenu} className="p-2">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <h1 className="text-2xl font-semibold mr-8">Agent Reach</h1>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 h-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center h-full border-b-2 px-1 ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <item.icon className="mr-2 h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="md:hidden bg-background py-3 px-6 border-t">
          <ul className="space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center p-2 rounded-md ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
} 