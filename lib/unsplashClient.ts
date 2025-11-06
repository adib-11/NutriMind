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
  
  // Check localStorage cache first
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

  // Fetch from Unsplash API
  try {
    console.log('[unsplashClient] Fetching image for:', simplifiedName);
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(simplifiedName)}&per_page=1&orientation=landscape`,
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
        console.log('[unsplashClient] No results found for:', simplifiedName);
      }
    } else {
      console.warn('[unsplashClient] API request failed:', response.status);
    }
  } catch (error) {
    console.error('[unsplashClient] Error fetching image:', error);
  }

  // Fallback to category placeholder
  return getCategoryPlaceholder(ingredientName);
}
