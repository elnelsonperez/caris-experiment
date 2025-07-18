// Currency conversion utilities
export const EUR_TO_DOP_RATE = 70

export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount
  
  if (fromCurrency === 'EUR' && toCurrency === 'DOP') {
    return amount * EUR_TO_DOP_RATE
  } else if (fromCurrency === 'DOP' && toCurrency === 'EUR') {
    return amount / EUR_TO_DOP_RATE
  }
  
  return amount
}

export function formatPrice(price, currency = 'EUR') {
  const formattedNumber = price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  if (currency === 'EUR') {
    return `€${formattedNumber}`
  } else if (currency === 'DOP') {
    return `$${formattedNumber}`
  }
  return `${formattedNumber}`
}

export function getCurrencySymbol(currency) {
  return currency === 'EUR' ? '€' : '$'
}