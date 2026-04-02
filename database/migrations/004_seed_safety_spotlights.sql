-- Seed safety_spotlights from product copy (vault/product/01-discovery/SPOTLIGHT_CONTENT.md)
-- Run after 003_add_safety_spotlights.sql

INSERT INTO public.safety_spotlights (region_slug, title, content, category, priority, is_active)
VALUES
  ('tokyo', 'The hidden dashi', 'Many "vegetable" soups use bonito (fish) dashi. Always ask "Dashi wa sakana desu ka?" (Is the dashi fish-based?).', 'Risk', 5, true),
  ('tokyo', 'Tempura oils', 'Some budget tempura spots use mixed vegetable oils that may include cheap soybean oil.', 'Risk', 3, true),
  ('tokyo', 'Soy sauce sensitivity', 'Authentic shoyu is wheat-based. Look for tamari (wheat-free soy sauce) at upscale venues.', 'Risk', 4, true),
  ('tokyo', 'The kaiseki trap', 'High-end set meals often change menus daily; ingredient lists are rarely printed. Always call 24h ahead.', 'Tip', 2, true),
  ('tokyo', 'Sesame everywhere', 'Sesame oil is used as a finish in almost every noodle dish.', 'Risk', 3, true),
  ('bangkok', 'Nam Pla risk', 'Fish sauce is in ~90% of local dishes. It is the #1 source of undeclared seafood allergens.', 'Risk', 5, true),
  ('bangkok', 'The "no nut" phrase', '"Mai sai tua" (no peanuts). Repeat twice; street vendors often forget.', 'Phrase', 5, true),
  ('bangkok', 'Street wok sharing', 'Woks are rarely cleaned between orders. If your allergy is airborne or severe, avoid open-kitchen street stalls.', 'Risk', 4, true),
  ('bangkok', 'Coconut milk', 'Often thickened with peanut paste in curries to add richness.', 'Risk', 2, true),
  ('bangkok', 'Shrimp paste', 'Found in most mild curries. It is a hidden seafood allergen.', 'Risk', 4, true),
  ('delhi', 'Ghee quality', 'Many low-cost vendors use mixed vegetable fats (dalda) which may contain milk solids or soy.', 'Risk', 2, true),
  ('delhi', 'The masala mystery', 'Spice blends are often prepared in communal mills. Cross-contamination with mustard seeds is common.', 'Risk', 4, true),
  ('delhi', 'Yogurt and curd', 'Often used as a base for marinades. Always verify if the vegan dish was pre-marinated in yogurt.', 'Risk', 3, true),
  ('delhi', 'Nut-based thickeners', 'Cashew paste is the standard thickener for kormas.', 'Risk', 4, true),
  ('delhi', 'Cross-contact', 'Traditional tandoors are used for both meat (dairy-marinated) and bread (often contains dairy or ghee).', 'Risk', 3, true),
  ('nyc', 'The gluten-free label', 'NY law requires menus to list allergens, but cross-contamination is not legally regulated. Always state "severe allergy" explicitly.', 'Tip', 5, true),
  ('nyc', 'Bakery protocols', 'Most bagels contain barley malt (gluten). Verify specifically for gluten-free labeled bread.', 'Risk', 3, true),
  ('nyc', 'Soy in vegan spots', 'NYC vegan cuisine relies heavily on soy and seitan.', 'Risk', 2, true),
  ('nyc', 'Sesame law', 'NYC has strict allergen laws—use the city''s mandatory allergen icons on menus as a baseline.', 'Tip', 4, true),
  ('nyc', 'Tipping for clarity', 'If you have a severe allergy, mentioning it to the server and tipping on top often gets the kitchen to take it more seriously.', 'Tip', 1, true);
