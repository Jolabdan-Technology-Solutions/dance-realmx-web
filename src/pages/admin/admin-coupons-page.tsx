import { Ticket } from "lucide-react";

export default function AdminCouponsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
          <p className="text-gray-400">Manage discount coupons and promotional offers</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center p-20 bg-gray-800 rounded-lg">
        <Ticket className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Coupon System</h2>
        <p className="text-gray-400 text-center max-w-md mb-4">
          This page is currently under development. Coupon management functionality will be available soon.
        </p>
      </div>
    </div>
  );
}