import fs from 'fs';
import db from './database';
import { v4 as uuidv4 } from 'uuid';

interface CustomerRow {
  customer: string;
  mainPhone: string;
}

async function importCustomers() {
  console.log('🔄 Starting customer import...\n');

  try {
    // Read the customer list file
    const fileContent = fs.readFileSync('Copy of CUSTOMER LIST 1.xlsx', 'utf-8');

    // Parse the CSV content (skipping header and BOM)
    const lines = fileContent.split('\n').slice(1); // Skip header

    const customers: CustomerRow[] = [];
    const duplicates: string[] = [];
    const invalid: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle comma-separated values
      const parts = line.split(',');
      if (parts.length < 2) continue;

      const customer = parts[0].trim();
      const mainPhone = parts.slice(1).join(',').trim(); // Rejoin in case name has commas

      // Skip if no name
      if (!customer) continue;

      // Skip if no phone number
      if (!mainPhone || mainPhone === '' || mainPhone === '-') {
        invalid.push(customer);
        continue;
      }

      // Check for duplicates within the import file
      const isDuplicate = customers.some(
        c => c.customer === customer && c.mainPhone === mainPhone
      );

      if (isDuplicate) {
        duplicates.push(`${customer} (${mainPhone})`);
        continue;
      }

      customers.push({ customer, mainPhone });
    }

    console.log(`📊 Found ${customers.length} unique customers to import\n`);

    // Check which customers already exist in database
    const existingCustomers = await db.all('SELECT name, phone FROM customers');
    const existingPhoneNumbers = new Set(existingCustomers.map((c: any) => c.phone));

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Add customers to database
    for (const customerRow of customers) {
      try {
        // Skip if phone number already exists
        if (existingPhoneNumbers.has(customerRow.mainPhone)) {
          skipped++;
          console.log(`⏭️  Skipped (exists): ${customerRow.customer} - ${customerRow.mainPhone}`);
          continue;
        }

        const customerId = uuidv4();
        const now = new Date().toISOString();

        await db.run(`
          INSERT INTO customers (
            id, name, phone, email, address, notes, status,
            total_orders, total_spent, last_visit, loyalty_points,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          customerId,
          customerRow.customer,
          customerRow.mainPhone,
          null, // email
          null, // address
          null, // notes
          'active',
          0,    // total_orders
          0,    // total_spent
          now,  // last_visit
          0,    // loyalty_points
          now,  // created_at
          now   // updated_at
        ]);

        added++;
        console.log(`✅ Added: ${customerRow.customer} - ${customerRow.mainPhone}`);

      } catch (error) {
        const errorMsg = `Failed to add ${customerRow.customer}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully added: ${added} customers`);
    console.log(`⏭️  Skipped (already exists): ${skipped} customers`);
    console.log(`❌ Errors: ${errors.length} customers`);
    console.log(`🔄 Duplicates in file: ${duplicates.length} entries`);
    console.log(`⚠️  Invalid entries (no phone): ${invalid.length} entries`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    if (duplicates.length > 0) {
      console.log('\n🔄 Duplicates skipped in file:');
      duplicates.slice(0, 10).forEach(dup => console.log(`  - ${dup}`));
      if (duplicates.length > 10) {
        console.log(`  ... and ${duplicates.length - 10} more`);
      }
    }

    if (invalid.length > 0) {
      console.log('\n⚠️  Invalid entries (no phone number):');
      invalid.slice(0, 10).forEach(inv => console.log(`  - ${inv}`));
      if (invalid.length > 10) {
        console.log(`  ... and ${invalid.length - 10} more`);
      }
    }

    // Verify final count
    const finalCount = await db.get('SELECT COUNT(*) as count FROM customers');
    console.log(`\n📊 Total customers in database: ${finalCount.count}\n`);

    console.log('✨ Import completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    process.exit(1);
  }
}

importCustomers();
