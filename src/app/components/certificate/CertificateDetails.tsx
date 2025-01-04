"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

interface CertificateDetailsProps {
  product: {
    productId: string;
    serialNumber: string;
    size: string;
    artisteName: string;
    firstImageUrl: string;
    description: string;
    price: number;
    identificationNumber: string;
    createdAt: string;
  };
}

export default function CertificateDetails({
  product,
}: CertificateDetailsProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg"
            alt="Logo BisouRivage"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificat d&apos;Authenticité
          </h1>
          <p className="text-gray-600">
            Numéro de certificat: {product.identificationNumber}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src={product.firstImageUrl}
                  alt={`Œuvre de ${product.artisteName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Informations de l&apos;œuvre
                  </h2>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="font-medium">Référence:</span>{" "}
                      {product.productId}
                    </p>
                    <p>
                      <span className="font-medium">Artiste:</span>{" "}
                      {product.artisteName}
                    </p>
                    <p>
                      <span className="font-medium">Format:</span> {product.size}
                    </p>
                    <p>
                      <span className="font-medium">Numéro de série:</span>{" "}
                      {product.serialNumber}
                    </p>
                    <p>
                      <span className="font-medium">Date de publication:</span>{" "}
                      {product.createdAt}
                    </p>
                  </div>
                </div>
                
                <div className="pt-8">
                  <Button
                    onClick={() => router.push(`/sales/${product.productId}`)}
                    className="w-full bg-black hover:bg-gray-800 text-white transition-colors duration-200 py-6 text-lg"
                  >
                    Voir la photographie
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-t border-green-200 p-6">
            <p className="text-green-800 font-medium text-md text-center">
              Ce certificat garantit l&apos;authenticité de l&apos;œuvre.
              Chaque exemplaire est unique et numéroté.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
