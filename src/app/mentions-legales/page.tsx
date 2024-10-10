'use client';

import FeaturesSection from "@/app/components/cgu/FeaturesSection";

export default function MentionsLegales() {
  return (
    <>
      <FeaturesSection />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-gray-700">
        <h1 className="text-2xl font-bold text-center mb-8">Mentions Légales</h1>

        {/* Company Information */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Informations sur l'entreprise</h2>
          <p>Nom de l'entreprise : Bisou Rivage</p>
          <p>Responsable de la publication : Maxence Laubier</p>
          <p>Siège social : À définir</p>
          <p>Hébergeur : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
          <p><a href="/contact" className="text-blue-600 hover:underline">Page de contact</a></p>
        </section>

        {/* Terms of Sale */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Conditions Générales de Vente (CGV)</h2>
          <h3 className="font-semibold mt-4">Caractéristiques des produits</h3>
          <p>Les tirages sont des photographies en édition limitée, signées par l'artiste. Chaque œuvre est limitée à 15 exemplaires, avec des formats allant de 10x15 cm à 70x100 cm, assurant une qualité d'archivage durable.</p>
          
          <h3 className="font-semibold mt-4">Modalités de commande</h3>
          <p>Les commandes peuvent être passées directement sur notre site. Un email de confirmation est envoyé après validation.</p>
          
          <h3 className="font-semibold mt-4">Moyens de paiement acceptés</h3>
          <ul className="list-disc pl-6">
            <li>Carte bancaire via Stripe</li>
            <li>PayPal</li>
            <li>Virement bancaire</li>
          </ul>

          <h3 className="font-semibold mt-4">Sécurité des paiements</h3>
          <p>Tous les paiements sont sécurisés et chiffrés via SSL. Stripe est certifié PCI DSS, assurant la sécurité de vos informations bancaires.</p>
          <a href="https://stripe.com/fr" className="text-blue-600 hover:underline mt-3">En savoir plus sur Stripe</a>

          <h3 className="font-semibold mt-4">Délais de livraison</h3>
          <ul className="list-disc pl-6">
            <li>France métropolitaine : 5 à 7 jours ouvrables</li>
            <li>Europe : 7 à 14 jours ouvrables (sur demande par contact)</li>
            <li>International : 10 à 21 jours ouvrables (sur demande par contact)</li>
          </ul>

          {/* Conditions de retour */}
          <h3 className="font-semibold mt-4">Conditions de retour et droit de rétractation</h3>
          <p>Vous disposez d'un droit de rétractation de 14 jours. Les frais de retour sont à votre charge. Les produits doivent être retournés dans leur état d'origine. Les articles sur-mesure ou grands formats ne sont pas éligibles au retour.</p>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Politique de Confidentialité</h2>
          <h3 className="font-semibold mt-4">Données collectées</h3>
          <p>Nous collectons les informations nécessaires à la gestion des commandes et à la relation client (nom, e-mail, adresse de livraison, téléphone).</p>

          <h3 className="font-semibold mt-4">Traitement des données et consentement</h3>
          <p>Conformément au RGPD, vous pouvez demander l'accès, la rectification, la suppression ou la limitation des données vous concernant via notre <a href="/contact" className="text-blue-600 hover:underline">page de contact</a>.</p>

          <h3 className="font-semibold mt-4">Conservation des données</h3>
          <p>Les données sont conservées pour une durée maximale de 5 ans, sauf demande de suppression.</p>

          <h3 className="font-semibold mt-4">Cookies</h3>
          <p>Nous utilisons des cookies pour optimiser votre expérience. Vous pouvez gérer vos préférences via le bandeau de consentement ou les paramètres de votre navigateur.</p>
          <p>Aucun de ces cookies ne sont vendu à des tiers.</p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Propriété Intellectuelle</h2>
          <p>Toutes les photographies sont protégées par le droit d'auteur et appartiennent aux artistes. Toute reproduction ou exploitation commerciale est interdite sans autorisation.</p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p>Pour toute question, contactez-nous via :</p>
          <p>E-mail : <a href="mailto:bisourivage@gmail.com" className="text-blue-600 hover:underline">bisourivage@gmail.com</a></p>
          <p>Téléphone : 0623072157</p>
          <p><a href="/contact" className="text-blue-600 hover:underline">Page de contact</a></p>
        </section>

        {/* Miscellaneous */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Dispositions Diverses</h2>
          <h3 className="font-semibold mt-4">Modification des mentions légales</h3>
          <p>Nous nous réservons le droit de modifier ces mentions légales à tout moment. Les utilisateurs seront informés des changements substantiels.</p>

          <h3 className="font-semibold mt-4">Responsabilités</h3>
          <p>Bisou Rivage ne peut être tenu responsable des dommages résultant de l'utilisation du site.</p>
        </section>
      </div>
    </>
  );
}
