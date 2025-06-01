import { useState, useEffect, useContext } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthContext } from "@/hooks/use-auth";

interface PricingPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  priceMonthly: string;
  priceYearly: string;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  isPopular: boolean | null;
  isActive: boolean | null;
}

function PricingWithAuth() {
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  // Try to get the auth context, but don't throw an error if it's not available
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  
  const { data: plans = [] } = useQuery<PricingPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });
  
  const handlePlanClick = (planId: number) => {
    // If user is not logged in, redirect to auth page first
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    
    // Otherwise, go to subscription page with the plan selected
    window.location.href = `/subscription?plan=${planId}&cycle=${billingCycle}`;
  };
  
  const getAnnualSavings = (monthly: string, yearly: string) => {
    const monthlyPrice = parseFloat(monthly);
    const yearlyPrice = parseFloat(yearly) / 12; // monthly equivalent of yearly price
    const savings = ((monthlyPrice - yearlyPrice) / monthlyPrice) * 100;
    return Math.round(savings);
  };
  
  return (
    <div className="bg-dark text-white">
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Transparent Pricing for Dance Educators</h1>
            <p className="text-xl text-gray-300 mb-8">Choose the plan that works best for your dance teaching journey</p>
            
            <Tabs defaultValue={billingCycle} onValueChange={setBillingCycle} className="mx-auto max-w-xs">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
              <p className="mt-2 text-sm text-gray-400">
                {billingCycle === "yearly" ? "Save up to 20% with annual billing" : "Switch to yearly for better rates"}
              </p>
            </Tabs>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans
              .filter(plan => plan.isActive)
              .sort((a, b) => {
                // Free plan first, then sort by price
                if (a.slug === "free") return -1;
                if (b.slug === "free") return 1;
                return parseFloat(a.priceMonthly) - parseFloat(b.priceMonthly);
              })
              .map((plan) => {
                const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
                const savingsPercent = getAnnualSavings(plan.priceMonthly, plan.priceYearly);
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`border rounded-xl overflow-hidden ${plan.isPopular ? 'border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.3)]' : 'border-gray-700'}`}
                  >
                    <CardHeader className={`${plan.isPopular ? 'bg-gradient-to-r from-[#00d4ff]/20 to-transparent' : ''}`}>
                      {plan.isPopular && (
                        <span className="bg-[#00d4ff] text-black px-3 py-1 rounded-full text-xs font-medium mb-2 inline-block">
                          Most Popular
                        </span>
                      )}
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-gray-400 ml-1">
                          {billingCycle === "monthly" ? "/month" : "/year"}
                        </span>
                        
                        {billingCycle === "yearly" && plan.slug !== "free" && (
                          <p className="text-sm text-[#00d4ff] mt-1">Save {savingsPercent}% with annual billing</p>
                        )}
                      </div>
                      
                      <ul className="space-y-3">
                        {plan.features && plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="text-green-400 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        
                        {/* Add a few consistent features for all plans */}
                        {plan.slug === "free" && (
                          <>
                            <li className="flex items-start text-gray-400">
                              <X className="text-gray-400 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Access to certification courses</span>
                            </li>
                            <li className="flex items-start text-gray-400">
                              <X className="text-gray-400 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                              <span>Premium teaching resources</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className={`w-full rounded-full ${
                          plan.isPopular 
                            ? 'bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90' 
                            : plan.slug === "free" 
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                        onClick={() => handlePlanClick(plan.id)}
                      >
                        {plan.slug === "free" ? "Get Started" : "Subscribe Now"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
          
          <div className="mt-16 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold mb-2">What is included in the Free plan?</h3>
                <p className="text-gray-300">The Free plan allows you to explore the platform, access basic teaching resources, and connect with the dance community. Premium features require a paid subscription.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Can I change my plan later?</h3>
                <p className="text-gray-300">Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes to your subscription will take effect at the end of your current billing cycle.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Is there a refund policy?</h3>
                <p className="text-gray-300">We offer a 14-day money-back guarantee on all new subscriptions. If you're not satisfied, contact our support team for a full refund within this period.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Do you offer team or studio discounts?</h3>
                <p className="text-gray-300">Yes, we offer special pricing for dance studios with multiple educators. Contact us directly to discuss your requirements and receive a customized quote.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return <PricingWithAuth />;
}