import db from './database.js';

/**
 * Cleanup script to remove duplicate and malformed services
 */
async function cleanupServices() {
  console.log('🧹 Starting service cleanup...\n');

  try {
    // Step 1: Remove services with 0 price
    console.log('📊 Step 1: Removing services with 0 price...');
    await db.run('DELETE FROM services WHERE price = 0');
    const zeroPriceCount = await db.get('SELECT changes() as count FROM services WHERE price = 0');
    console.log(`✅ Removed services with 0 price\n`);

    // Step 2: Remove services with malformed names (contain quotes, commas, or price data)
    console.log('📊 Step 2: Removing services with malformed names...');
    await db.run(`DELETE FROM services WHERE name LIKE '%"%' OR name LIKE '%,%' OR name LIKE '%",%' OR name LIKE '%\\"%'`);
    console.log(`✅ Removed services with malformed names\n`);

    // Step 3: Remove duplicate services (keep one instance of each name)
    console.log('📊 Step 3: Removing duplicate services...');

    // Find duplicates
    const duplicates = await db.all(`
      SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids, MAX(price) as max_price
      FROM services
      GROUP BY name
      HAVING count > 1
    `);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate services found\n');
    } else {
      console.log(`Found ${duplicates.length} duplicate service names:\n`);

      let duplicatesRemoved = 0;
      for (const dup of duplicates) {
        const ids = dup.ids.split(',');
        if (ids.length > 1) {
          // Keep the first ID (most recent import), delete the rest
          const idsToDelete = ids.slice(1);
          const placeholders = idsToDelete.map(() => '?').join(',');

          await db.run(`DELETE FROM services WHERE id IN (${placeholders})`, idsToDelete);
          duplicatesRemoved += idsToDelete.length;

          console.log(`  - "${dup.name}": ${ids.length} instances → kept 1, removed ${idsToDelete.length}`);
        }
      }
      console.log(`\n✅ Removed ${duplicatesRemoved} duplicate services\n`);
    }

    // Step 4: Show final statistics
    console.log('=' .repeat(50));
    console.log('📊 CLEANUP SUMMARY');
    console.log('=' .repeat(50));

    const totalCount = await db.get('SELECT COUNT(*) as count FROM services');
    console.log(`\n📦 Total services remaining: ${totalCount.count}`);

    const zeroPriceCheck = await db.get('SELECT COUNT(*) as count FROM services WHERE price = 0');
    console.log(`❌ Services with 0 price: ${zeroPriceCheck.count}`);

    const malformedCount = await db.get(`SELECT COUNT(*) as count FROM services WHERE name LIKE '%"%' OR NAME LIKE '%,%'`);
    console.log(`⚠️  Services with malformed names: ${malformedCount.count}`);

    const dupCheck = await db.get(`
      SELECT COUNT(*) as count FROM (
        SELECT name, COUNT(*) as count
        FROM services
        GROUP BY name
        HAVING count > 1
      )
    `);
    console.log(`🔄 Duplicate services: ${dupCheck.count}`);

    // Category distribution
    const categories = await db.all('SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY count DESC');
    console.log('\n📁 Services by Category:');
    categories.forEach((cat: any) => {
      console.log(`   ${cat.category}: ${cat.count}`);
    });

    // Show sample services
    console.log('\n💰 Top 5 Most Expensive Services:');
    const expensive = await db.all('SELECT name, price, category FROM services ORDER BY price DESC LIMIT 5');
    expensive.forEach((service: any) => {
      console.log(`   ${service.name}: ${service.price.toLocaleString()} UGX (${service.category})`);
    });

    console.log('\n✨ Cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupServices().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
