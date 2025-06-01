import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Plus } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  features: string[] | null;
  priceMonthly: string;
  priceYearly: string;
  isPopular: boolean | null;
}

export default function PricingPreview() {
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: [API_ENDPOINTS.SUBSCRIPTION_PLANS.BASE],
  });

  return (
    <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Pricing & Membership</h2>
          <div className="w-24 h-1 bg-[#00d4ff] mx-auto my-6"></div>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Choose the plan that best fits your needs and take your dance education to the next level
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.slice(0, 4).map((plan) => (
            <Card 
              key={plan.id} 
              className={`flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                plan.isPopular ? 'border-2 border-[#00d4ff] shadow-lg relative overflow-hidden' : 'border'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[#00d4ff] text-white text-xs font-bold py-1 px-3 transform rotate-45 translate-x-6 translate-y-3">
                    POPULAR
                  </div>
                </div>
              )}
              <CardHeader className={`${plan.isPopular ? 'bg-gradient-to-r from-[#e6f8ff] to-[#f0fcff]' : 'bg-white'} text-gray-800`}>
                <CardTitle className="text-2xl text-center">
                  {plan.name}
                </CardTitle>
                <div className="text-center mt-4">
                  <span className="text-4xl font-bold text-gray-800">${plan.priceMonthly}</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6 bg-white">
                <ul className="space-y-3">
                  {plan.features?.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {(plan.features?.length || 0) > 3 && (
                    <li className="flex items-center text-[#00d4ff] font-medium">
                      <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{(plan.features?.length || 0) - 3} more features</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter className="pb-6 pt-2 bg-white">
                <Link href="/subscription" className="w-full">
                  <button 
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      plan.isPopular 
                        ? 'bg-[#00d4ff] hover:bg-[#00bce0] text-white shadow-md hover:shadow-lg' 
                        : 'border-2 border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-white'
                    }`}
                  >
                    {plan.isPopular ? 'Get Started Now' : 'Choose Plan'}
                  </button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/pricing">
            <button className="inline-flex items-center px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200">
              View All Plans
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}