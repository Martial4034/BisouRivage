// app/components/orders/OrderDetails.tsx

'use client';

import React, { useState } from 'react';
import { Order, Product } from '@/app/types';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/app/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';

export default function OrderDetails({ order }: { order: Order }) {
  const router = useRouter();
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  // Fonction pour gérer le changement de statut
  const handleStatusChange = async (productId: string, newStatus: string) => {
    setUpdatingProductId(productId);
    try {
      const response = await fetch('/api/secured/updateProductStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, productId, newStatus }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setUpdatingProductId(null);
    }
  };

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

  // Générer le lien vers les détails Stripe
  const stripeDashboardUrl = `https://dashboard.stripe.com/payments/${order.stripeSessionId}`;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Détails de la Commande</h1>
      <div className="mb-4">
        <p><strong>Date de Commande :</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
        <p><strong>Date de Livraison Estimée :</strong> {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</p>
        <p><strong>Adresse de Livraison :</strong> {order.shippingAddress.line1}, {order.shippingAddress.line2}, {order.shippingAddress.city}, {order.shippingAddress.postal_code}</p>
        <p><strong>Prix Total :</strong> {formatPrice(order.totalAmount)}</p>
        <p>
          <strong>Détails Stripe :</strong> 
          <a href={stripeDashboardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-2">
            Voir sur Stripe
          </a>
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produit</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.products.map((product, index) => (
            <TableRow key={index}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.format}</TableCell>
              <TableCell>{product.quantity}</TableCell>
              <TableCell>{formatPrice(product.price)}</TableCell>
              <TableCell>
                <Select
                  value={product.status || 'Pas Commencé'}
                  onValueChange={(value) => handleStatusChange(product.productId, value)}
                  disabled={updatingProductId === product.productId}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pas Commencé">Pas Commencé</SelectItem>
                    <SelectItem value="En Cours">En Cours</SelectItem>
                    <SelectItem value="Terminé">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Afficher les messages des statuts */}
      <div className="mt-4">
        {order.artistStatuses && Object.keys(order.artistStatuses).map((artistId, index) => {
          const artistName = order.products.find(p => p.artisteId === artistId)?.artisteName || 'Artiste';
          const artistStatus = order.artistStatuses[artistId] || 'Pas Commencé';
          const userMessage = getUserMessageForStatus(artistStatus);

          return (
            <Alert key={index} className="mb-2">
              <AlertTitle>Statut pour {artistName}</AlertTitle>
              <AlertDescription>
                {userMessage}
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </div>
  );
}
