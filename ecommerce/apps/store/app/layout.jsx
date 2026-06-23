import './globals.css';
import { StoreAuthProvider } from '@/lib/storeAuth';

export const metadata = {
  title: 'Furaha Furniture Shop — Handcrafted in Rwanda',
  description: 'Browse our collection of handcrafted beds, sofas, cupboards, and furniture. Made to order. Built for your home.',
  openGraph: {
    title: 'Furaha Furniture Shop',
    description: 'Handcrafted furniture built to last a lifetime.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <StoreAuthProvider>
          {children}
        </StoreAuthProvider>
      </body>
    </html>
  );
}
