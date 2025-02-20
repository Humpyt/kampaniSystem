import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getProductsByCategory: (categoryId: string) => Product[];
  getCategoryById: (id: string) => Category | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Sample data
const initialCategories: Category[] = [
  {
    id: '1',
    name: 'Shoe Repair',
    description: 'Professional shoe repair services',
    imageUrl: 'https://example.com/shoe-repair.jpg',
    productCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Cleaning Services',
    description: 'Expert shoe cleaning and maintenance',
    imageUrl: 'https://example.com/cleaning.jpg',
    productCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Heel Replacement',
    price: 29.99,
    description: 'Complete heel replacement service',
    imageUrl: 'https://example.com/heel.jpg',
    categoryId: '1',
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Sole Repair',
    price: 39.99,
    description: 'Full sole repair and replacement',
    imageUrl: 'https://example.com/sole.jpg',
    categoryId: '1',
    inStock: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts(prev => [...prev, newProduct]);
    
    // Update category product count
    setCategories(prev =>
      prev.map(cat =>
        cat.id === product.categoryId
          ? { ...cat, productCount: cat.productCount + 1, updatedAt: new Date() }
          : cat
      )
    );
    
    toast.success('Product added successfully');
  };

  const updateProduct = (id: string, productUpdate: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, ...productUpdate, updatedAt: new Date() }
          : product
      )
    );
    toast.success('Product updated successfully');
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProducts(prev => prev.filter(p => p.id !== id));
      
      // Update category product count
      setCategories(prev =>
        prev.map(cat =>
          cat.id === product.categoryId
            ? { ...cat, productCount: cat.productCount - 1, updatedAt: new Date() }
            : cat
        )
      );
      
      toast.success('Product deleted successfully');
    }
  };

  const addCategory = (category: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      productCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCategories(prev => [...prev, newCategory]);
    toast.success('Category added successfully');
  };

  const updateCategory = (id: string, categoryUpdate: Partial<Category>) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === id
          ? { ...category, ...categoryUpdate, updatedAt: new Date() }
          : category
      )
    );
    toast.success('Category updated successfully');
  };

  const deleteCategory = (id: string) => {
    // Check if category has products
    const hasProducts = products.some(product => product.categoryId === id);
    if (hasProducts) {
      toast.error('Cannot delete category with existing products');
      return;
    }
    
    setCategories(prev => prev.filter(category => category.id !== id));
    toast.success('Category deleted successfully');
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => product.categoryId === categoryId);
  };

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        getProductsByCategory,
        getCategoryById,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
