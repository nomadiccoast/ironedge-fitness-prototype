import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919999999999"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 group"
    >
      <div className="relative">
        <div className="bg-whatsapp text-white p-3.5 rounded-full shadow-lg hover:scale-110 transition-transform">
          <MessageCircle className="h-6 w-6" />
        </div>
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-card text-foreground text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Have questions? Chat now
        </span>
      </div>
    </a>
  );
}
