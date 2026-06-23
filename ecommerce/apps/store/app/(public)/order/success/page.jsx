import Link from 'next/link';
import StoreButton from '@/components/StoreButton';
import { formatPrice } from '@/lib/formatters';

export default async function OrderSuccessPage({ searchParams }) {
  const orderNumber = searchParams?.orderNumber || '';
  const name = searchParams?.name || '';
  const productName = searchParams?.productName || '';
  const total = searchParams?.total || '';
  const estimatedDays = searchParams?.estimatedDays || '';
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250793100072';

  const formattedTotal = total ? formatPrice(parseInt(total)) : '';

  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-20">
      <div className="text-center">
        {/* Animated checkmark */}
        <div className="w-20 h-20 rounded-full bg-forest-light flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"
              strokeDasharray="100" strokeDashoffset="0"
              className="animate-draw-check" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-ink mb-3">Order Placed!</h1>
        <p className="text-ink-secondary font-sans mb-8">
          Murakoze {name}! We have received your order and will be in touch shortly.
        </p>

        {/* Order summary card */}
        <div className="bg-warm rounded-2xl p-6 mb-8 text-left">
          <div className="text-center mb-4">
            <p className="text-xs text-ink-secondary font-sans mb-1">Order number</p>
            <p className="text-lg font-mono font-bold text-ink">{orderNumber}</p>
          </div>
          {productName && (
            <div className="flex justify-between text-sm font-sans py-2 border-b border-border/50">
              <span className="text-ink-secondary">Product</span>
              <span className="text-ink font-medium">{productName}</span>
            </div>
          )}
          {formattedTotal && (
            <div className="flex justify-between text-sm font-sans py-2 border-b border-border/50">
              <span className="text-ink-secondary">Total</span>
              <span className="text-ink font-medium">{formattedTotal} RWF</span>
            </div>
          )}
          {estimatedDays && (
            <div className="flex justify-between text-sm font-sans py-2">
              <span className="text-ink-secondary">Estimated delivery</span>
              <span className="text-ink font-medium">~{estimatedDays} days</span>
            </div>
          )}
        </div>

        {/* Next steps */}
        <div className="text-left mb-8">
          <h2 className="font-serif text-lg text-ink mb-4">What happens next</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-forest-light flex items-center justify-center flex-shrink-0 text-forest text-sm font-sans font-bold">1</div>
              <div>
                <p className="text-sm font-sans font-medium text-ink">Check your WhatsApp</p>
                <p className="text-xs text-ink-secondary font-sans">We just sent you a confirmation message with your order details.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-forest-light flex items-center justify-center flex-shrink-0 text-forest text-sm font-sans font-bold">2</div>
              <div>
                <p className="text-sm font-sans font-medium text-ink">We start crafting</p>
                <p className="text-xs text-ink-secondary font-sans">Our team will begin working on your piece.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-forest-light flex items-center justify-center flex-shrink-0 text-forest text-sm font-sans font-bold">3</div>
              <div>
                <p className="text-sm font-sans font-medium text-ink">We notify you</p>
                <p className="text-xs text-ink-secondary font-sans">You will receive WhatsApp updates at every step.</p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp button */}
        <a
          href={`https://wa.me/${phone}?text=${encodeURIComponent(
            [
              'Muraho neza,',
              '',
              'Murakoze kutwandikira.',
              '',
              'Twakiriye ubusabe bwanyu kandi turi kugenzura amakuru ajyanye na komande yanyu.',
              '',
              orderNumber ? `📦 Nimero ya Komande: ${orderNumber}` : '',
              productName ? `📦 Igicuruzwa: ${productName}` : '',
              '',
              'Niba hari andi makuru mwifuza cyangwa ubufasha mukeneye, turahari kugira ngo tubafashe.',
              '',
              'Murakoze ku kwihangana no ku cyizere mudufitiye.',
              '',
              `*Furaha Furniture Shop* 🏪\nKurikirana: ${(process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001')}/track`,
            ].filter(Boolean).join('\n')
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4"
        >
          <StoreButton variant="secondary" fullWidth>
            Open WhatsApp
          </StoreButton>
        </a>
        <p className="text-xs text-ink-light text-center font-sans mb-8">
          Save our number so you do not miss updates
        </p>

        <Link href={`/track?orderNumber=${orderNumber}`}
          className="block mb-4">
          <StoreButton variant="primary" fullWidth>
            Track Your Order
          </StoreButton>
        </Link>

        <Link href="/products" className="text-forest font-sans font-medium hover:underline text-sm">
          &larr; Browse more products
        </Link>
      </div>
    </div>
  );
}
