import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";

const navLinks = [
{ to: "/", label: "Home" },
{ to: "/investigation", label: "Investigation" },
{ to: "/settings", label: "Settings" },
{ to: "/help", label: "Help" },
{ to: "/contact", label: "Contact" }];


export default function NavBar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ?
      "bg-panel/95 backdrop-blur-md border-b border-border shadow-glow-cyan" :
      "bg-panel/80 backdrop-blur-sm border-b border-border/50"}`
      }>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-7 h-7 text-cyber group-hover:drop-shadow-[0_0_8px_hsl(185_100%_50%/0.8)] transition-all duration-300" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Shield className="w-7 h-7 text-cyber" />
              </div>
            </div>
            <span className="font-mono font-bold text-sm tracking-widest uppercase text-foreground group-hover:text-cyber transition-colors duration-200">INVIDIOUS·FORENSICS
              <span className="text-cyber">·</span>FORENSICS
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 text-sm font-mono tracking-wider rounded-md transition-all duration-200 ${
                  isActive ?
                  "text-cyber bg-cyber/10 border border-cyber/30" :
                  "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                  }>

                  {link.label}
                </Link>);

            })}
          </div>

          {/* Status indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-normal animate-pulse" />
            SYSTEM ONLINE
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}>

            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen &&
      <div className="md:hidden border-t border-border bg-panel/95 backdrop-blur-md">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2 text-sm font-mono tracking-wider rounded-md transition-all duration-200 ${
                isActive ?
                "text-cyber bg-cyber/10 border border-cyber/30" :
                "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                }>

                  {link.label}
                </Link>);

          })}
          </div>
        </div>
      }
    </nav>);

}