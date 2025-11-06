/**
 * Formats ingredient quantity with optional cup equivalents
 * for common Bangladeshi ingredients.
 * 
 * @param quantity - Numeric quantity (e.g., 200)
 * @param unit - Unit type (e.g., "g", "piece", "ml", "kg", "litre", "bundle", "100g")
 * @param ingredientName - Ingredient name for cup mapping (e.g., "Rice (Miniket)")
 * @returns Formatted string (e.g., "200g (approx 1 cup)")
 */
export default function formatQuantity(
  quantity: number,
  unit: string,
  ingredientName: string
): string {
  // Cup mappings for common Bangladeshi ingredients (grams per cup)
  const cupMappings: Record<string, number> = {
    'rice': 200,    // 1 cup cooked rice
    'oats': 80,     // 1 cup oats
    'flour': 120,   // 1 cup all-purpose flour
    'atta': 120,    // 1 cup whole wheat flour (same as flour)
    'lentil': 200,  // 1 cup cooked lentils
    'dal': 200,     // 1 cup cooked dal
  };

  // Normalize ingredient name for matching
  const ingredientLower = ingredientName.toLowerCase();

  // Helper function to format fractional cups
  const formatCups = (cups: number): string => {
    // Round to 2 decimal places to handle floating point precision
    const roundedCups = Math.round(cups * 100) / 100;
    
    // Check for common fractional values (with small tolerance for floating point)
    if (Math.abs(roundedCups - 0.25) < 0.01) return '¼ cup';
    if (Math.abs(roundedCups - 0.5) < 0.01) return '½ cup';
    if (Math.abs(roundedCups - 0.75) < 0.01) return '¾ cup';
    if (Math.abs(roundedCups - 1.0) < 0.05) return '1 cup'; // Slightly larger tolerance for 1 cup
    
    // For other values, show decimal
    return roundedCups % 1 === 0 ? `${roundedCups.toFixed(0)} cups` : `${roundedCups.toFixed(1)} cups`;
  };

  // Helper function to find cup mapping for ingredient
  const getCupMapping = (): number | null => {
    // Check for dal first (more specific than lentil)
    if (ingredientLower.includes('dal')) return cupMappings['dal'];
    
    // Check other mappings
    for (const [key, value] of Object.entries(cupMappings)) {
      if (ingredientLower.includes(key)) {
        return value;
      }
    }
    return null;
  };

  // Handle piece units
  if (unit === 'piece') {
    return quantity === 1 ? '1 piece' : `${quantity} pieces`;
  }

  // Handle bundle units
  if (unit === 'bundle') {
    return quantity === 1 ? '1 bundle' : `${quantity} bundles`;
  }

  // Handle 100g unit
  if (unit === '100g') {
    return '100g';
  }

  // Handle grams
  if (unit === 'g') {
    const cupMapping = getCupMapping();
    if (cupMapping && quantity >= 50) {
      const cups = quantity / cupMapping;
      const cupText = formatCups(cups);
      return `${quantity}g (approx ${cupText})`;
    }
    return `${quantity}g`;
  }

  // Handle kilograms (convert to grams)
  if (unit === 'kg') {
    const gramsQuantity = quantity * 1000;
    const cupMapping = getCupMapping();
    if (cupMapping && gramsQuantity >= 50) {
      const cups = gramsQuantity / cupMapping;
      const cupText = formatCups(cups);
      return `${gramsQuantity}g (approx ${cupText})`;
    }
    return `${gramsQuantity}g`;
  }

  // Handle milliliters
  if (unit === 'ml') {
    if (quantity >= 240) {
      const cups = quantity / 240; // Standard cup is 240ml
      const cupText = formatCups(cups);
      return `${quantity}ml (approx ${cupText})`;
    }
    return `${quantity}ml`;
  }

  // Handle litres (convert to ml)
  if (unit === 'litre') {
    const mlQuantity = quantity * 1000;
    if (mlQuantity >= 240) {
      const cups = mlQuantity / 240;
      const cupText = formatCups(cups);
      return `${mlQuantity}ml (approx ${cupText})`;
    }
    return `${mlQuantity}ml`;
  }

  // Fallback for unknown units
  return `${quantity} ${unit}`;
}
