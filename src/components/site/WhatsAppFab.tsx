import { MessageCircle } from "lucide-react";

const WA = "https://wa.me/966559906064";

export function WhatsAppFab({ message }: { message?: string }) {
  const href = message ? `${WA}?text=${encodeURIComponent(message)}` : WA;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      className="fixed bottom-20 lg:bottom-6 end-4 lg:end-6 z-30 grid place-items-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-whatsapp text-white shadow-card hover:scale-105 transition-transform"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
