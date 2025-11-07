/**
 * Food Image Client
 * Loads images from static database (meal-images.json)
 * Falls back to category-based placeholders
 */

import mealImagesData from '@/data/meal-images.json';

interface ImageMapping {
  meal_id?: string;
  ingredient_id?: string;
  image_url: string;
  alt_text: string;
}

interface ImageDatabase {
  meal_images: ImageMapping[];
  ingredient_images: ImageMapping[];
}

const imageDB = mealImagesData as ImageDatabase;

/**
 * Returns category-based default image
 * @param name - Name of meal/ingredient to categorize
 * @returns string - Default image ID
 */
function getCategoryDefault(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Grains
  if (lowerName.includes('rice') || lowerName.includes('flour') || lowerName.includes('bread') || 
      lowerName.includes('paratha') || lowerName.includes('luchi') || lowerName.includes('puri') ||
      lowerName.includes('khichuri') || lowerName.includes('biryani') || lowerName.includes('muri') ||
      lowerName.includes('chira') || lowerName.includes('atta') || lowerName.includes('ruti')) {
    return 'DEFAULT_GRAIN';
  }
  
  // Proteins
  if (lowerName.includes('chicken') || lowerName.includes('fish') || lowerName.includes('egg') || 
      lowerName.includes('meat') || lowerName.includes('beef') || lowerName.includes('dal') || 
      lowerName.includes('lentil') || lowerName.includes('maach') || lowerName.includes('dim') ||
      lowerName.includes('murgi') || lowerName.includes('rui') || lowerName.includes('ilish') ||
      lowerName.includes('chingri') || lowerName.includes('prawn') || lowerName.includes('mutton')) {
    return 'DEFAULT_PROTEIN';
  }
  
  // Dairy
  if (lowerName.includes('milk') || lowerName.includes('yogurt') || lowerName.includes('cheese') || 
      lowerName.includes('cream') || lowerName.includes('butter') || lowerName.includes('doi') ||
      lowerName.includes('paneer') || lowerName.includes('ghee')) {
    return 'DEFAULT_DAIRY';
  }
  
  // Vegetables
  if (lowerName.includes('vegetable') || lowerName.includes('sabzi') || lowerName.includes('aloo') ||
      lowerName.includes('begun') || lowerName.includes('lau') || lowerName.includes('gourd') ||
      lowerName.includes('kakrol') || lowerName.includes('shak') || lowerName.includes('bhaji') ||
      lowerName.includes('bhorta') || lowerName.includes('posto') || lowerName.includes('potato') ||
      lowerName.includes('tomato') || lowerName.includes('onion') || lowerName.includes('spinach')) {
    return 'DEFAULT_VEGETABLE';
  }
  
  // Fruits
  if (lowerName.includes('fruit') || lowerName.includes('mango') || lowerName.includes('banana') ||
      lowerName.includes('apple') || lowerName.includes('orange') || lowerName.includes('aam') ||
      lowerName.includes('kola') || lowerName.includes('papaya')) {
    return 'DEFAULT_FRUIT';
  }
  
  return 'DEFAULT';
}

/**
 * Gets meal image from static database
 * @param mealId - Meal ID (e.g., "MEAL_001")
 * @param mealName - Meal name for fallback categorization
 * @returns Object with image_url and alt_text
 */
export function getMealImage(mealId: string, mealName: string): { image_url: string; alt_text: string } {
  // Try to find exact meal match
  const exactMatch = imageDB.meal_images.find(img => img.meal_id === mealId);
  if (exactMatch) {
    return { image_url: exactMatch.image_url, alt_text: exactMatch.alt_text };
  }
  
  // Fallback to category default
  const categoryId = getCategoryDefault(mealName);
  const categoryMatch = imageDB.meal_images.find(img => img.meal_id === categoryId);
  if (categoryMatch) {
    return { image_url: categoryMatch.image_url, alt_text: mealName };
  }
  
  // Final fallback
  const defaultImg = imageDB.meal_images.find(img => img.meal_id === 'DEFAULT');
  return { image_url: defaultImg?.image_url || '/placeholders/generic-food.jpg', alt_text: mealName };
}

/**
 * Gets ingredient image from static database
 * @param ingredientId - Ingredient ID (e.g., "ING_001")
 * @param ingredientName - Ingredient name for fallback categorization
 * @returns Object with image_url and alt_text
 */
export function getIngredientImage(ingredientId: string, ingredientName: string): { image_url: string; alt_text: string } {
  // Try to find exact ingredient match
  const exactMatch = imageDB.ingredient_images.find(img => img.ingredient_id === ingredientId);
  if (exactMatch) {
    return { image_url: exactMatch.image_url, alt_text: exactMatch.alt_text };
  }
  
  // Fallback to category default
  const categoryId = getCategoryDefault(ingredientName);
  const categoryMatch = imageDB.ingredient_images.find(img => img.ingredient_id === categoryId);
  if (categoryMatch) {
    return { image_url: categoryMatch.image_url, alt_text: ingredientName };
  }
  
  // Final fallback
  const defaultImg = imageDB.ingredient_images.find(img => img.ingredient_id === 'DEFAULT');
  return { image_url: defaultImg?.image_url || '/placeholders/generic-food.jpg', alt_text: ingredientName };
}
