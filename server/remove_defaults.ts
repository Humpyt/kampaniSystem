import db from './database.js';

async function removeDefaults() {
  // Remove the default seeded services
  await db.run('DELETE FROM services WHERE id IN ("srv_repair", "srv_polish", "srv_clean")');

  const count = await db.get('SELECT COUNT(*) as count FROM services');
  console.log(`✅ Total services remaining: ${count.count}`);

  // Show category distribution
  const categories = await db.all('SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY category');
  console.log('\n📁 Services by Category:');
  categories.forEach((cat: any) => {
    console.log(`   ${cat.category}: ${cat.count}`);
  });
}

removeDefaults().then(() => process.exit(0));
