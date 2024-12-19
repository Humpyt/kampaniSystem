-- Buckles
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Brass Buckle 1"', 'buckles', 'High quality brass buckle for shoe straps', 50, 20, 1.99, 'pieces'),
('Silver Buckle 0.5"', 'buckles', 'Small silver buckle for delicate repairs', 75, 30, 1.49, 'pieces'),
('Gold Buckle 1.5"', 'buckles', 'Large decorative gold buckle', 40, 15, 2.99, 'pieces'),
('Antique Buckle 1"', 'buckles', 'Vintage style antique finish buckle', 60, 25, 2.49, 'pieces'),
('Black Buckle 0.75"', 'buckles', 'Black coated metal buckle', 45, 20, 1.79, 'pieces');

-- Cleaners
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Leather Cleaner', 'cleaners', 'All-purpose leather cleaner', 30, 10, 12.99, 'bottles'),
('Suede Brush', 'cleaners', 'Soft bristle brush for suede', 25, 10, 8.99, 'pieces'),
('Nubuck Cleaner', 'cleaners', 'Specialized nubuck leather cleaner', 20, 8, 14.99, 'bottles'),
('Shoe Polish Remover', 'cleaners', 'Gentle polish and wax remover', 35, 15, 9.99, 'bottles'),
('Leather Soap', 'cleaners', 'Traditional saddle soap', 40, 15, 7.99, 'pieces');

-- Dowel Tubes
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Wooden Dowel 6"', 'dowel tubes', 'Standard wooden dowel for repairs', 100, 40, 0.99, 'pieces'),
('Metal Tube 8"', 'dowel tubes', 'Reinforced metal tube', 80, 30, 1.99, 'pieces'),
('Plastic Tube 4"', 'dowel tubes', 'Lightweight plastic tube', 120, 50, 0.79, 'pieces'),
('Composite Dowel 6"', 'dowel tubes', 'Durable composite material dowel', 90, 35, 1.49, 'pieces'),
('Steel Tube 10"', 'dowel tubes', 'Heavy-duty steel tube', 70, 25, 2.49, 'pieces');

-- Dye
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Black Leather Dye', 'dye', 'Professional black leather dye', 25, 10, 19.99, 'bottles'),
('Brown Leather Dye', 'dye', 'Rich brown leather dye', 25, 10, 19.99, 'bottles'),
('Navy Leather Dye', 'dye', 'Deep navy leather dye', 20, 8, 21.99, 'bottles'),
('Red Leather Dye', 'dye', 'Vibrant red leather dye', 15, 6, 23.99, 'bottles'),
('Neutral Leather Dye', 'dye', 'Clear neutral leather dye', 30, 12, 17.99, 'bottles');

-- Elastics
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Black Elastic 1"', 'elastics', 'Strong black elastic band', 200, 80, 0.49, 'yards'),
('White Elastic 0.5"', 'elastics', 'Thin white elastic', 150, 60, 0.39, 'yards'),
('Beige Elastic 0.75"', 'elastics', 'Medium width beige elastic', 180, 70, 0.44, 'yards'),
('Heavy Duty Elastic 1.5"', 'elastics', 'Extra strong elastic band', 120, 50, 0.69, 'yards'),
('Clear Elastic 0.25"', 'elastics', 'Transparent thin elastic', 160, 65, 0.59, 'yards');

-- Glue & Thinner
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Shoe Contact Cement', 'glue & thinner', 'Professional grade contact cement', 40, 15, 24.99, 'cans'),
('Rubber Cement', 'glue & thinner', 'Flexible rubber cement adhesive', 35, 15, 19.99, 'bottles'),
('Leather Glue', 'glue & thinner', 'Specialized leather adhesive', 30, 12, 22.99, 'bottles'),
('Cement Thinner', 'glue & thinner', 'Professional cement thinner', 25, 10, 16.99, 'bottles'),
('Quick Set Adhesive', 'glue & thinner', 'Fast-drying shoe repair adhesive', 45, 18, 21.99, 'tubes');

-- Heels
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Men''s Rubber Heel', 'heels', 'Standard men''s rubber heel', 100, 40, 3.99, 'pairs'),
('Women''s Stiletto Heel', 'heels', 'High heel replacement', 80, 30, 4.99, 'pairs'),
('Wedge Heel', 'heels', 'Wooden wedge heel', 60, 25, 5.99, 'pairs'),
('Sport Heel', 'heels', 'Athletic shoe heel', 70, 30, 4.49, 'pairs'),
('Boot Heel', 'heels', 'Heavy duty boot heel', 90, 35, 6.99, 'pairs');

