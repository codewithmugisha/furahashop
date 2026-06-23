import Header from '@/components/Header';

export default function ProfileLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        {children}
      </main>
    </>
  );
}
