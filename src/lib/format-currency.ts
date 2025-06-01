/**
 * Formats a number as a currency string
 * @param amount - The amount to format
 * @param currencyCode - The currency code to use (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCode = "USD"
): string {
  // Handle undefined or null
  if (amount === undefined || amount === null) {
    return "$0.00";
  }
  
  // Clean string values - remove any non-numeric characters except decimal point
  let cleanAmount: string;
  
  if (typeof amount === "string") {
    // Remove any non-numeric characters except decimal point
    cleanAmount = amount.replace(/[^0-9.]/g, '');
  } else {
    // Convert number to string
    cleanAmount = amount.toString();
  }
  
  // Try to parse the cleaned amount
  const numericAmount = parseFloat(cleanAmount);
  
  // Check if parsing was successful
  if (isNaN(numericAmount)) {
    return "$0.00";
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}