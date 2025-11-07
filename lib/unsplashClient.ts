/**
 * Unsplash Image Client
 * For MVP: Using category-based placeholders only for better Bangladeshi food representation
 * Future: Can integrate with Pexels API or custom food image database
 */

/**
 * Returns category-based placeholder image path
 * @param ingredientName - Name of ingredient/meal to categorize
 * @returns string - Placeholder image path
 */
function getCategoryPlaceholder(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  
  // Grains
  if (name.includes('rice') || name.includes('flour') || name.includes('bread') || 
      name.includes('oat') || name.includes('atta') || name.includes('ruti') ||
      name.includes('paratha') || name.includes('luchi') || name.includes('puri') ||
      name.includes('khichuri') || name.includes('biryani') || name.includes('pulao') ||
      name.includes('muri') || name.includes('chira')) {
    return '/placeholders/grain.jpg';
  }
  
  // Proteins
  if (name.includes('chicken') || name.includes('fish') || name.includes('egg') || 
      name.includes('meat') || name.includes('beef') || name.includes('dal') || 
      name.includes('lentil') || name.includes('masoor') || name.includes('mung') ||
      name.includes('maach') || name.includes('dim') || name.includes('murgi') ||
      name.includes('rui') || name.includes('ilish') || name.includes('chingri') ||
      name.includes('prawn') || name.includes('mutton') || name.includes('booter')) {
    return '/placeholders/protein.jpg';
  }
  
  // Dairy
  if (name.includes('milk') || name.includes('yogurt') || name.includes('cheese') || 
      name.includes('cream') || name.includes('butter') || name.includes('doi') ||
      name.includes('paneer') || name.includes('ghee')) {
    return '/placeholders/dairy.jpg';
  }
  
  // Vegetables
  if (name.includes('tomato') || name.includes('potato') || name.includes('onion') || 
      name.includes('spinach') || name.includes('carrot') || name.includes('cabbage') ||
      name.includes('vegetable') || name.includes('sabzi') || name.includes('aloo') ||
      name.includes('begun') || name.includes('lau') || name.includes('gourd') ||
      name.includes('kakrol') || name.includes('shak') || name.includes('bhaji') ||
      name.includes('bhorta') || name.includes('posto') || name.includes('peyaj')) {
    return '/placeholders/vegetable.jpg';
  }
  
  // Fruits
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('fruit') || name.includes('mango') || name.includes('aam') ||
      name.includes('kola') || name.includes('papaya')) {
    return '/placeholders/fruit.jpg';
  }
  
  // Default fallback
  return '/placeholders/generic-food.jpg';
}

/**
 * Gets food image - Currently using placeholders for MVP
 * @param ingredientName - Name of ingredient/meal (e.g., "Rice", "Chicken Curry")
 * @returns Promise<string> - Placeholder image path
 */
export async function getIngredientImage(ingredientName: string): Promise<string> {
  // MVP: Use category-based placeholders for better Bangladeshi food representation
  // Unsplash doesn't have good results for local cuisine (jhalmuri, posto, lau, etc.)
  
  console.log('[unsplashClient] Using category placeholder for:', ingredientName);
  return getCategoryPlaceholder(ingredientName);
}
