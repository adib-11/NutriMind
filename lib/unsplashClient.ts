/**
 * Unsplash Image Client
 * Fetches food images from Unsplash API with localStorage caching
 * Fallback to category-based placeholder images on failure
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
      name.includes('oat') || name.includes('atta') || name.includes('ruti')) {
    return '/placeholders/grain.jpg';
  }
  
  // Proteins
  if (name.includes('chicken') || name.includes('fish') || name.includes('egg') || 
      name.includes('meat') || name.includes('beef') || name.includes('dal') || 
      name.includes('lentil') || name.includes('masoor') || name.includes('mung')) {
    return '/placeholders/protein.jpg';
  }
  
  // Dairy
  if (name.includes('milk') || name.includes('yogurt') || name.includes('cheese') || 
      name.includes('cream') || name.includes('butter')) {
    return '/placeholders/dairy.jpg';
  }
  
  // Vegetables
  if (name.includes('tomato') || name.includes('potato') || name.includes('onion') || 
      name.includes('spinach') || name.includes('carrot') || name.includes('cabbage') ||
      name.includes('vegetable') || name.includes('sabzi')) {
    return '/placeholders/vegetable.jpg';
  }
  
  // Fruits
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('fruit') || name.includes('mango')) {
    return '/placeholders/fruit.jpg';
  }
  
  // Default fallback
  return '/placeholders/generic-food.jpg';
}

/**
 * Extracts a better search query from complex meal names
 * @param mealName - Full meal name (e.g., "White Rice with Masoor Dal, Aloo Bhorta & Egg Bhaji")
 * @returns Simplified search query (e.g., "rice dal curry")
 */
function extractSearchQuery(mealName: string): string {
  const name = mealName.toLowerCase();
  
  // Extract key food terms from the meal name
  const foodTerms: string[] = [];
  
  // Check for main proteins
  if (name.includes('chicken')) foodTerms.push('chicken');
  if (name.includes('fish') || name.includes('maach')) foodTerms.push('fish');
  if (name.includes('egg') || name.includes('dim')) foodTerms.push('egg');
  if (name.includes('beef') || name.includes('meat')) foodTerms.push('meat');
  if (name.includes('prawn') || name.includes('chingri')) foodTerms.push('prawn');
  
  // Check for main carbs
  if (name.includes('rice') || name.includes('bhat')) foodTerms.push('rice');
  if (name.includes('paratha') || name.includes('roti') || name.includes('naan')) foodTerms.push('flatbread');
  if (name.includes('khichuri')) foodTerms.push('khichuri');
  
  // Check for dal/lentils
  if (name.includes('dal') || name.includes('lentil')) foodTerms.push('dal');
  
  // Check for vegetables
  if (name.includes('aloo') || name.includes('potato')) foodTerms.push('potato');
  if (name.includes('begun') || name.includes('eggplant')) foodTerms.push('eggplant');
  if (name.includes('bhaji') || name.includes('bhorta')) foodTerms.push('curry');
  
  // Check for specific dishes
  if (name.includes('biryani')) return 'biryani rice';
  if (name.includes('curry') || name.includes('tarkari')) foodTerms.push('curry');
  if (name.includes('korma')) return 'korma curry';
  if (name.includes('bhuna')) return 'curry dish';
  
  // If we found specific terms, combine them
  if (foodTerms.length > 0) {
    return foodTerms.slice(0, 3).join(' '); // Use up to 3 terms
  }
  
  // Fallback: extract first meaningful word
  const words = name.replace(/\s*\([^)]*\)/g, '').split(/[,&]/)[0].trim();
  return words || 'food';
}

/**
 * Fetches food image from Unsplash API with localStorage caching
 * @param ingredientName - Name of ingredient/meal (e.g., "Rice", "Chicken Curry")
 * @returns Promise<string> - Image URL or placeholder path
 */
export async function getIngredientImage(ingredientName: string): Promise<string> {
  // Runtime check for missing API key
  if (!process.env.NEXT_PUBLIC_UNSPLASH_KEY) {
    console.warn('[unsplashClient] Unsplash API key not configured - using placeholders');
    return getCategoryPlaceholder(ingredientName);
  }

  // Simplify ingredient name for better search results (remove qualifiers in parentheses)
  const simplifiedName = ingredientName.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Check localStorage cache first (use original name for cache key)
  const cacheKey = `img_${simplifiedName}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log('[unsplashClient] Cache hit:', cacheKey);
      return cached;
    }
  } catch (e) {
    console.warn('[unsplashClient] localStorage not available:', e);
    return getCategoryPlaceholder(ingredientName);
  }

  // Extract better search query for complex meal names
  const searchQuery = extractSearchQuery(simplifiedName);
  
  // Fetch from Unsplash API
  try {
    console.log('[unsplashClient] Fetching image for:', simplifiedName, '→ query:', searchQuery);
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery + ' food')}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_KEY}`
        }
      }
    );

    console.log('[unsplashClient] API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].urls.small;
        
        // Cache successful result
        try {
          localStorage.setItem(cacheKey, imageUrl);
          console.log('[unsplashClient] Cached image for:', simplifiedName);
        } catch (e) {
          console.warn('[unsplashClient] Failed to cache image:', e);
        }
        
        return imageUrl;
      } else {
        console.log('[unsplashClient] No results found for:', searchQuery);
      }
    } else {
      console.warn('[unsplashClient] API request failed:', response.status);
    }
  } catch (error) {
    console.error('[unsplashClient] Error fetching image:', error);
  }

  // Fallback to category placeholder
  console.log('[unsplashClient] Using category placeholder for:', simplifiedName);
  return getCategoryPlaceholder(ingredientName);
}
