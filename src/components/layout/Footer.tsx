import { Link } from "react-router-dom";
import { Dumbbell, Instagram, Facebook, Youtube, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-accent" />
              <span className="font-display font-bold text-lg">Shapefit Fitness</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Prayagraj's Smartest Gym — AI-powered fitness for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2">
              {[
                { to: "/", label: "Home" },
                { to: "/plans", label: "Plans" },
                { to: "/contact", label: "Contact" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="block text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 99999 99999</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@Shapefit.in</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Civil Lines, Prayagraj, UP</div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-3">Follow Us</h4>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent transition-colors"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-sm text-primary-foreground/50">
          Website built by{" "}
          <a href="https://growisa.in" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            growisa
          </a>{" "}
          — AI-Powered Web Agency
        </div>
      </div>
    </footer>
  );
}
