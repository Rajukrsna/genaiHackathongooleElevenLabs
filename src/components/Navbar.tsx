import { Link, useLocation } from 'wouter';
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from '@clerk/clerk-react';

export default function Navbar() {
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard', protected: true },
    { href: '/profile', label: 'Profile', protected: true },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <span>NeonLab</span>
            </a>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <SignedIn key={link.href}>
                <Link href={link.href}>
                  <a
                    className={`font-medium text-sm uppercase tracking-wide transition-all duration-200 relative ${
                      location === link.href
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {link.label}
                    {location === link.href && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
                    )}
                  </a>
                </Link>
              </SignedIn>
            ))}

            {/* Show only Home for signed out users */}
            <SignedOut>
              <Link href="/">
                <a
                  className={`font-medium text-sm uppercase tracking-wide transition-all duration-200 relative ${
                    location === '/'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Home
                  {location === '/' && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
                  )}
                </a>
              </Link>
            </SignedOut>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {/* Signed Out - Show Sign In/Up Buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-secondary text-sm px-4 py-2">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary text-sm px-4 py-2">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>

            {/* Signed In - Show User Button */}
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10 ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
