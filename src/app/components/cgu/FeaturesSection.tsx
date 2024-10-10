'use client';

import { Headphones, RotateCcw, Truck, Shield } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="bg-white py-12 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Nos Engagements</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {/* Service */}
          <div className="flex flex-col items-center">
            <Headphones className="w-12 h-12 text-gray-800 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">À votre service</h3>
            <p className="text-gray-600 mt-2">Disponible au +33 6 23 07 21 57, du lundi au vendredi de 9h à 19h GMT+1, ou par email.</p>
            <a href="/contact" className="text-blue-600 hover:underline mt-3">Nous contacter</a>
          </div>

          {/* Retour et échange */}
          <div className="flex flex-col items-center">
            <RotateCcw className="w-12 h-12 text-gray-800 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Retour et échange</h3>
            <p className="text-gray-600 mt-2">Échanges & retours sous 14 jours après réception.</p>
            <a href="/mentions-legales#conditions-retour" className="text-blue-600 hover:underline mt-3">Les garanties</a>
          </div>

          {/* Livraison en galerie */}
          <div className="flex flex-col items-center">
            <Truck className="w-12 h-12 text-gray-800 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Livraison en galerie offerte</h3>
            <p className="text-gray-600 mt-2">Livraison en galerie dans un emballage sécurisé offerte.</p>
            <a href="/livraison#livraison" className="text-blue-600 hover:underline mt-3">La livraison</a>
          </div>

          {/* Paiement sécurisé */}
          <div className="flex flex-col items-center">
            <Shield className="w-12 h-12 text-gray-800 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Paiement sécurisé</h3>
            <p className="text-gray-600 mt-2">Paiement sécurisé avec cryptage avancé de vos données bancaires géré par Stripe</p>
            <a href="https://stripe.com/fr" className="text-blue-600 hover:underline mt-3">En savoir plus sur Stripe</a>
          </div>
        </div>
      </div>
    </section>
  );
}
