import db from './database';

async function checkServices() {
  try {
    const services = await db.all('SELECT id, name, category FROM services');
    console.log(`\n📋 Total services in database: ${services.length}\n`);

    if (services.length === 0) {
      console.log('⚠️  No services found in database!');
    } else {
      console.log('Services:');
      services.forEach((service: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${service.id}`);
        console.log(`     Name: ${service.name}`);
        console.log(`     Category: ${service.category}\n`);
      });
    }

    // Check customers
    const customers = await db.all('SELECT id, name FROM customers');
    console.log(`\n👥 Total customers in database: ${customers.length}\n`);
    customers.forEach((customer: any, index: number) => {
      console.log(`  ${index + 1}. ID: ${customer.id}, Name: ${customer.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkServices();
