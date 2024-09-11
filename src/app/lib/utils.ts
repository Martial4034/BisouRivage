import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Formatte un prix en fonction de la localisation et de la devise
 * @param price - Le prix sous forme de nombre ou chaîne
 * @param locale - Localisation pour le format (par défaut 'fr-FR')
 * @param currency - Devise pour le format (par défaut 'EUR')
 * @returns - Le prix formaté avec la devise
 */
export function formatPrice(price: string | number, locale = 'fr-FR', currency = 'EUR') {
  // Si le prix est une chaîne, on la convertit en nombre
  const parsedPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Si la conversion échoue, retourne un format par défaut
  if (isNaN(parsedPrice)) {
    return 'N/A';
  }

  // Utilisation de Intl pour formater le prix selon la localisation et la devise
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(parsedPrice);
}
