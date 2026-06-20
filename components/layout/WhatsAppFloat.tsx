import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/573018339558"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                 bg-green-500 hover:bg-green-400
                 flex items-center justify-center
                 shadow-[0_0_20px_rgba(34,197,94,0.4)]
                 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]
                 transition-all duration-300 hover:scale-110
                 animate-bounce-soft"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}
