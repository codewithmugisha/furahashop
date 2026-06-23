import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
