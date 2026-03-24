import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId: string;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const categoryService = {
  getAllCategories: async () => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  },

  getCategory: async (id: string) => {
    const response = await axios.get(`${API_URL}/categories/${id}`);
    return response.data;
  },

  createCategory: async (category: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => {
    const response = await axios.post(`${API_URL}/categories`, category);
    return response.data;
  },

  updateCategory: async (id: string, category: Partial<Category>) => {
    const response = await axios.put(`${API_URL}/categories/${id}`, category);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    await axios.delete(`${API_URL}/categories/${id}`);
  }
};

export const productService = {
  getProductsByCategory: async (categoryId: string) => {
    const response = await axios.get(`${API_URL}/products/category/${categoryId}`);
    return response.data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await axios.post(`${API_URL}/products`, product);
    return response.data;
  },

  updateProduct: async (id: string, product: Partial<Product>) => {
    const response = await axios.put(`${API_URL}/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    await axios.delete(`${API_URL}/products/${id}`);
  }
};