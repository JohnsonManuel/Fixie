import React, { useState , useEffect} from "react";
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
} from "../components/ui/resizable-navbar";
import { Moon, SunDim } from "lucide-react";
import { DarkModeToggle } from "../components/ui-utils/toggleButton";
import { useNavigate } from "react-router-dom";

const navItems = [
  { name: "Features", link: "#features" },
  { name: "Pricing", link: "#pricing" },
  { name: "Contact", link: "#contact" },
];

type PageName =
  | 'home'
  | 'signup'
  | 'login'
  | 'dashboard'
  | 'servicenow-alternative'
  | 'enterprise-itsm'
  | 'servicenow-migration'
  | 'fortune500-itsm'
  | 'demo';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
   const navigate = useNavigate();

  const handleNavClick = (link: string) => {
    if (link.startsWith('#')) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
    useEffect(() => {
      // on mount, check saved theme or system preference
      if (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    }, []);
  
    function toggleTheme() {
      // console.log('toggle theem')
      const newDark = !isDark;
      setIsDark(newDark);
  
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.theme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.theme = "light";
      }
    }
  return (
    <div className="App w-full flex-col items-center justify-center">
      {/* Navbar */}
      <Navbar className="fixed top-0 left-0 w-full z-50 h-[70px]">
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="ml-2 flex items-center gap-1">
            <NavbarButton onClick={toggleTheme} variant="secondary">
              {isDark ? <Moon /> : <SunDim />}
            </NavbarButton>
            <NavbarButton onClick={() => navigate("/login")} variant="primary">
            Login
          </NavbarButton>
          <NavbarButton onClick={() => navigate("/demo")} variant="primary">
            Book a call
          </NavbarButton>
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
                onClick={(e) => {
                  if (item.link.startsWith('#')) {
                    e.preventDefault();
                    const element = document.querySelector(item.link);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full items-center justify-between py-4">
              <span className="text-neutral-600 dark:text-neutral-300 font-medium">Theme</span>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center p-2 rounded-md bg-gray-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Moon size={20} /> : <SunDim size={20} />}
              </button>
            </div>
            <div className="flex w-full flex-col gap-4">
              <NavbarButton onClick={toggleTheme} variant="secondary">
                {isDark ? <Moon /> : <SunDim />}
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/login")
                }}
                variant="primary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/demo")
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

      {/* Main Content */}
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default Layout;
