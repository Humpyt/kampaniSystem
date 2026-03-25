import db from './database';
import { v4 as uuidv4 } from 'uuid';

export async function seedProductsAndCategories() {
  try {
    console.log('Seeding products and categories...');

    // Check if already seeded
    const existingCategories = await db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (existingCategories && (existingCategories as any).count > 0) {
      console.log('Products and categories already seeded');
      return;
    }

    const now = new Date().toISOString();

    // Insert categories
    const categories = [
      { id: uuidv4(), name: 'Shoe Care', description: 'Shoe polish, cleaners, and care products', created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Repair Services', description: 'Professional shoe repair services', created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Accessories', description: 'Shoe laces, insoles, and accessories', created_at: now, updated_at: now },
    ];

    for (const category of categories) {
      await db.prepare(`
        INSERT INTO categories (id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(category.id, category.name, category.description, category.created_at, category.updated_at);
    }

    // Insert products
    const products = [
      {
        id: uuidv4(),
        name: 'Premium Shoe Polish Kit',
        price: 95000,
        description: 'Complete shoe care kit with polish, brushes, and cloths',
        imageUrl: '',
        categoryId: categories[0].id,
        inStock: 1,
        featured: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        name: 'Heel Replacement',
        price: 140000,
        description: 'Professional heel replacement service',
        imageUrl: '',
        categoryId: categories[1].id,
        inStock: 1,
        featured: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        name: 'Premium Shoe Laces',
        price: 35000,
        description: 'High-quality wax cotton shoe laces',
        imageUrl: '',
        categoryId: categories[2].id,
        inStock: 1,
        featured: 0,
        created_at: now,
        updated_at: now
      },
    ];

    for (const product of products) {
      await db.prepare(`
        INSERT INTO products (id, name, price, description, image_url, category_id, in_stock, featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        product.id, product.name, product.price, product.description, product.imageUrl,
        product.categoryId, product.inStock, product.featured, product.created_at, product.updated_at
      );
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}
