// app/components/orders/ArtistOrders.tsx

'use client';

import React, { useState } from 'react';
import { Order, Product } from '@/app/types';
import { useRouter } from 'next/navigation';
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

export default function ArtistOrders({ orders, artistId }: { orders: Order[]; artistId: string }) {
  const router = useRouter();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fonction pour gérer le changement de statut
  const handleStatusChange = async (orderId: string, productId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch('/api/secured/updateProductStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, productId, newStatus }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Commandes à Traiter</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date de Commande</TableHead>
            <TableHead>Date de Livraison Estimée</TableHead>
            <TableHead>Produits</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <TableCell>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</TableCell>
              <TableCell>{new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</TableCell>
              <TableCell>
                {order.products.map((product, index) => (
                  <div key={index}>
                    {product.name} ({product.format})
                  </div>
                ))}
              </TableCell>
              <TableCell>{order.userEmail}</TableCell>
              <TableCell>
                {order.products.map((product, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Select
                      value={product.status || 'Pas Commencé'}
                      onValueChange={(value) => handleStatusChange(order.id, product.productId, value)}
                      disabled={updatingOrderId === order.id}
                    >
                      <SelectTrigger
                        className="w-[180px]"
                        onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
                      >
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pas Commencé">Pas Commencé</SelectItem>
                        <SelectItem value="En Cours">En Cours</SelectItem>
                        <SelectItem value="Terminé">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
