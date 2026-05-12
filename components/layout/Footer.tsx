import Link from 'next/link';
import { Music, Camera, MessageCircle } from 'lucide-react';

/**
 * Lucide doesn't include social brand logos (design choice), so we use
 * representative icons: Music (TikTok), Camera (Instagram), MessageCircle (WhatsApp).
 *
 * Each social button uses liquid-glass circular styling:
 * - Rounded-full container with backdrop blur
 * - Icon + label in a column layout
 * - Primary social (TikTok) gets a subtle gold accent border
 */

interface SocialLink {
  href: string;
  label: string;
  Icon: typeof Music;
  primary: boolean;
}

const SOCIALS: SocialLink[] = [
  {
    href: 'https://www.tiktok.com/@patyka550',
    label: 'TikTok',
    Icon: Music,
    primary: true,
  },
  {
    href: 'https://www.instagram.com/patykatarot',
    label: 'Instagram',
    Icon: Camera,
    primary: false,
  },
  {
    href: 'https://wa.me/573018339558',
    label: 'WhatsApp',
    Icon: MessageCircle,
    primary: false,
  },
];

export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-border-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Social buttons — circular liquid-glass styling */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {SOCIALS.map(({ href, label, Icon, primary }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`liquid-glass flex flex-col items-center justify-center w-24 h-24 rounded-full transition-all duration-300 hover:scale-105 ${
                primary
                  ? 'border-accent-gold/40 hover:border-accent-gold/70'
                  : 'hover:border-text-secondary/30'
              }`}
              aria-label={`Seguir en ${label}`}
            >
              <Icon
                className={`w-6 h-6 ${
                  primary ? 'text-accent-gold' : 'text-text-secondary'
                }`}
              />
              <span className="text-xs mt-1.5 text-text-secondary">{label}</span>
            </a>
          ))}
        </div>

        {/* Copyright + legal */}
        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            &copy; {new Date().getFullYear()} Patyka Tarot. Todos los derechos
            reservados.
          </p>
          <Link
            href="/terms"
            className="text-xs text-text-secondary/50 hover:text-text-secondary transition-colors underline underline-offset-2"
          >
            Política de cancelación
          </Link>
        </div>
      </div>
    </footer>
  );
}
