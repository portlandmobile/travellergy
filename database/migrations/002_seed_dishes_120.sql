-- Travellergy — Slice 13: Seed 120 dishes (30 per region)
-- Run in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Tokyo
-- ---------------------------------------------------------------------------
insert into public.dishes (name_local, name_en, slug, description, is_common_allergen_risk)
values 
('Sushi', 'Sushi', 'sushi', 'Vinegared rice dish with seafood.', true),
('Ramen', 'Ramen', 'ramen', 'Wheat noodles served in meat or fish-based broth.', true),
('Tempura', 'Tempura', 'tempura', 'Battered and deep-fried seafood and vegetables.', true),
('Tonkatsu', 'Tonkatsu', 'tonkatsu', 'Breaded deep-fried pork cutlet.', true),
('Yakitori', 'Yakitori', 'yakitori', 'Skewered grilled chicken.', false),
('Sashimi', 'Sashimi', 'sashimi', 'Fresh raw fish sliced into thin pieces.', true),
('Miso Soup', 'Miso Soup', 'miso-soup', 'Traditional Japanese soup containing soybean paste.', true),
('Udon', 'Udon', 'udon', 'Thick wheat noodles.', true),
('Soba', 'Soba', 'soba', 'Buckwheat noodles.', true),
('Takoyaki', 'Takoyaki', 'takoyaki', 'Ball-shaped snack made of wheat flour-based batter filled with octopus.', true),
('Okonomiyaki', 'Okonomiyaki', 'okonomiyaki', 'Japanese savory pancake.', true),
('Gyudon', 'Gyudon', 'gyudon', 'Beef bowl.', false),
('Curry Rice', 'Curry Rice', 'curry-rice', 'Japanese-style curry with rice.', true),
('Unagi', 'Unagi', 'unagi', 'Freshwater eel.', true),
('Sukiyaki', 'Sukiyaki', 'sukiyaki', 'Hot pot dish of thinly sliced beef.', false),
('Shabu-shabu', 'Shabu-shabu', 'shabu-shabu', 'Hot pot dish of thinly sliced meat and vegetables.', false),
('Gyoza', 'Gyoza', 'gyoza', 'Dumplings filled with ground meat and vegetables.', true),
('Natto', 'Natto', 'natto', 'Fermented soybeans.', true),
('Taiyaki', 'Taiyaki', 'taiyaki', 'Fish-shaped cake filled with red bean paste.', true),
('Omurice', 'Omurice', 'omurice', 'Omelette with fried rice.', true),
('Kaiseki', 'Kaiseki', 'kaiseki', 'Traditional multi-course Japanese dinner.', true),
('Chawanmushi', 'Chawanmushi', 'chawanmushi', 'Steamed egg custard.', true),
('Nikujaga', 'Nikujaga', 'nikujaga', 'Meat and potato stew.', false),
('Oden', 'Oden', 'oden', 'One-pot dish with various ingredients.', true),
('Sashimi Don', 'Sashimi Don', 'sashimi-don', 'Bowl of rice topped with fresh raw fish.', true),
('Anpan', 'Anpan', 'anpan', 'Sweet roll filled with red bean paste.', true),
('Mochi', 'Mochi', 'mochi', 'Rice cake made of glutinous rice.', false),
('Tempura Udon', 'Tempura Udon', 'tempura-udon', 'Udon noodle soup topped with tempura.', true),
('Tsukemen', 'Tsukemen', 'tsukemen', 'Dipping ramen.', true),
('Yakiniku', 'Yakiniku', 'yakiniku', 'Grilled meat.', false)
on conflict (slug) do nothing;

