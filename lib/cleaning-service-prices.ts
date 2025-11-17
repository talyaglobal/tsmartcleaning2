/**
 * Pricing configuration based on "Comprehensive Price List for Popular Cleaning Services (Residential and Corporate)"
 * Source: public/prompt/Comprehensive Price List for Popular Cleaning Services (Residential and Corporate).md
 * 
 * Prices are national averages and may vary based on location, property size, frequency, and other factors.
 */

export interface ServicePriceConfig {
  average: number
  low: number
  high: number
  unit: 'per_hour' | 'per_sqft' | 'flat_rate'
  notes?: string
}

export const CLEANING_SERVICE_PRICES: Record<string, ServicePriceConfig> = {
  // Residential Services
  'residential_standard_hourly': {
    average: 47,
    low: 20,
    high: 75,
    unit: 'per_hour',
    notes: 'Varies by location and experience. Lower end for independent cleaners, higher for agencies.'
  },
  'residential_standard_flat': {
    average: 175,
    low: 100,
    high: 250,
    unit: 'flat_rate',
    notes: 'Average range for a standard-sized home (e.g., 1,500-2,500 sq. ft., 3 bed, 2 bath).'
  },
  'residential_deep': {
    average: 350,
    low: 250,
    high: 450,
    unit: 'flat_rate',
    notes: 'Significantly higher due to extra time and detail required.'
  },
  'residential_move': {
    average: 350,
    low: 300,
    high: 400,
    unit: 'flat_rate',
    notes: 'Includes cleaning inside cabinets, appliances, and walls.'
  },
  
  // Commercial Services
  'commercial_per_sqft': {
    average: 0.14,
    low: 0.08,
    high: 0.20,
    unit: 'per_sqft',
    notes: 'Common pricing model for commercial spaces. Varies based on frequency and facility type.'
  },
  'commercial_hourly': {
    average: 27,
    low: 20,
    high: 35,
    unit: 'per_hour',
    notes: 'Used for smaller jobs or specialized tasks.'
  },
  'commercial_flat': {
    average: 220,
    low: 140,
    high: 300,
    unit: 'flat_rate',
    notes: 'Typical range for a small to medium office (e.g., 2,000 sq. ft.).'
  }
}

/**
 * Maps service category and name to pricing configuration
 * This function helps match database services to the pricing guide
 */
export function getServicePrice(
  category: string,
  serviceName: string,
  unit?: string
): ServicePriceConfig | null {
  const nameLower = serviceName.toLowerCase()
  const categoryLower = category.toLowerCase()
  
  // Deep cleaning - can be residential or commercial, but pricing guide shows residential pricing
  if (categoryLower === 'deep' || nameLower.includes('deep')) {
    return CLEANING_SERVICE_PRICES.residential_deep
  }
  
  // Move-in/out cleaning - typically residential
  if (categoryLower === 'move' || nameLower.includes('move-in') || nameLower.includes('move-out') || nameLower.includes('move in') || nameLower.includes('move out')) {
    return CLEANING_SERVICE_PRICES.residential_move
  }
  
  // Residential services
  if (categoryLower === 'residential' || categoryLower === 'eco-friendly') {
    // Check if it's a standard/regular cleaning service
    if (nameLower.includes('standard') || nameLower.includes('regular') || nameLower.includes('house') || nameLower.includes('home')) {
      // Use flat rate if unit is flat_rate, otherwise hourly
      if (unit === 'flat_rate') {
        return CLEANING_SERVICE_PRICES.residential_standard_flat
      }
      return CLEANING_SERVICE_PRICES.residential_standard_hourly
    }
    // Default to standard hourly for residential
    return CLEANING_SERVICE_PRICES.residential_standard_hourly
  }
  
  // Commercial services
  if (categoryLower === 'commercial') {
    // Per square foot pricing
    if (unit === 'per_sqft') {
      return CLEANING_SERVICE_PRICES.commercial_per_sqft
    }
    // Flat rate for offices or when unit is flat_rate
    if (unit === 'flat_rate' || nameLower.includes('office') || nameLower.includes('small office') || nameLower.includes('medium office')) {
      return CLEANING_SERVICE_PRICES.commercial_flat
    }
    // Default to hourly for commercial
    return CLEANING_SERVICE_PRICES.commercial_hourly
  }
  
  // Post-construction, window, carpet - check name and unit to determine pricing
  if (categoryLower === 'post-construction' || categoryLower === 'window' || categoryLower === 'carpet') {
    // If it's a commercial context (check name for commercial indicators)
    if (nameLower.includes('commercial') || nameLower.includes('office') || nameLower.includes('corporate')) {
      if (unit === 'per_sqft') {
        return CLEANING_SERVICE_PRICES.commercial_per_sqft
      }
      if (unit === 'flat_rate') {
        return CLEANING_SERVICE_PRICES.commercial_flat
      }
      return CLEANING_SERVICE_PRICES.commercial_hourly
    }
    // Otherwise treat as residential
    if (unit === 'flat_rate') {
      return CLEANING_SERVICE_PRICES.residential_standard_flat
    }
    return CLEANING_SERVICE_PRICES.residential_standard_hourly
  }
  
  return null
}

/**
 * Gets the average price for a service based on category and name
 * Returns the average price from the pricing guide, or null if not found
 */
export function getAverageServicePrice(
  category: string,
  serviceName: string,
  unit?: string
): number | null {
  const priceConfig = getServicePrice(category, serviceName, unit)
  return priceConfig?.average ?? null
}

