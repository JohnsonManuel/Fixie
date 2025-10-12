"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "./ui/resizable-navbar";
import ThemeToggle from "./ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";

import { useState } from "react";

interface NavbarComponentContentProps {
  onNavigate?: (page: 'demo' | 'login') => void;
}

function NavbarComponentContent({ onNavigate }: NavbarComponentContentProps) {
  const navItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "Pricing",
      link: "#pricing",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton onClick={() => onNavigate?.('login')} variant="secondary">Login</NavbarButton>
            <NavbarButton onClick={() => onNavigate?.('demo')} variant="primary">Book a call</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full items-center justify-between py-4">
              <span className="text-neutral-600 dark:text-neutral-300 font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate?.('login');
                }}
                variant="primary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate?.('demo');
                }}
                variant="primary"
                className="w-full"
              >
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}

export function NavbarComponent({ onNavigate }: { onNavigate?: (page: 'demo' | 'login') => void }) {
  return (
    <ThemeProvider>
      <NavbarComponentContent onNavigate={onNavigate} />
    </ThemeProvider>
  );
}