insert into public.region_dish_mapping (region_id, dish_id, prevalence)
select r.id, d.id, 'COMMON'
from public.regions r
cross join public.dishes d
where r.slug = 'tokyo'
and d.slug in ('sushi', 'ramen', 'tempura', 'tonkatsu', 'yakitori', 'sashimi', 'miso-soup', 'udon', 'soba', 'takoyaki', 'okonomiyaki', 'gyudon', 'curry-rice', 'unagi', 'sukiyaki', 'shabu-shabu', 'gyoza', 'natto', 'taiyaki', 'omurice', 'kaiseki', 'chawanmushi', 'nikujaga', 'oden', 'sashimi-don', 'anpan', 'mochi', 'tempura-udon', 'tsukemen', 'yakiniku')
on conflict (region_id, dish_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Bangkok
-- ---------------------------------------------------------------------------
insert into public.dishes (name_local, name_en, slug, description, is_common_allergen_risk)
values 
('Pad Thai', 'Pad Thai', 'pad-thai', 'Stir-fried rice noodle dish.', true),
('Tom Yum Goong', 'Tom Yum Goong', 'tom-yum-goong', 'Spicy and sour shrimp soup.', true),
('Som Tum', 'Som Tum', 'som-tum', 'Spicy green papaya salad.', true),
('Green Curry', 'Green Curry', 'green-curry', 'Thai green curry with coconut milk.', true),
('Massaman Curry', 'Massaman Curry', 'massaman-curry', 'Rich, relatively mild Thai curry.', true),
('Pad Kra Pao', 'Pad Kra Pao', 'pad-kra-pao', 'Stir-fried Thai holy basil with meat.', true),
('Mango Sticky Rice', 'Mango Sticky Rice', 'mango-sticky-rice', 'Sweet sticky rice with mango.', false),
('Tom Kha Gai', 'Tom Kha Gai', 'tom-kha-gai', 'Coconut chicken soup.', true),
('Khao Pad', 'Khao Pad', 'khao-pad', 'Thai fried rice.', true),
('Pad See Ew', 'Pad See Ew', 'pad-see-ew', 'Stir-fried wide rice noodles with soy sauce.', true),
('Gai Yang', 'Gai Yang', 'gai-yang', 'Grilled chicken.', false),
('Larb', 'Larb', 'larb', 'Spicy meat salad.', false),
('Moo Ping', 'Moo Ping', 'moo-ping', 'Grilled pork skewers.', false),
('Boat Noodles', 'Boat Noodles', 'boat-noodles', 'Noodle dish with strong, spicy broth.', true),
('Roti', 'Roti', 'roti', 'Fried flatbread.', true),
('Tod Mun Pla', 'Tod Mun Pla', 'tod-mun-pla', 'Thai fish cakes.', true),
('Yam Nua', 'Yam Nua', 'yam-nua', 'Spicy beef salad.', false),
('Gaeng Som', 'Gaeng Som', 'gaeng-som', 'Spicy and sour curry.', true),
('Khao Soi', 'Khao Soi', 'khao-soi', 'Northern Thai coconut curry noodle soup.', true),
('Kanom Jeen', 'Kanom Jeen', 'kanom-jeen', 'Fresh rice noodle dish.', false),
('Sai Oua', 'Sai Oua', 'sai-oua', 'Northern Thai spicy sausage.', false),
('Pad Pak Bung', 'Pad Pak Bung', 'pad-pak-bung', 'Stir-fried morning glory.', true),
('Goong Ob Woonsen', 'Goong Ob Woonsen', 'goong-ob-woonsen', 'Baked shrimp with glass noodles.', true),
('Nam Prik', 'Nam Prik', 'nam-prik', 'Thai chili dip.', true),
('Moo Krob', 'Moo Krob', 'moo-krob', 'Crispy pork belly.', false),
('Jok', 'Jok', 'jok', 'Rice congee.', false),
('Hoy Tod', 'Hoy Tod', 'hoy-tod', 'Crispy oyster omelet.', true),
('Khanom Krok', 'Khanom Krok', 'khanom-krok', 'Coconut pancakes.', true),
('Gaeng Keow Wan', 'Gaeng Keow Wan', 'gaeng-keow-wan', 'Thai green curry.', true),
('Khao Niew Dam', 'Khao Niew Dam', 'khao-niew-dam', 'Black sticky rice dessert.', false)
on conflict (slug) do nothing;

insert into public.region_dish_mapping (region_id, dish_id, prevalence)
select r.id, d.id, 'COMMON'
from public.regions r
cross join public.dishes d
where r.slug = 'bangkok'
and d.slug in ('pad-thai', 'tom-yum-goong', 'som-tum', 'green-curry', 'massaman-curry', 'pad-kra-pao', 'mango-sticky-rice', 'tom-kha-gai', 'khao-pad', 'pad-see-ew', 'gai-yang', 'larb', 'moo-ping', 'boat-noodles', 'roti', 'tod-mun-pla', 'yam-nua', 'gaeng-som', 'khao-soi', 'kanom-jeen', 'sai-oua', 'pad-pak-bung', 'goong-ob-woonsen', 'nam-prik', 'moo-krob', 'jok', 'hoy-tod', 'khanom-krok', 'gaeng-keow-wan', 'khao-niew-dam')
on conflict (region_id, dish_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Delhi
-- ---------------------------------------------------------------------------
insert into public.dishes (name_local, name_en, slug, description, is_common_allergen_risk)
values 
('Butter Chicken', 'Butter Chicken', 'butter-chicken', 'Creamy tomato-based chicken curry.', true),
('Dal Makhani', 'Dal Makhani', 'dal-makhani', 'Creamy lentils cooked overnight.', true),
('Palak Paneer', 'Palak Paneer', 'palak-paneer', 'Spinach with paneer cheese.', true),
('Biryani', 'Biryani', 'biryani', 'Aromatic rice dish.', false),
('Chole Bhature', 'Chole Bhature', 'chole-bhature', 'Spicy chickpeas with fried bread.', true),
('Tandoori Chicken', 'Tandoori Chicken', 'tandoori-chicken', 'Roasted chicken cooked in a tandoor.', true),
('Aloo Gobi', 'Aloo Gobi', 'aloo-gobi', 'Potato and cauliflower curry.', false),
('Paneer Tikka', 'Paneer Tikka', 'paneer-tikka', 'Marinated paneer grilled.', true),
('Kheer', 'Kheer', 'kheer', 'Rice pudding.', true),
('Naan', 'Naan', 'naan', 'Leavened flatbread.', true),
('Gulab Jamun', 'Gulab Jamun', 'gulab-jamun', 'Deep-fried dough balls in sugar syrup.', true),
('Rajma', 'Rajma', 'rajma', 'Kidney bean curry.', false),
('Matar Paneer', 'Matar Paneer', 'matar-paneer', 'Peas and paneer curry.', true),
('Kebabs', 'Kebabs', 'kebabs', 'Skewered grilled meat.', false),
('Samosa', 'Samosa', 'samosa', 'Fried pastry with savory filling.', true),
('Chaat', 'Chaat', 'chaat', 'Savory snacks often served from street carts.', true),
('Paratha', 'Paratha', 'paratha', 'Pan-fried layered bread.', true),
('Dosa', 'Dosa', 'dosa', 'Fermented rice and lentil crepe.', false),
('Jalebi', 'Jalebi', 'jalebi', 'Crispy sweet spirals soaked in syrup.', true),
('Rasmalai', 'Rasmalai', 'rasmalai', 'Soft cheese patties in sweet milk.', true),
('Malai Kofta', 'Malai Kofta', 'malai-kofta', 'Dumplings in creamy gravy.', true),
('Seekh Kebab', 'Seekh Kebab', 'seekh-kebab', 'Spiced minced meat skewers.', false),
('Bhindi Masala', 'Bhindi Masala', 'bhindi-masala', 'Okra stir-fry.', false),
('Chicken Tikka Masala', 'Chicken Tikka Masala', 'chicken-tikka-masala', 'Chicken chunks in spicy gravy.', true),
('Kadai Paneer', 'Kadai Paneer', 'kadai-paneer', 'Spicy paneer stir-fry.', true),
('Dahi Puri', 'Dahi Puri', 'dahi-puri', 'Crispy shells filled with yogurt and chutney.', true),
('Papdi Chaat', 'Papdi Chaat', 'papdi-chaat', 'Crispy bread with yogurt and chutney.', true),
('Moong Dal Halwa', 'Moong Dal Halwa', 'moong-dal-halwa', 'Split mung bean pudding.', true),
('Rabri', 'Rabri', 'rabri', 'Sweet thickened milk.', true),
('Shahi Paneer', 'Shahi Paneer', 'shahi-paneer', 'Rich paneer curry with royal spices.', true)
on conflict (slug) do nothing;

insert into public.region_dish_mapping (region_id, dish_id, prevalence)
select r.id, d.id, 'COMMON'
from public.regions r
cross join public.dishes d
where r.slug = 'delhi'
and d.slug in ('butter-chicken', 'dal-makhani', 'palak-paneer', 'biryani', 'chole-bhature', 'tandoori-chicken', 'aloo-gobi', 'paneer-tikka', 'kheer', 'naan', 'gulab-jamun', 'rajma', 'matar-paneer', 'kebabs', 'samosa', 'chaat', 'paratha', 'dosa', 'jalebi', 'rasmalai', 'malai-kofta', 'seekh-kebab', 'bhindi-masala', 'chicken-tikka-masala', 'kadai-paneer', 'dahi-puri', 'papdi-chaat', 'moong-dal-halwa', 'rabri', 'shahi-paneer')
on conflict (region_id, dish_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. NYC
-- ---------------------------------------------------------------------------
insert into public.dishes (name_local, name_en, slug, description, is_common_allergen_risk)
values 
('Pizza (Slice)', 'Pizza (Slice)', 'pizza-slice', 'Iconic NY thin-crust pizza.', true),
('Bagel', 'Bagel', 'bagel', 'Boiled and baked bread ring.', true),
('Pastrami Sandwich', 'Pastrami Sandwich', 'pastrami-sandwich', 'Thinly sliced cured beef on rye.', true),
('Cheesecake', 'Cheesecake', 'cheesecake', 'Rich dessert with cream cheese.', true),
('Halal Cart Chicken', 'Halal Cart Chicken', 'halal-cart-chicken', 'Spiced chicken over rice.', true),
('Chopped Cheese', 'Chopped Cheese', 'chopped-cheese', 'Chopped ground beef and cheese sandwich.', true),
('Cronut', 'Cronut', 'cronut', 'Croissant-donut hybrid.', true),
('Egg Cream', 'Egg Cream', 'egg-cream', 'Milk, seltzer, and chocolate syrup.', true),
('Matzah Ball Soup', 'Matzah Ball Soup', 'matzah-ball-soup', 'Soup with dumplings.', true),
('Reuben', 'Reuben', 'reuben', 'Corned beef, swiss cheese, sauerkraut sandwich.', true),
('Hot Dog', 'Hot Dog', 'hot-dog', 'Sausage in a bun.', true),
('Tavern Burger', 'Tavern Burger', 'tavern-burger', 'Classic bar burger.', true),
('General Tso''s', 'General Tso''s', 'general-tsos', 'Deep-fried chicken in sauce.', true),
('Cannoli', 'Cannoli', 'cannoli', 'Italian pastry tube.', true),
('Black and White Cookie', 'Black and White Cookie', 'black-and-white-cookie', 'Cookie with vanilla and chocolate icing.', true),
('Waldorf Salad', 'Waldorf Salad', 'waldorf-salad', 'Fruit and nut salad.', true),
('Eggs Benedict', 'Eggs Benedict', 'eggs-benedict', 'Poached eggs with hollandaise sauce.', true),
('Shakshuka', 'Shakshuka', 'shakshuka', 'Eggs poached in tomato sauce.', true),
('Deli Pickle', 'Deli Pickle', 'deli-pickle', 'Brined cucumber.', false),
('Pretzels', 'Pretzels', 'pretzels', 'Baked dough knot.', true),
('Bacon Egg & Cheese', 'Bacon Egg & Cheese', 'bacon-egg-and-cheese', 'Classic NY breakfast sandwich.', true),
('Dim Sum', 'Dim Sum', 'dim-sum', 'Cantonese bite-sized portions.', true),
('Philly Cheesesteak (NYC-style)', 'Philly Cheesesteak (NYC-style)', 'philly-cheesesteak-nyc', 'Thin steak with melted cheese.', true),
('Street Falafel', 'Street Falafel', 'street-falafel', 'Deep-fried chickpea balls.', true),
('Babka', 'Babka', 'babka', 'Sweet braided bread.', true),
('Knish', 'Knish', 'knish', 'Dough filled with potatoes.', true),
('Eggplant Parm', 'Eggplant Parm', 'eggplant-parm', 'Breaded eggplant with tomato sauce.', true),
('Clam Chowder', 'Clam Chowder', 'clam-chowder', 'Creamy soup with clams.', true),
('Red Sauce Pasta', 'Red Sauce Pasta', 'red-sauce-pasta', 'Classic Italian-American pasta.', true),
('Bagel with Lox', 'Bagel with Lox', 'bagel-with-lox', 'Classic bagel with cream cheese and salmon.', true)
on conflict (slug) do nothing;

insert into public.region_dish_mapping (region_id, dish_id, prevalence)
select r.id, d.id, 'COMMON'
from public.regions r
cross join public.dishes d
where r.slug = 'nyc'
and d.slug in ('pizza-slice', 'bagel', 'pastrami-sandwich', 'cheesecake', 'halal-cart-chicken', 'chopped-cheese', 'cronut', 'egg-cream', 'matzah-ball-soup', 'reuben', 'hot-dog', 'tavern-burger', 'general-tsos', 'cannoli', 'black-and-white-cookie', 'waldorf-salad', 'eggs-benedict', 'shakshuka', 'deli-pickle', 'pretzels', 'bacon-egg-and-cheese', 'dim-sum', 'philly-cheesesteak-nyc', 'street-falafel', 'babka', 'knish', 'eggplant-parm', 'clam-chowder', 'red-sauce-pasta', 'bagel-with-lox')
on conflict (region_id, dish_id) do nothing;
