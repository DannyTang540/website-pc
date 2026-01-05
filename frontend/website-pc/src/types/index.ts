export interface Product{
    shortDescription: string;
    specifications:(specfications: Record<string, string>)=> void;
    slug: string;
    originalPrice: number;
    categoryId: string;
    brand: string;
    images: never[];
    status: string;
    featured(featured: any): boolean;
    tags: never[];
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
    inStock: boolean;
    specs: string[];
    createdAt: string;
}

export interface CartItem{
    product: Product;
    quantity: number;
}

export interface Order{
    customerName: string;
    customerEmail:string;
    customerPhone: string;
    customerAddress: string;
    items: CartItem[];
    totalAmount: number;
}