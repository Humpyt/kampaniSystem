import db from './database.ts';

async function moveTravelBagService() {
  console.log('🔄 Moving Travel Bag Wheel Replacements to bags category...\n');

  try {
    // Check current state before update
    const beforeUpdate = await db.get(`
      SELECT name, category FROM services
      WHERE name LIKE '%Travel Bag Wheel%'
    `);

    if (beforeUpdate) {
      console.log(`📦 Before update:`);
      console.log(`   Name: "${beforeUpdate.name}"`);
      console.log(`   Category: ${beforeUpdate.category}\n`);
    } else {
      console.log('⚠️  No service found matching "Travel Bag Wheel"');
      process.exit(1);
    }

    // Update the category for travel bag wheel replacements
    await db.run(`
      UPDATE services
      SET category = 'bag',
          updated_at = CURRENT_TIMESTAMP
      WHERE name LIKE '%Travel Bag Wheel%'
    `);

    console.log(`✅ Service updated successfully\n`);

    // Verify the change
    const afterUpdate = await db.get(`
      SELECT name, category, price FROM services
      WHERE name LIKE '%Travel Bag Wheel%'
    `);

    if (afterUpdate) {
      console.log(`📦 After update:`);
      console.log(`   Name: "${afterUpdate.name}"`);
      console.log(`   Category: ${afterUpdate.category}`);
      console.log(`   Price: ${afterUpdate.price.toLocaleString()} UGX\n`);
    }

    // Show bag category distribution
    const bagServices = await db.all(`
      SELECT name, price FROM services
      WHERE category = 'bag'
      ORDER BY name
    `);

    console.log(`📁 Bag Category (${bagServices.length} services):`);
    bagServices.forEach((service: any) => {
      console.log(`   - ${service.name}: ${service.price.toLocaleString()} UGX`);
    });

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

moveTravelBagService().then(() => process.exit(0));
