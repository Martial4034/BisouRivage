'use client';

import FeaturesSection from "@/app/components/cgu/FeaturesSection"; 


import { Truck, RotateCw, CreditCard, ShieldAlert, Mail } from 'lucide-react';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white py-12">
              <FeaturesSection />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 mt-12">FAQ</h1>

        {/* Delivery Times */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Quels sont les délais de livraison ?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Les délais de livraison en France sont généralement de 5 à 7 jours ouvrables. Dès que votre commande est expédiée,
            vous recevrez un numéro de suivi par e-mail pour rester informé de l’acheminement de votre colis.
          </p>
        </div>

        {/* Return Policy */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <RotateCw className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Puis-je retourner une photographie si je change d'avis ?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Oui, vous disposez d'un droit de rétractation de 14 jours à compter de la réception de votre commande. Les frais de retour
            sont à votre charge, et le remboursement sera effectué dès que nous aurons reçu la photographie en parfait état.
            Assurez-vous que le produit est bien protégé pour le retour afin d’éviter tout dommage.
          </p>
        </div>

        {/* Payment Options */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Comment puis-je payer ma commande ?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Nous acceptons plusieurs modes de paiement : carte bancaire, PayPal, et virement bancaire. Tous les paiements sont traités
            via une plateforme sécurisée pour garantir la protection de vos informations bancaires.
          </p>
        </div>

        {/* Data Security */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Mes données personnelles sont-elles sécurisées ?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Absolument. Chez Bisou Rivage, la sécurité de vos données est notre priorité. Vos informations personnelles sont stockées en
            toute sécurité et ne sont accessibles qu'aux personnes autorisées. Nous utilisons votre e-mail et votre numéro de téléphone
            uniquement pour vous tenir informé de votre commande et pour améliorer notre service client. Les données bancaires ne sont
            jamais stockées chez nous, elles sont traitées via une plateforme de paiement sécurisée et conforme aux normes de sécurité PCI-DSS.
          </p>
        </div>

        {/* Contact */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Qui puis-je contacter en cas de problème avec ma commande ?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            En cas de question ou de problème concernant votre commande, notre équipe est disponible pour vous aider. Vous pouvez nous
            joindre par téléphone au <strong>06 23 07 21 57</strong> (du lundi au vendredi, de 9h à 19h) ou par e-mail à{' '}
            <a href="mailto:bisourivage@gmail.com" className="text-blue-600 underline">
              bisourivage@gmail.com
            </a>. Nous nous engageons à répondre à toutes vos demandes dans les plus brefs délais.
          </p>
        </div>
      </div>
    </div>
  );
}
