// nomadiccoast/ironedge-fitness-prototype/ironedge-fitness-prototype-7cf0f3d9576af0ac23a91d3bc6ee2cdbefea26c1/src/components/layout/Navbar.tsx
import { Link } from "react-router-dom";
import { Dumbbell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-accent" />
          <span className="font-display font-bold text-xl text-primary">
            ShapeFit Gym and Dance Centre
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <a href="https://wa.me/918181838352" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-whatsapp hover:bg-whatsapp/90 text-white gap-2">
              <MessageCircle className="h-4 w-4" />
              Support
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}