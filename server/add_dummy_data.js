import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'shoerepair.db'));

const createTableSQL = `
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    last_visit TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
)`;

const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

const dummyCustomers = [
    ['John Smith', '555-0101', 'john.smith@email.com', '123 Main St, Anytown, USA', 'Regular customer', 5, 250.00],
    ['Sarah Johnson', '555-0102', 'sarah.j@email.com', '456 Oak Ave, Springfield, USA', 'Prefers evening appointments', 3, 150.00],
    ['Michael Brown', '555-0103', 'mbrown@email.com', '789 Pine Rd, Riverside, USA', 'Has loyalty card', 8, 400.00],
    ['Emma Wilson', '555-0104', 'ewilson@email.com', '321 Elm St, Lakeside, USA', 'Weekly customer', 12, 600.00],
    ['James Davis', '555-0105', 'jdavis@email.com', '654 Maple Dr, Highland, USA', '', 1, 50.00],
    ['Lisa Anderson', '555-0106', 'lisa.a@email.com', '987 Cedar Ln, Westville, USA', 'Special care for leather shoes', 4, 200.00],
    ['Robert Taylor', '555-0107', 'rtaylor@email.com', '147 Birch St, Easttown, USA', '', 2, 100.00],
    ['Patricia Martinez', '555-0108', 'pmartinez@email.com', '258 Walnut Ave, Southend, USA', 'Premium member', 15, 750.00],
    ['David Miller', '555-0109', 'dmiller@email.com', '369 Cherry Rd, Northside, USA', '', 1, 50.00],
    ['Jennifer Garcia', '555-0110', 'jgarcia@email.com', '741 Ash St, Central City, USA', 'Allergic to certain polishes', 6, 300.00],
    ['William Rodriguez', '555-0111', 'wrodriguez@email.com', '852 Spruce Dr, Midtown, USA', '', 2, 100.00],
    ['Elizabeth Lee', '555-0112', 'elee@email.com', '963 Fir Ave, Downtown, USA', 'Business account', 20, 1000.00],
    ['Thomas Moore', '555-0113', 'tmoore@email.com', '159 Pine St, Uptown, USA', '', 3, 150.00],
    ['Mary White', '555-0114', 'mwhite@email.com', '357 Oak Rd, Westside, USA', 'Monthly regular', 7, 350.00],
    ['Charles King', '555-0115', 'cking@email.com', '486 Maple Ave, Eastside, USA', '', 1, 50.00],
    ['Susan Wright', '555-0116', 'swright@email.com', '753 Cedar St, Northtown, USA', 'Prefers eco-friendly products', 4, 200.00],
    ['Joseph Lopez', '555-0117', 'jlopez@email.com', '951 Elm Dr, Southtown, USA', '', 2, 100.00],
    ['Margaret Hall', '555-0118', 'mhall@email.com', '147 Birch Ave, Westend, USA', 'VIP customer', 25, 1250.00],
    ['Richard Adams', '555-0119', 'radams@email.com', '258 Walnut St, Eastend, USA', '', 1, 50.00],
    ['Barbara Clark', '555-0120', 'bclark@email.com', '369 Cherry Ln, Downtown, USA', 'Frequent buyer', 10, 500.00]
];

// First, drop the existing customers table if it exists
db.serialize(() => {
    db.run('DROP TABLE IF EXISTS customers', (err) => {
        if (err) {
            console.error('Error dropping table:', err);
            return;
        }
        console.log('Dropped existing customers table');

        // Create the table
        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                return;
            }
            console.log('Table created successfully');
            
            // Prepare and execute the insert statements
            const stmt = db.prepare(`
                INSERT INTO customers (
                    id, name, phone, email, address, notes,
                    status, total_orders, total_spent, last_visit,
                    loyalty_points, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            
            dummyCustomers.forEach((customer) => {
                const id = uuidv4();
                const [name, phone, email, address, notes, total_orders, total_spent] = customer;
                const loyalty_points = Math.floor(total_spent / 10); // 1 point for every $10 spent
                
                stmt.run(
                    id, name, phone, email || '', address || '', notes || '',
                    'active', total_orders, total_spent, currentDate,
                    loyalty_points, currentDate, currentDate,
                    (err) => {
                        if (err) {
                            console.error(`Error adding customer ${name}:`, err);
                        } else {
                            console.log(`Added customer: ${name}`);
                        }
                    }
                );
            });
            
            stmt.finalize(() => {
                console.log('Finished adding dummy customers');
                db.close();
            });
        });
    });
});
