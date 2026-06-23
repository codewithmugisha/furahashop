import Link from 'next/link';
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-white relative overflow-hidden">
      {/* Top gradient accent */}
      <div className="gradient-line" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-serif text-2xl text-white mb-3">Furaha</h3>
            <p className="text-white/60 text-sm font-sans leading-relaxed max-w-xs">
              Handcrafted furniture built to last a lifetime. Made with love in Kiramuruzi, Rwanda.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm">🇷🇼</span>
              <span className="text-white/40 text-xs font-sans">Made in Rwanda</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-sans font-semibold text-white/90 text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/products', label: 'Browse All' },
                { href: '/tier/low-price', label: 'Budget Friendly' },
                { href: '/tier/medium-price', label: 'Mid Range' },
                { href: '/tier/master', label: 'Master Collection' },
                { href: '/track', label: 'Track Order' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-white text-sm font-sans transition-colors duration-300 link-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans font-semibold text-white/90 text-sm uppercase tracking-wider mb-4">Contact</h4>
            <div className="space-y-3">
              <a href="tel:+250793100072" className="flex items-center gap-2.5 text-white/50 hover:text-white text-sm font-sans transition-colors duration-300 group">
                <Phone size={14} className="text-white/30 group-hover:text-amber transition-colors" />
                <span>+250 793 100 072</span>
                <span className="text-white/25 text-xs">(Furaha)</span>
              </a>
              <a href="tel:+250783453911" className="flex items-center gap-2.5 text-white/50 hover:text-white text-sm font-sans transition-colors duration-300 group">
                <Phone size={14} className="text-white/30 group-hover:text-amber transition-colors" />
                <span>+250 783 453 911</span>
                <span className="text-white/25 text-xs">(Mwarimu)</span>
              </a>
              <a href="mailto:mugishaivanbright250@gmail.com" className="flex items-center gap-2.5 text-white/50 hover:text-white text-sm font-sans transition-colors duration-300 group">
                <Mail size={14} className="text-white/30 group-hover:text-amber transition-colors" />
                <span className="truncate">mugishaivanbright250@gmail.com</span>
              </a>
              <div className="flex items-start gap-2.5 text-white/50 text-sm font-sans pt-1">
                <MapPin size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
                <span>Kiramuruzi, Gatsibo — Near Kiramuruzi Market, opposite Bus Park</span>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div>
            <h4 className="font-sans font-semibold text-white/90 text-sm uppercase tracking-wider mb-4">Get in Touch</h4>
            <p className="text-white/50 text-sm font-sans mb-4">
              Have a question? We respond fast on WhatsApp.
            </p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250793100072'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-sans font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-[#1da851] transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <MessageCircle size={16} />
              Chat with Us
            </a>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs font-sans">
            &copy; {new Date().getFullYear()} Furaha Furniture Shop. All rights reserved.
          </p>
          <p className="text-white/20 text-xs font-sans flex items-center gap-1">
            Made with <span className="text-red-400">♥</span> in Rwanda
          </p>
        </div>
      </div>
    </footer>
  );
}
