export type Product = {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  stock: number;
};

export type ProductFormData = {
  name: string;
  sku: string;
  description: string;
  price: string;
  stock: string;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
};

export type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Order = {
  id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type OrderFormData = {
  customerId: string;
  productId: string;
  quantity: string;
};
