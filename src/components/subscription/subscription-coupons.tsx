import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, Calendar, Users, Percent } from 'lucide-react';

// Define the coupon structure based on Stripe data
interface StripeCoupon {
  id: string;
  name: string;
  percentOff: number;
  durationInMonths: number;
  maxRedemptions: number;
  timesRedeemed: number;
  valid: boolean;
  created: string;
  promotionCodes: PromotionCode[];
}

interface PromotionCode {
  id: string;
  code: string;
  active: boolean;
  maxRedemptions?: number;
  timesRedeemed: number;
  expiresAt?: string;
  created: string;
}

// Stripe coupon data from the user's information
const STRIPE_COUPONS: StripeCoupon[] = [
  {
    id: 'vSXmnU2n',
    name: '6 Months Early User Discount',
    percentOff: 50, // Assuming 50% based on context
    durationInMonths: 6,
    maxRedemptions: 1000, // Default max
    timesRedeemed: 0,
    valid: true,
    created: '2025-07-24',
    promotionCodes: [
      {
        id: 'promo_1RopukK970yQiqw5PXeab5Db',
        code: 'DANCEREALMX2025',
        active: true,
        timesRedeemed: 0,
        created: '2025-07-25',
      },
      {
        id: 'promo_1RoVb8K970yQiqw5W',
        code: 'DRX2025',
        active: false,
        timesRedeemed: 0,
        created: '2025-07-24',
      },
    ],
  },
];

export function SubscriptionCoupons() {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<StripeCoupon | null>(null);

  const validateCoupon = async (code: string) => {
    setIsValidating(true);
    
    try {
      // Find coupon by promotion code
      const coupon = STRIPE_COUPONS.find(c => 
        c.promotionCodes.some(pc => 
          pc.code.toLowerCase() === code.toLowerCase() && pc.active
        )
      );

      if (coupon && coupon.valid) {
        setAppliedCoupon(coupon);
        toast({
          title: "Coupon Applied!",
          description: `${coupon.percentOff}% off for ${coupon.durationInMonths} months`,
        });
        return true;
      } else {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is not valid or has expired.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon code.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter Coupon Code",
        description: "Please enter a coupon code to apply.",
        variant: "destructive",
      });
      return;
    }

    await validateCoupon(couponCode.trim());
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your subscription.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Coupon Application Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Apply Coupon Code
          </CardTitle>
          <CardDescription>
            Enter a valid promotion code to get a discount on your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!appliedCoupon ? (
            <div className="flex gap-3">
              <Input
                placeholder="Enter coupon code (e.g., DANCEREALMX2025)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyCoupon();
                  }
                }}
              />
              <Button 
                onClick={handleApplyCoupon}
                disabled={isValidating || !couponCode.trim()}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      {appliedCoupon.name}
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {appliedCoupon.percentOff}% off for {appliedCoupon.durationInMonths} months
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={removeCoupon}>
                  Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Coupons Display */}
      <Card>
        <CardHeader>
          <CardTitle>Available Promotions</CardTitle>
          <CardDescription>
            Current active promotion codes you can use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {STRIPE_COUPONS.map((coupon) => (
              <div key={coupon.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h4 className="font-medium">{coupon.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        {coupon.percentOff}% off
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {coupon.durationInMonths} months
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {coupon.timesRedeemed}/{coupon.maxRedemptions} used
                      </div>
                    </div>
                    
                    {/* Promotion Codes */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Promotion Codes:</p>
                      <div className="flex flex-wrap gap-2">
                        {coupon.promotionCodes.map((promoCode) => (
                          <Badge 
                            key={promoCode.id}
                            variant={promoCode.active ? "default" : "secondary"}
                            className="font-mono"
                          >
                            {promoCode.code}
                            {!promoCode.active && " (Inactive)"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={coupon.valid ? "success" : "destructive"}>
                    {coupon.valid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionCoupons;
