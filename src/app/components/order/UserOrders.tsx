// app/components/orders/UserOrders.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Order } from '@/app/types';
import { formatPrice } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';

function getUserMessageForStatus(status: string): string {
  switch (status) {
    case 'Pas Commencé':
      return "L'artiste traite votre commande";
    case 'En Cours':
      return "L'artiste réalise votre commande";
    case 'Terminé':
      return "L'artiste a envoyé votre commande";
    default:
      return "Statut inconnu";
  }
}

export default function UserOrders({ orders }: { orders: Order[] }) {
  const router = useRouter();

  if (!orders || orders.length === 0) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <Image
          src="/BISOU_RIVAGE_BLEU_FOND_TRANSPARENT.svg"
          alt="Logo Bisou"
          width={200}
          height={200}
          className="mb-6"
        />
        <h2 className="text-2xl font-semibold mb-4">Aucune commande trouvée</h2>
        <p className="text-muted-foreground mb-6">Vous n'avez pas encore passé de commande</p>
        <Button
          onClick={() => router.back()}
          variant="default"
        >
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mes Commandes</h1>
      {orders.map((order) => {
        // Utilisez 'order.products' au lieu de 'product'
        const artistIds = Array.from(new Set(order.products.map((p) => p.artisteId)));
        const multipleArtists = artistIds.length > 1;

        return (
          <div key={order.id} className="mb-8">
            {multipleArtists && (
              <Alert className="mb-4">
                <AlertTitle>Commande Multi-Artistes</AlertTitle>
                <AlertDescription>
                  Votre commande regroupe des œuvres de plusieurs artistes. Vous recevrez probablement votre commande en plusieurs fois selon les articles commandés.
                </AlertDescription>
              </Alert>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date de Commande</TableHead>
                  <TableHead>Date de Livraison Estimée</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Quantité Totale</TableHead>
                  <TableHead>Prix Total</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    {order.products.map((product, index) => (
                      <span key={index}>
                        <Link href={`/sales/${product.productId}`} className="text-blue-500">
                          {product.name}
                        </Link>
                        {index < order.products.length - 1 && ', '}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>{order.products.reduce((sum, p) => sum + p.quantity, 0)}</TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>
                    {/* Afficher les statuts des artistes */}
                    {artistIds.map((artistId, index) => {
                      const artistName = order.products.find(p => p.artisteId === artistId)?.artisteName || 'Artiste';
                      const artistStatus = order.artistStatuses?.[artistId] || 'Pas Commencé';
                      const userMessage = getUserMessageForStatus(artistStatus);

                      return (
                        <div key={index} className="mb-2">
                          <strong>{artistName} :</strong> {userMessage}
                        </div>
                      );
                    })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
