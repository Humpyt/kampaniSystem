import * as XLSX from 'xlsx';
import db from './database';
import { v4 as uuidv4 } from 'uuid';

async function importCustomers() {
  console.log('🔄 Starting customer import from Excel file...\n');

  try {
    // Read the Excel file
    const workbook = XLSX.readFile('Copy of CUSTOMER LIST 1.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with raw option to preserve values
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row
    const dataRows = rawData.slice(1) as any[][];

    console.log(`📊 Found ${dataRows.length} rows in Excel file\n`);

    const customers: { name: string; phone: string }[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length < 1) continue;

      // Get customer name and phone
      const customer = String(row[0] || '').trim();
      const mainPhone = String(row[1] || '').trim();

      // Skip empty rows
      if (!customer) continue;

      // Skip if no phone number or phone is just placeholder
      if (!mainPhone || mainPhone === '' || mainPhone === '-' || mainPhone.length < 5) {
        invalid.push(customer);
        continue;
      }

      // Check for duplicates within import file
      const isDuplicate = customers.some(
        c => c.name === customer && c.phone === mainPhone
      );

      if (isDuplicate) {
        duplicates.push(`${customer} (${mainPhone})`);
        continue;
      }

      customers.push({ name: customer, phone: mainPhone });
    }

    console.log(`📋 Parsed ${customers.length} valid customers to import\n`);

    // Check existing customers in database
    const existingCustomers = await db.all('SELECT name, phone FROM customers');
    const existingPhoneNumbers = new Set(existingCustomers.map((c: any) => c.phone));

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Import customers to database
    for (const customerRow of customers) {
      try {
        // Skip if phone already exists
        if (existingPhoneNumbers.has(customerRow.phone)) {
          skipped++;
          console.log(`⏭️  Skipped (exists): ${customerRow.name} - ${customerRow.phone}`);
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
          customerRow.name,
          customerRow.phone,
          null,
          null,
          null,
          'active',
          0,
          0,
          now,
          0,
          now,
          now
        ]);

        added++;
        console.log(`✅ Added: ${customerRow.name} - ${customerRow.phone}`);

      } catch (error) {
        const errorMsg = `Failed to add ${customerRow.name}: ${error}`;
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

    if (duplicates.length > 0 && duplicates.length <= 20) {
      console.log('\n🔄 Duplicates skipped in file:');
      duplicates.forEach(dup => console.log(`  - ${dup}`));
    } else if (duplicates.length > 20) {
      console.log(`\n🔄 Duplicates skipped in file: ${duplicates.length} entries`);
    }

    if (invalid.length > 0 && invalid.length <= 20) {
      console.log('\n⚠️  Invalid entries (no phone number):');
      invalid.forEach(inv => console.log(`  - ${inv}`));
    } else if (invalid.length > 20) {
      console.log(`\n⚠️  Invalid entries (no phone): ${invalid.length} entries`);
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
