'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CertificateProduct {
  productId: string;
  imageUrl: string;
  artisteName: string;
  format: string;
  name: string;
  serialNumber: string;
  price: number;
  purchaseDate: string;
  deliveryDate: string;
}

interface CertificateDetailsProps {
  product: CertificateProduct;
}

export default function CertificateDetails({ product }: CertificateDetailsProps) {
  const router = useRouter();
  
  const purchaseDate = new Date(product.purchaseDate);
  const formattedPurchaseDate = format(purchaseDate, 'dd MMMM yyyy', { locale: fr });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Section Image */}
        <div className="flex-1">
          <div className="relative w-full h-[600px] lg:h-[800px]">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              style={{ objectFit: 'cover' }}
              className="shadow-xl"
            />
          </div>
        </div>

        {/* Section Détails */}
        <div className="flex-1 flex flex-col border-2 border-gray-300 p-8 rounded-none shadow-lg min-h-[800px]">
          <div className="bg-green-50 border border-green-200 p-6 mb-8 rounded">
            <p className="text-green-800 font-medium text-lg text-center">
              Ce certificat valide l'authenticité de cette photographie.
            </p>
          </div>

          <h2 className="text-3xl font-semibold text-gray-800 mb-8">
            {product.name}
          </h2>

          <div className="flex-grow space-y-8">
            <div className="space-y-4">
              <p className="text-lg text-gray-600">
                Artiste : <span className="font-semibold">{product.artisteName}</span>
              </p>
              <p className="text-lg text-gray-600">
                Format : <span className="font-semibold">{product.format}</span>
              </p>
              <p className="text-lg text-gray-600">
                Numéro de série : <span className="font-semibold">{product.serialNumber}</span>
              </p>
            </div>

            <div className="border-t pt-8 space-y-4">
              <p className="text-lg text-gray-600">
                Date d'acquisition : <span className="font-semibold">{formattedPurchaseDate}</span>
              </p>
              <p className="text-lg text-gray-600">
                Prix d'acquisition : <span className="font-semibold">{product.price} €</span>
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
  );
} 