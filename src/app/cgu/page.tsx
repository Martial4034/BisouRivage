// src/app/cgu/page.tsx

'use client';

import React from 'react';

export default function CGU() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Mentions Légales & Conditions Générales d'Utilisation</h1>

        {/* Company Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Informations sur l'entreprise</h2>
          <p><strong>Nom de l'entreprise :</strong> Bisou Rivage</p>
          <p><strong>Responsable de la publication :</strong> Maxence Laubier</p>
          <p><strong>Siège social :</strong> À définir</p>
          <p><strong>Hébergeur du site :</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
          <p className="mt-2">Pour toute question, contactez-nous par e-mail à <a href="mailto:bisourivage@gmail.com" className="text-blue-600 underline">bisourivage@gmail.com</a> ou par téléphone au <strong>0623072157</strong>.</p>
        </section>

        {/* General Sales Conditions */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Conditions Générales de Vente (CGV)</h2>
          <p><strong>Caractéristiques des produits :</strong> Tirages photographiques en édition limitée, signés par l'artiste. Chaque œuvre est limitée à 15 exemplaires, avec 3 formats A4, A3 ou A2, assurant une qualité d'archivage durable.</p>
          <p><strong>Modalités de commande :</strong> Les commandes sont effectuées via notre site. Une confirmation par e-mail sera envoyée une fois la commande validée.</p>
          <p><strong>Moyens de paiement acceptés :</strong> Carte bancaire (Stripe), PayPal, virement bancaire. Tous les paiements sont sécurisés par la technologie SSL via Stripe.</p>
          <p><strong>Délais de livraison :</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>France métropolitaine : 5 à 7 jours ouvrables avec suivi.</li>
            <li>Europe : 7 à 14 jours ouvrables.</li>
            <li>International : 10 à 21 jours ouvrables selon la destination.</li>
          </ul>
        </section>

        {/* Return Policy */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Conditions de retour et droit de rétractation</h2>
          <p>Conformément à la loi, vous disposez de 14 jours pour exercer votre droit de rétractation. Pour ce faire :</p>
          <ol className="list-decimal list-inside ml-4">
            <li>Accédez à la page <a href="/contact" className="text-blue-600 underline">/contact</a> et envoyez un e-mail à <a href="mailto:bisourivage@gmail.com" className="text-blue-600 underline">bisourivage@gmail.com</a>.</li>
            <li>Précisez l'ID du produit, le nom de l'artiste, la date de la commande, et vos informations de contact.</li>
          </ol>
          <p className="mt-2">Les retours sont à la charge du client (sauf formats standards). Les remboursements seront traités dans les 14 jours suivant la réception du produit en parfait état.</p>
        </section>

        {/* Warranty */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Garanties</h2>
          <p>Chaque tirage est accompagné d'une certification d'authenticité, signée par l'artiste. En cas de problème de qualité, la garantie légale de conformité s’applique pendant 2 ans.</p>
        </section>

        {/* Privacy Policy */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Politique de Confidentialité</h2>
          <p><strong>Données collectées :</strong> Nom, prénom, adresse e-mail, adresse de livraison et de facturation, numéro de téléphone. Ces informations sont utilisées pour gérer les commandes et la relation client.</p>
          <p><strong>Traitement des données et consentement :</strong> Conformément au RGPD, vous avez le droit de demander l'accès, la rectification, la suppression ou la limitation de vos données. Contactez-nous via la page <a href="/contact" className="text-blue-600 underline">/contact</a>.</p>
          <p><strong>Conservation des données :</strong> Vos données seront conservées pendant 5 ans après votre dernière interaction, sauf demande de suppression.</p>
        </section>

        {/* Intellectual Property */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Propriété Intellectuelle</h2>
          <p>Toutes les photographies sur notre plateforme sont protégées par les lois sur le droit d'auteur. Toute reproduction, modification, distribution ou exploitation commerciale des œuvres est interdite sans autorisation écrite. Pour des demandes, contactez-nous via la page <a href="/contact" className="text-blue-600 underline">/contact</a>.</p>
        </section>

        {/* Terms of Use */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Conditions Générales d'Utilisation (CGU)</h2>
          <p><strong>Description des services :</strong> Bisou Rivage est une plateforme de vente de tirages photographiques en édition limitée, accessible à toute personne souhaitant explorer et acheter des œuvres en ligne.</p>
          <p><strong>Accès et utilisation :</strong> L'inscription nécessite une adresse e-mail. Aucun mot de passe n'est requis, la connexion se fait via un code envoyé par e-mail.</p>
          <p><strong>Responsabilités de l'utilisateur :</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>Fournir des informations exactes lors de la commande.</li>
            <li>Maintenir la confidentialité de leurs identifiants.</li>
            <li>Ne pas reproduire ou partager les contenus du site sans autorisation.</li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Limitation de Responsabilité</h2>
          <p>Bisou Rivage n'est pas responsable des dommages directs ou indirects résultant de l'utilisation du site. Le site peut contenir des liens vers des sites externes, sur lesquels nous n'avons aucun contrôle.</p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <p>Pour toute question, problème ou demande d'information :</p>
          <ul className="list-disc list-inside ml-4">
            <li><strong>Email :</strong> <a href="mailto:bisourivage@gmail.com" className="text-blue-600 underline">bisourivage@gmail.com</a></li>
            <li><strong>Téléphone :</strong> 0623072157</li>
            <li><strong>Page de contact :</strong> <a href="/contact" className="text-blue-600 underline">/contact</a></li>
          </ul>
        </section>

        <p className="text-sm text-center text-gray-500 mt-8">Ces mentions légales, CGV et CGU sont fournies pour garantir la transparence et la conformité aux lois en vigueur en France.</p>
      </div>
    </div>
  );
}
