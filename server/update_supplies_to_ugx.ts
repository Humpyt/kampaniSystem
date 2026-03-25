import db from './database';

// Conversion rate: 1 USD = 3800 UGX (approximate)
const USD_TO_UGX = 3800;

async function updateSuppliesToUGX() {
  try {
    console.log('Updating supplies costs from USD to UGX...');

    const supplies = await db.prepare('SELECT * FROM supplies').all();

    for (const supply of supplies) {
      const ugxCost = Math.round(supply.cost * USD_TO_UGX);

      await db.prepare(`
        UPDATE supplies
        SET cost = ?
        WHERE id = ?
      `).run(ugxCost, supply.id);

      console.log(`Updated ${supply.name}: ${supply.cost} USD → ${ugxCost} UGX`);
    }

    console.log('All supplies updated to UGX successfully!');
  } catch (error) {
    console.error('Error updating supplies:', error);
    process.exit(1);
  }
}

updateSuppliesToUGX();
