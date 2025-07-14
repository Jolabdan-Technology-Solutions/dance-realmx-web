// Stripe configuration
export const STRIPE_CONFIG = {
  // Get the publishable key from environment variables
  publishableKey:
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here",

  // Stripe Elements appearance options
  appearance: {
    theme: "stripe",
    variables: {
      colorPrimary: "#0f172a",
      colorBackground: "#ffffff",
      colorText: "#0f172a",
      colorDanger: "#ef4444",
      fontFamily: "Inter, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  },

  // Card element options
  cardElementOptions: {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  },
};

// Helper function to load Stripe
export const loadStripeConfig = () => {
  if (
    !STRIPE_CONFIG.publishableKey ||
    STRIPE_CONFIG.publishableKey === "pk_test_your_key_here"
  ) {
    console.warn(
      "Stripe publishable key not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables."
    );
  }

  return STRIPE_CONFIG;
};
