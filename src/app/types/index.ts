import admin from 'firebase-admin';
import { Timestamp } from 'firebase/firestore';

export interface Product {
  productId: string;
  price: number;
  quantity: number;
  formatId?: string; // Si applicable
  imageUrl: string;
  artisteName: string;
  artisteEmail: string;
  artisteId: string;
  name: string;
  format: string;
  status?: string; // Statut du produit pour l'artiste
  serialNumber?: string;
  serialNumbers?: string[];
}

export interface OrderFirestoreData {
  paymentId: string;
  stripeSessionId: string;
  userId: string;
  userEmail: string;
  createdAt: admin.firestore.Timestamp;
  deliveryDate: admin.firestore.Timestamp;
  totalAmount: number;
  shippingAddress: any; // Type approprié pour l'adresse
  products: Product[];
  artistStatuses: { [key: string]: string }; // Statuts des artistes
}

export interface Order {
  id: string;
  stripeSessionId: string;
  userId: string;
  userEmail: string;
  createdAt: string; // ISO string
  deliveryDate: string; // ISO string
  totalAmount: number;
  shippingAddress: any; // Type approprié pour l'adresse
  products: Product[];
  paymentId: string;
  artistStatuses: { [key: string]: string }; // Statuts des artistes
}

export interface ImageFirestoreData {
  artisteEmail: string;
  artisteId: string;
  artisteName: string;
  createdAt: Timestamp;
  description: string;
  format: string;
  images: { id: number; link: string }[];
  mainImage: string;
  sizes: { size: string; price: number; stock: number; nextSerialNumber: number; identificationNumbers: number[]; initialStock: number }[];
}

export interface ImageData {
  artisteEmail: string;
  artisteId: string;
  artisteName: string;
  createdAt: string; // Formatted date
  description: string;
  format: string;
  images: { id: number; link: string }[];
  mainImage: string;
  sizes: { size: string; price: number; stock: number; nextSerialNumber: number; identificationNumbers: number[]; initialStock: number }[];
}

// Ajoutez ou modifiez le type pour les tailles
interface ProductSize {
  size: string;
  price: number;
  stock: number;
  nextSerialNumber: number;
}

// Ajoutez ou modifiez le type pour les produits dans une commande
interface OrderProduct {
  productId: string;
  price: number;
  quantity: number;
  imageUrl: string;
  artisteEmail: string;
  artisteName: string;
  artisteId: string;
  name: string;
  format: string;
  serialNumber: string;
}