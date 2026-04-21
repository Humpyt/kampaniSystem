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

export async function seedColors() {
  try {
    console.log('Seeding colors...');

    // Check if already seeded
    const existingColors = await db.prepare('SELECT COUNT(*) as count FROM colors').get();
    if (existingColors && (existingColors as any).count > 0) {
      console.log('Colors already seeded');
      return;
    }

    const now = new Date().toISOString();

    // Insert default colors
    const colors = [
      { id: 'beige', name: 'Beige', hex_code: '#F5F5DC', display_order: 1 },
      { id: 'black', name: 'Black', hex_code: '#000000', display_order: 2 },
      { id: 'blue', name: 'Blue', hex_code: '#0000FF', display_order: 3 },
      { id: 'brown', name: 'Brown', hex_code: '#8B4513', display_order: 4 },
      { id: 'burgundy', name: 'Burgundy', hex_code: '#800000', display_order: 5 },
      { id: 'gray', name: 'Gray', hex_code: '#808080', display_order: 6 },
      { id: 'green', name: 'Green', hex_code: '#008000', display_order: 7 },
      { id: 'multi', name: 'Multi', hex_code: '#RAINBOW', display_order: 8 },
      { id: 'navy', name: 'Navy', hex_code: '#000080', display_order: 9 },
      { id: 'orange', name: 'Orange', hex_code: '#FFA500', display_order: 10 },
      { id: 'pink', name: 'Pink', hex_code: '#FFC0CB', display_order: 11 },
      { id: 'red', name: 'Red', hex_code: '#FF0000', display_order: 12 },
      { id: 'white', name: 'White', hex_code: '#FFFFFF', display_order: 13 },
      { id: 'yellow', name: 'Yellow', hex_code: '#FFFF00', display_order: 14 },
    ];

    for (const color of colors) {
      await db.prepare(`
        INSERT INTO colors (id, name, hex_code, display_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `).run(color.id, color.name, color.hex_code, color.display_order, now, now);
    }

    console.log('Colors seeded successfully');
  } catch (error) {
    console.error('Error seeding colors:', error);
    throw error;
  }
}
