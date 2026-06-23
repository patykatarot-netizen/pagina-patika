import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-border-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* WhatsApp — Canal Principal */}
        <div className="mb-8">
          <h3 className="font-heading text-lg md:text-3xl font-bold text-text-primary mb-3">
            ¿Tenés dudas? Escribinos
          </h3>
          <a
            href="https://wa.me/573018339558"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-lg
                       bg-green-500/10 border border-green-500/20
                       hover:bg-green-500/20 spring-smooth"
          >
            <MessageCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-bold text-base md:text-2xl">+57 301 833 9558</span>
          </a>
        </div>

        {/* Copyright + legal */}
        <div className="text-center space-y-2">
          <p className="text-sm md:text-xl text-text-secondary">
            &copy; {new Date().getFullYear()} Patyka Tarot. Todos los derechos
            reservados.
          </p>
          <Link
            href="/terms"
            className="text-xs md:text-lg text-text-secondary/50 hover:text-text-secondary transition-colors underline underline-offset-2"
          >
            Política de cancelación
          </Link>
        </div>
      </div>
    </footer>
  );
}
