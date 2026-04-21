import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import db from './database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate consistent service ID from service name
function generateServiceId(name: string): string {
  const hash = createHash('md5').update(name.toLowerCase().trim()).digest('hex');
  return `srv_${hash.substring(0, 8)}`;
}

// Category mapping based on service name patterns
// Order matters - more specific patterns should come first
const categoryPatterns: Record<string, string[]> = {
  // Specific patterns (must be checked first)
  'wheel': ['wheel'],
  'elastic': ['lastic', 'libits'],
  'strap': ['strap'],
  // General patterns
  cleaning: ['cleaning', 'clean'],
  heel: ['heel', 'half-sole'],
  sole: ['full sole', 'sole replacement', 'full leather wrap', 'full fabric wrap'],
  dyeing: ['dyeing'],
  gluing: ['gluing', 'stitching'],
  polishing: ['polishing', 'polish', 'spraying'],
  restoration: ['restoration'],
  bag: ['handbag', 'hand bag'],
  adjustment: ['reduction', 'stretching'],
  other: ['belt', 'carpeting', 'lining']
};

// Estimated days based on service complexity
const complexityDays: Record<string, number> = {
  polishing: 1,
  cleaning: 2,
  'heel replacement': 3,
  gluing: 3,
  stitching: 3,
  dyeing: 5,
  'sole replacement': 5,
  restoration: 7,
  wrapping: 10
};

/**
 * Parse price string and extract numeric value
 * Handles: "10,000", "80,000-150,000", "25,000 per wheel"
 */
function parsePrice(priceStr: string): number {
  // Remove any text after the price (e.g., " per wheel")
  const numericPart = priceStr.split(' ')[0];

  // Check if it's a range (e.g., "80,000-150,000")
  if (numericPart.includes('-')) {
    const parts = numericPart.split('-');
    // Use maximum value as per user requirement
    const maxPrice = parts[1] || parts[0];
    return parseInt(maxPrice.replace(/,/g, ''), 10);
  }

  // Single price - remove commas and parse
  return parseInt(numericPart.replace(/,/g, ''), 10);
}

/**
 * Categorize service based on name patterns
 * Patterns are checked in order - specific patterns first
 */
function categorizeService(serviceName: string): string {
  const lowerName = serviceName.toLowerCase();

  // Define patterns in order of priority (most specific first)
  const priorityPatterns = [
    { category: 'wheel', patterns: categoryPatterns.wheel },
    { category: 'elastic', patterns: categoryPatterns.elastic },
    { category: 'strap', patterns: categoryPatterns.strap },
    { category: 'cleaning', patterns: categoryPatterns.cleaning },
    { category: 'heel', patterns: categoryPatterns.heel },
    { category: 'sole', patterns: categoryPatterns.sole },
    { category: 'dyeing', patterns: categoryPatterns.dyeing },
    { category: 'gluing', patterns: categoryPatterns.gluing },
    { category: 'polishing', patterns: categoryPatterns.polishing },
    { category: 'restoration', patterns: categoryPatterns.restoration },
    { category: 'bag', patterns: categoryPatterns.bag },
    { category: 'adjustment', patterns: categoryPatterns.adjustment },
    { category: 'other', patterns: categoryPatterns.other }
  ];

  for (const { category, patterns } of priorityPatterns) {
    for (const pattern of patterns) {
      if (lowerName.includes(pattern)) {
        return category;
      }
    }
  }

  return 'other';
}

/**
 * Assign estimated days based on service complexity
 */
function assignEstimatedDays(serviceName: string, categoryName: string): number {
  const lowerName = serviceName.toLowerCase();

  // Check specific complexity patterns
  for (const [pattern, days] of Object.entries(complexityDays)) {
    if (lowerName.includes(pattern)) {
      return days;
    }
  }

  // Default days based on category
  const categoryDefaults: Record<string, number> = {
    cleaning: 2,
    heel: 3,
    sole: 5,
    dyeing: 5,
    gluing: 3,
    polishing: 1,
    restoration: 7,
    bag: 3,
    adjustment: 2,
    other: 3
  };

  return categoryDefaults[categoryName] || 3;
}

/**
 * Import services from pricing.txt
 */
async function importServices() {
  try {
    console.log('📋 Starting service import from pricing.txt...\n');

    // Read pricing.txt file
    const pricingPath = path.join(__dirname, '..', 'pricing.txt');

    if (!fs.existsSync(pricingPath)) {
      console.error(`❌ Error: pricing.txt not found at ${pricingPath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(pricingPath, 'utf-8');
    // Remove \r characters and split by \n
    const lines = fileContent.replace(/\r/g, '').trim().split('\n');

    // Skip header row
    const dataLines = lines.slice(1);

    console.log(`📄 Found ${dataLines.length} services in pricing.txt\n`);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Process each service
    for (const line of dataLines) {
      try {
        // Parse CSV line - handle quoted price field
        // Format: JOB TITLE,"PRICE" (price is quoted and may contain commas)
        const match = line.match(/^([^,]+),"([^"]*)"$/);

        if (!match) {
          console.warn(`⚠️  Skipping malformed line: ${line}`);
          errors++;
          continue;
        }

        const [, name, priceStr] = match;
        await processService(name.trim(), priceStr.trim());

      } catch (error) {
        console.error(`❌ Error processing line: ${line}`);
        console.error(error);
        errors++;
      }
    }

    async function processService(name: string, priceStr: string) {
      // Parse price
      const price = parsePrice(priceStr);

      // Validate parsed data
      if (!price || price === 0 || isNaN(price)) {
        console.warn(`⚠️  Skipping service due to invalid price: ${name} - ${priceStr} → ${price}`);
        errors++;
        return;
      }

      // Validate service name
      if (name.length < 3 || name.includes('"') || name.includes(',')) {
        console.warn(`⚠️  Skipping service due to invalid name: ${name}`);
        errors++;
        return;
      }

      // Categorize
      const category = categorizeService(name);

      // Assign estimated days
      const estimatedDays = assignEstimatedDays(name, category);

      // Generate ID (consistent for same service name)
      const id = generateServiceId(name);

      // Insert or replace service
      await db.run(
        `INSERT OR REPLACE INTO services (id, name, price, estimated_days, category, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, name, price, estimatedDays, category]
      );

      imported++;

      // Log import details
      console.log(`✅ ${name}`);
      console.log(`   Price: ${price.toLocaleString()} UGX`);
      console.log(`   Category: ${category}`);
      console.log(`   Estimated Days: ${estimatedDays}\n`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Imported/Updated: ${imported} services`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    // Verify import
    const result = await db.get('SELECT COUNT(*) as count FROM services');
    console.log(`\n📦 Total services in database: ${result.count}`);

    // Show category breakdown
    const categories = await db.all('SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY count DESC');
    console.log('\n📁 Services by Category:');
    categories.forEach((cat: any) => {
      console.log(`   ${cat.category}: ${cat.count}`);
    });

    // Show most expensive services
    console.log('\n💰 Top 5 Most Expensive Services:');
    const expensive = await db.all('SELECT name, price, category FROM services ORDER BY price DESC LIMIT 5');
    expensive.forEach((service: any) => {
      console.log(`   ${service.name}: ${service.price.toLocaleString()} UGX (${service.category})`);
    });

    console.log('\n✨ Import completed successfully!\n');

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run import
importServices().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
