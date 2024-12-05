'use client';

import React from 'react';
import Image from 'next/image';
import { Order } from '@/app/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter,
} from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/app/components/ui/table';
import { formatPrice } from '@/app/lib/utils';
import { useCart } from '@/app/hooks/use-cart';
export default function OrderSummary({ order }: { order: Order }) {
  const { clearCart } = useCart();
  React.useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
        Merci pour votre commande !
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
        <p className="text-lg">
          Commande ID : <strong>{order.id}</strong>
        </p>
        <p className="text-lg">
          Votre commande sera livrée avant le{' '}
          <strong>
          {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
          </strong>
          .
        </p>
        </div>
        <Table>
        <TableHeader>
          <TableRow>
          <TableHead>Produit</TableHead>
          <TableHead>Quantité</TableHead>
          <TableHead>Prix</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.products.map((product, index) => (
          <TableRow key={index}>
            <TableCell className="flex items-center space-x-4">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={64}
              height={64}
              className="object-cover rounded"
            />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
              Format : {product.format}
              </p>
              <p className="text-sm text-muted-foreground">
              Artiste : {product.artisteName}
              </p>
            </div>
            </TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>{formatPrice(product.price)}</TableCell>
          </TableRow>
          ))}
        </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-lg font-semibold">Total de la commande :</p>
        <p className="text-lg font-semibold">
        {formatPrice(order.totalAmount)}
        </p>
      </CardFooter>
      </Card>
    </div>
  );
}