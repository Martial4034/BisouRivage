export interface Product {
  productId: string;
  price: number;
  quantity: number;
  imageUrl: string;
  artisteName: string;
  name: string;
  format: string;
}

export interface Order {
  id: string;
  deliveryDate: string;
  products: Product[];
  totalAmount: number;
}
