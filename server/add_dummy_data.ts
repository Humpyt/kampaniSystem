import db from './database';
import crypto from 'crypto';

const dummyCustomers = [
    ['John Smith', '555-0101', 'john.smith@email.com', '123 Main St, Anytown, USA', 'Regular customer'],
    ['Sarah Johnson', '555-0102', 'sarah.j@email.com', '456 Oak Ave, Springfield, USA', 'Prefers evening appointments'],
    ['Michael Brown', '555-0103', 'mbrown@email.com', '789 Pine Rd, Riverside, USA', 'Has loyalty card'],
    ['Emma Wilson', '555-0104', 'ewilson@email.com', '321 Elm St, Lakeside, USA', 'Weekly customer'],
    ['James Davis', '555-0105', 'jdavis@email.com', '654 Maple Dr, Highland, USA', ''],
    ['Lisa Anderson', '555-0106', 'lisa.a@email.com', '987 Cedar Ln, Westville, USA', 'Special care for leather shoes'],
    ['Robert Taylor', '555-0107', 'rtaylor@email.com', '147 Birch St, Easttown, USA', ''],
    ['Patricia Martinez', '555-0108', 'pmartinez@email.com', '258 Walnut Ave, Southend, USA', 'Premium member'],
    ['David Miller', '555-0109', 'dmiller@email.com', '369 Cherry Rd, Northside, USA', ''],
    ['Jennifer Garcia', '555-0110', 'jgarcia@email.com', '741 Ash St, Central City, USA', 'Allergic to certain polishes'],
    ['William Rodriguez', '555-0111', 'wrodriguez@email.com', '852 Spruce Dr, Midtown, USA', ''],
    ['Elizabeth Lee', '555-0112', 'elee@email.com', '963 Fir Ave, Downtown, USA', 'Business account'],
    ['Thomas Moore', '555-0113', 'tmoore@email.com', '159 Pine St, Uptown, USA', ''],
    ['Mary White', '555-0114', 'mwhite@email.com', '357 Oak Rd, Westside, USA', 'Monthly regular'],
    ['Charles King', '555-0115', 'cking@email.com', '486 Maple Ave, Eastside, USA', ''],
    ['Susan Wright', '555-0116', 'swright@email.com', '753 Cedar St, Northtown, USA', 'Prefers eco-friendly products'],
    ['Joseph Lopez', '555-0117', 'jlopez@email.com', '951 Elm Dr, Southtown, USA', ''],
    ['Margaret Hall', '555-0118', 'mhall@email.com', '147 Birch Ave, Westend, USA', 'VIP customer'],
    ['Richard Adams', '555-0119', 'radams@email.com', '258 Walnut St, Eastend, USA', ''],
    ['Barbara Clark', '555-0120', 'bclark@email.com', '369 Cherry Ln, Downtown, USA', 'Frequent buyer']
];

async function addDummyCustomers() {
    for (const customer of dummyCustomers) {
        try {
            const stmt = db.prepare('INSERT INTO customers (id, name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?)');
            const id = crypto.randomUUID();
            stmt.run(id, ...customer);
            console.log(`Added customer: ${customer[0]}`);
        } catch (error) {
            console.error(`Error adding customer ${customer[0]}:`, error);
        }
    }
    console.log('Finished adding dummy customers');
    process.exit(0);
}

addDummyCustomers();
