// src/app/components/Footer.tsx

'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white py-6 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between text-center sm:text-left space-y-4 sm:space-y-0">
        {/* FAQ */}
        <div className="flex justify-center sm:justify-start">
          <Link href="/faq" className="text-gray-700 hover:underline">
            FAQ
          </Link>
        </div>

        {/* Mentions Légales */}
        <div className="flex justify-center sm:justify-start">
          <Link href="/mentions-legales" className="text-gray-700 hover:underline">
            Mentions Légales
          </Link>
        </div>

        {/* Conditions Générales d'Utilisation */}
        <div className="flex justify-center sm:justify-start">
          <Link href="/cgu" className="text-gray-700 hover:underline">
            CGU
          </Link>
        </div>

        {/* Contact */}
        <div className="flex justify-center sm:justify-start">
          <Link href="/contact" className="text-gray-700 hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
