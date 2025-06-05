import { apiRequest } from "@/lib/queryClient";

describe("Environment Configuration Tests", () => {
  test("API URL is configured", () => {
    expect(process.env.VITE_API_URL).toBeDefined();
    expect(process.env.VITE_API_URL).toMatch(/^https?:\/\/.+/);
  });

  test("Frontend URL is configured", () => {
    expect(process.env.VITE_FRONTEND_URL).toBeDefined();
    expect(process.env.VITE_FRONTEND_URL).toMatch(/^https?:\/\/.+/);
  });

  test("API endpoints are accessible", async () => {
    try {
      // Test subscription plans endpoint
      const plansResponse = await fetch(`${process.env.VITE_API_URL}/api/subscriptions/plans`);
      expect(plansResponse.ok).toBe(true);
      const plans = await plansResponse.json();
      expect(Array.isArray(plans)).toBe(true);

      // Test features endpoint (requires authentication)
      const featuresResponse = await fetch(`${process.env.VITE_API_URL}/api/users/features`);
      // Should either be 401 (unauthorized) or 200 (authorized)
      expect([200, 401]).toContain(featuresResponse.status);
    } catch (error) {
      console.error("API test failed:", error);
      throw error;
    }
  }, 10000); // Increase timeout to 10 seconds for real API calls
}); 