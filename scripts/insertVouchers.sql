-- Insert initial voucher data based on the voucher system design

INSERT INTO vouchers (
  id, category, brand, title, description, points_required, original_value,
  discount_type, discount_value, image, logo, color, validity_days,
  terms_and_conditions, is_active, stock_limit, current_stock
) VALUES 
-- Shopping Discounts
(
  'amazon-50', 'shopping', 'Amazon', '₹50 OFF on Amazon',
  '₹50 off on any order above ₹500', 500, 50, 'fixed', 50,
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
  'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  '#FF9900', 30,
  '["Valid on orders above ₹500", "Cannot be combined with other offers", "Valid for 30 days from redemption", "Applicable on all categories except gift cards"]'::jsonb,
  true, 100, 85
),
(
  'flipkart-10percent', 'shopping', 'Flipkart', '10% OFF on Flipkart',
  '10% discount up to ₹200 on any order', 400, 200, 'percentage', 10,
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2020/11/Flipkart-Logo.png',
  '#047BD6', 45,
  '["Maximum discount ₹200", "Valid on all categories", "Cannot be clubbed with ongoing offers", "Valid for 45 days"]'::jsonb,
  true, 150, 120
),
(
  'myntra-5percent', 'shopping', 'Myntra', '5% OFF on Myntra',
  '5% discount on fashion and lifestyle', 300, 150, 'percentage', 5,
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2020/11/Myntra-Logo.png',
  '#EE5A52', 60,
  '["Valid on fashion and lifestyle products", "Minimum order value ₹999", "Valid for 60 days", "Excludes sale items"]'::jsonb,
  true, 200, 180
),

-- Food & Beverages
(
  'dominos-free-pizza', 'food', 'Domino''s', 'Free Domino''s Pizza',
  'Get a free regular pizza of your choice', 1000, 299, 'free', 299,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2020/11/Dominos-Logo.png',
  '#0078AE', 15,
  '["Valid on regular size pizzas only", "Dine-in and takeaway only", "Cannot be combined with other offers", "Valid for 15 days"]'::jsonb,
  true, 50, 32
),
(
  'swiggy-20percent', 'food', 'Swiggy', '20% OFF on Swiggy',
  '20% discount up to ₹100 on food orders', 600, 100, 'percentage', 20,
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2020/11/Swiggy-Logo.png',
  '#FC8019', 30,
  '["Maximum discount ₹100", "Valid on food orders only", "Minimum order value ₹199", "Valid for 30 days"]'::jsonb,
  true, 200, 165
),
(
  'ccd-free-coffee', 'food', 'Café Coffee Day', 'Free Coffee at CCD',
  'Get a free regular coffee of your choice', 350, 120, 'free', 120,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2021/02/Cafe-Coffee-Day-Logo.png',
  '#7B3F00', 21,
  '["Valid on regular coffee varieties", "One voucher per visit", "Valid at all CCD outlets", "Valid for 21 days"]'::jsonb,
  true, 150, 98
),

-- Travel & Transport
(
  'uber-100-discount', 'travel', 'Uber', '₹100 Uber Ride Discount',
  '₹100 off on your next Uber ride', 800, 100, 'fixed', 100,
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2020/05/Uber-Logo.png',
  '#000000', 30,
  '["Valid on UberGo and UberX", "Maximum one voucher per ride", "Valid in all cities", "Valid for 30 days"]'::jsonb,
  true, 100, 73
),
(
  'ola-coupons', 'travel', 'Ola', 'Ola Ride Coupons',
  '₹75 off on Ola rides (Pack of 2)', 500, 150, 'fixed', 75,
  'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400&h=200&fit=crop',
  'https://logos-world.net/wp-content/uploads/2020/11/Ola-Logo.png',
  '#C0DF16', 45,
  '["Pack contains 2 coupons of ₹75 each", "Valid on all ride categories", "Cannot be combined with other offers", "Valid for 45 days"]'::jsonb,
  true, 80, 54
),

-- Eco-friendly Stores
(
  'green-store-bottles', 'eco-friendly', 'Green Store', '15% OFF Reusable Bottles',
  '15% discount on eco-friendly reusable bottles', 450, 200, 'percentage', 15,
  'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop',
  '#22C55E', 60,
  '["Valid on all reusable bottles", "Minimum purchase ₹500", "Valid at all Green Store outlets", "Valid for 60 days"]'::jsonb,
  true, 120, 89
),
(
  'eco-bags-discount', 'eco-friendly', 'EcoLife', 'Eco-friendly Bags Discount',
  'Discount on cloth bags & bamboo products', 350, 150, 'fixed', 100,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop',
  '#059669', 90,
  '["Valid on cloth bags and bamboo products", "Minimum purchase ₹300", "Free delivery on orders above ₹499", "Valid for 90 days"]'::jsonb,
  true, 200, 156
);

-- Insert some initial achievements
INSERT INTO achievements (
  name, description, icon, points_required, badge_type, category
) VALUES 
('First Steps', 'Classify your first piece of waste', '🌱', 1, 'bronze', 'classification'),
('Eco Beginner', 'Earn your first 100 points', '🏆', 100, 'bronze', 'points'),
('Green Warrior', 'Classify 50 items correctly', '⚔️', 50, 'silver', 'classification'),
('Eco Champion', 'Reach 500 points', '🏅', 500, 'silver', 'points'),
('Waste Master', 'Classify 200 items correctly', '👑', 200, 'gold', 'classification'),
('Eco Legend', 'Reach 2000 points', '💎', 2000, 'gold', 'points'),
('Planet Saver', 'Classify 500 items correctly', '🌍', 500, 'platinum', 'classification'),
('Eco Elite', 'Reach 5000 points', '✨', 5000, 'platinum', 'points');

-- Insert some recycling centers
INSERT INTO recycling_centers (
  name, address, location, accepted_types, hours, contact, rating, verified
) VALUES 
(
  'Green Recycling Hub', 
  '123 Eco Street, Green District, Mumbai, Maharashtra 400001',
  '{"lat": 19.0760, "lng": 72.8777}'::jsonb,
  ARRAY['plastic', 'glass', 'metal', 'paper'],
  'Monday-Saturday: 8AM-6PM, Sunday: 9AM-4PM',
  '+91 98765 43210',
  4.8,
  true
),
(
  'EcoWaste Solutions', 
  '456 Sustainability Road, Eco Park, Delhi, Delhi 110001',
  '{"lat": 28.7041, "lng": 77.1025}'::jsonb,
  ARRAY['plastic', 'electronic', 'battery', 'metal'],
  'Daily: 7AM-7PM',
  '+91 87654 32109',
  4.5,
  true
),
(
  'Clean Earth Center', 
  '789 Environmental Ave, Green Zone, Bangalore, Karnataka 560001',
  '{"lat": 12.9716, "lng": 77.5946}'::jsonb,
  ARRAY['glass', 'paper', 'cardboard', 'organic'],
  'Monday-Friday: 8AM-5PM, Saturday: 9AM-3PM',
  '+91 76543 21098',
  4.6,
  true
);
