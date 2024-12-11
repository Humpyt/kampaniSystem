-- Categories for sales items
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sales items table
CREATE TABLE IF NOT EXISTS supplies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category) REFERENCES categories(id)
);

-- Insert categories
INSERT INTO categories (id, name) VALUES
('boot-trees', 'Boot Trees'),
('brushes', 'Brushes'),
('cleaners', 'Cleaners'),
('conditioners', 'Conditioners'),
('dyes', 'Dyes'),
('foot-aids', 'Foot Aids'),
('insoles', 'Insoles'),
('laces', 'Laces'),
('mens-shoe-trees', 'Men''s Shoe Trees'),
('shoe-horns', 'Shoe Horns'),
('shoe-polish', 'Shoe Polish'),
('shoe-shine-kits', 'Shoe Shine Kits'),
('stretchers', 'Stretchers'),
('tools-misc', 'Tools & Misc. Items'),
('waterproofers', 'Waterproofers'),
('womens-shoe-trees', 'Women''s Shoe Trees'),
('shine', 'Shine'),
('ups', 'UPS');

-- Insert sample products
INSERT INTO supplies (id, name, category, price, quantity, image_url) VALUES
('grip-n-shine', 'Grip-N-Shine', 'shoe-shine-kits', 8.99, 10, '/images/grip-n-shine.jpg'),
('kiwi-desert-boot', 'Kiwi Desert Boot Care Kit', 'shoe-shine-kits', 13.99, 10, '/images/kiwi-desert-boot.jpg'),
('kiwi-shine-kit', 'Kiwi Shine Kit', 'shoe-shine-kits', 14.99, 10, '/images/kiwi-shine-kit.jpg'),
('kiwi-travel-kit', 'Kiwi Travel Kit', 'shoe-shine-kits', 13.99, 10, '/images/kiwi-travel-kit.jpg'),
('rochester-executive', 'Rochester Executive Shoe Care', 'shoe-shine-kits', 79.99, 5, '/images/rochester-executive.jpg'),
('shine-butler', 'Shine Butler', 'shoe-shine-kits', 29.99, 8, '/images/shine-butler.jpg'),
('shoe-shine-box-empty', 'Shoe Shine Box Empty', 'shoe-shine-kits', 29.99, 10, '/images/shoe-shine-box-empty.jpg'),
('shoe-shine-box-kit', 'Shoe Shine Box Kit', 'shoe-shine-kits', 42.99, 7, '/images/shoe-shine-box-kit.jpg'),
('shoebox-supplies', 'Shoebox Supplies', 'shoe-shine-kits', 13.99, 15, '/images/shoebox-supplies.jpg'),
('shoekeeper', 'ShoeKeeper', 'shoe-shine-kits', 47.99, 6, '/images/shoekeeper.jpg'),
('traditional-golf', 'Traditional Golf Shoe Care Kit', 'shoe-shine-kits', 19.99, 10, '/images/traditional-golf.jpg');