-- Insoles
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Memory Foam Insole', 'insoles - pads & sock lining', 'Comfort memory foam insole', 150, 60, 7.99, 'pairs'),
('Leather Insole', 'insoles - pads & sock lining', 'Premium leather insole', 120, 50, 9.99, 'pairs'),
('Sport Insole', 'insoles - pads & sock lining', 'Athletic shock absorbing insole', 100, 40, 8.99, 'pairs'),
('Gel Heel Pad', 'insoles - pads & sock lining', 'Cushioning heel pad', 200, 80, 3.99, 'pairs'),
('Arch Support Insert', 'insoles - pads & sock lining', 'Orthopedic arch support', 130, 50, 11.99, 'pairs');

-- Leather & Rubber
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Full Grain Leather', 'leather & rubber', 'Premium full grain leather', 50, 20, 29.99, 'sq_ft'),
('Rubber Sole Material', 'leather & rubber', 'Durable rubber soling', 60, 25, 19.99, 'sq_ft'),
('Suede Leather', 'leather & rubber', 'Soft suede leather', 40, 15, 24.99, 'sq_ft'),
('Neolite Sole', 'leather & rubber', 'Synthetic sole material', 70, 30, 21.99, 'sq_ft'),
('Patent Leather', 'leather & rubber', 'High gloss patent leather', 30, 12, 34.99, 'sq_ft');

-- Nails
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Shoe Tacks 3/8"', 'nails', 'Standard shoe tacks', 1000, 400, 0.05, 'pieces'),
('Heel Nails 1/2"', 'nails', 'Heel attachment nails', 800, 300, 0.07, 'pieces'),
('Sole Nails 1/4"', 'nails', 'Fine sole nails', 1200, 500, 0.04, 'pieces'),
('Copper Nails 3/4"', 'nails', 'Decorative copper nails', 600, 250, 0.09, 'pieces'),
('Steel Tacks 1/2"', 'nails', 'Heavy duty steel tacks', 900, 350, 0.06, 'pieces');

-- Needles
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Leather Needle #14', 'needles', 'Heavy leather sewing needle', 150, 60, 0.49, 'pieces'),
('Curved Needle #16', 'needles', 'Curved leather needle', 120, 50, 0.59, 'pieces'),
('Fine Needle #18', 'needles', 'Fine detail needle', 180, 70, 0.39, 'pieces'),
('Glover''s Needle #12', 'needles', 'Traditional glover''s needle', 100, 40, 0.69, 'pieces'),
('Harness Needle #10', 'needles', 'Extra strong harness needle', 130, 55, 0.79, 'pieces');

-- Rivets
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Brass Rivet 1/4"', 'rivets', 'Standard brass rivet', 500, 200, 0.15, 'pieces'),
('Copper Rivet 3/8"', 'rivets', 'Decorative copper rivet', 400, 160, 0.18, 'pieces'),
('Steel Rivet 1/2"', 'rivets', 'Heavy duty steel rivet', 450, 180, 0.16, 'pieces'),
('Silver Rivet 1/4"', 'rivets', 'Nickel-plated silver rivet', 350, 140, 0.19, 'pieces'),
('Black Rivet 3/8"', 'rivets', 'Black oxide coated rivet', 380, 150, 0.17, 'pieces');

-- Sand Paper
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Fine Grit 220', 'sand paper', 'Fine finishing sandpaper', 200, 80, 0.79, 'sheets'),
('Medium Grit 150', 'sand paper', 'General purpose sandpaper', 180, 70, 0.69, 'sheets'),
('Coarse Grit 80', 'sand paper', 'Heavy material removal', 160, 65, 0.89, 'sheets'),
('Ultra Fine 400', 'sand paper', 'Ultra smooth finishing', 140, 55, 0.99, 'sheets'),
('Wet/Dry Grit 320', 'sand paper', 'Wet or dry use sandpaper', 170, 68, 0.84, 'sheets');

-- Shanks
INSERT INTO supplies (name, category, description, on_hand, min_stock, cost, unit)
VALUES 
('Steel Shank 4"', 'shanks', 'Standard steel shoe shank', 120, 50, 1.99, 'pieces'),
('Plastic Shank 3"', 'shanks', 'Flexible plastic shank', 100, 40, 1.49, 'pieces'),
('Composite Shank 5"', 'shanks', 'Lightweight composite shank', 90, 35, 2.49, 'pieces'),
('Fiber Shank 4"', 'shanks', 'Reinforced fiber shank', 110, 45, 1.79, 'pieces'),
('Metal Arch 3"', 'shanks', 'Arch support shank', 80, 30, 2.99, 'pieces');
