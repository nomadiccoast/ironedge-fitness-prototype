import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Dumbbell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-accent" />
          <span className="font-display font-bold text-xl text-primary">IronEdge Fitness</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                location.pathname === l.to
                  ? "text-accent border-b-2 border-accent pb-0.5"
                  : "text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-whatsapp hover:bg-whatsapp/90 text-white gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </Button>
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 pb-4 space-y-3">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-2 text-sm font-medium ${
                location.pathname === l.to ? "text-accent" : "text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" className="w-full">Dashboard</Button>
          </Link>
          <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="w-full bg-whatsapp hover:bg-whatsapp/90 text-white gap-2 mt-2">
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </Button>
          </a>
        </div>
      )}
    </nav>
  );
}
