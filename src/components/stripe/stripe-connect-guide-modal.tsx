import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  Link as LinkIcon, 
  DollarSign, 
  User, 
  CreditCard, 
  Building, 
  FileText,
  ChevronRight,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface StripeConnectGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function StripeConnectGuideModal({ 
  isOpen, 
  onClose,
  onContinue 
}: StripeConnectGuideModalProps) {
  const [tab, setTab] = useState("overview");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] dark:bg-gray-950 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Stripe Connect Setup Guide</DialogTitle>
          <DialogDescription>
            Learn how to set up Stripe Connect to receive payments for your curriculum resources
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="steps">Setup Steps</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="overview" className="space-y-6">
              <div className="dark:bg-blue-950 bg-blue-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold dark:text-white text-blue-900 mb-4">Welcome to Stripe Connect</h3>
                <p className="dark:text-blue-100 text-blue-800 mb-4">
                  Stripe Connect allows you to receive payments directly to your bank account for your curriculum resources sold on DanceRealmX.
                </p>
                <p className="dark:text-blue-100 text-blue-800 mb-4">
                  With Stripe Connect, you can:
                </p>
                <ul className="list-disc pl-6 dark:text-blue-100 text-blue-800 mb-4 space-y-2">
                  <li>Receive payments directly to your bank account</li>
                  <li>Track your earnings and payouts</li>
                  <li>Manage your payment settings</li>
                  <li>Accept payments from customers worldwide</li>
                </ul>
                <p className="dark:text-blue-100 text-blue-800">
                  The setup process is quick and can be completed within our application. You'll need to provide business information and connect your bank account.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <LinkIcon className="w-8 h-8 dark:text-blue-400 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium">Connected Account</h4>
                  </div>
                  <p className="dark:text-gray-300 text-gray-700">
                    DanceRealmX uses Stripe Connect to link your Stripe account with our platform, allowing us to process payments on your behalf.
                  </p>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <DollarSign className="w-8 h-8 dark:text-green-400 text-green-600 mr-3" />
                    <h4 className="text-lg font-medium">Direct Payouts</h4>
                  </div>
                  <p className="dark:text-gray-300 text-gray-700">
                    Payments go directly to your bank account. You maintain control over your funds and can set up automatic payouts.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setTab("requirements")} className="space-x-1">
                  <span>Continue to Requirements</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-6">
              <div className="dark:bg-amber-950 bg-amber-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold dark:text-white text-amber-900 mb-4">Before You Begin</h3>
                <p className="dark:text-amber-100 text-amber-800 mb-4">
                  To set up Stripe Connect, you'll need to have the following information ready:
                </p>
                <div className="dark:bg-amber-900 bg-amber-200 p-3 rounded-md">
                  <p className="font-medium text-sm dark:text-amber-100 text-amber-800">
                    <strong>Important Note for Platform Owners:</strong> The Stripe account used for this platform must have Stripe Connect enabled in the Stripe Dashboard. If you're getting an error when setting up Connect, the platform owner needs to enable Connect features in the Stripe Dashboard first.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <User className="w-6 h-6 dark:text-blue-400 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium">Personal Information</h4>
                  </div>
                  <ul className="space-y-2 dark:text-gray-300 text-gray-700">
                    <li>• Legal name</li>
                    <li>• Date of birth</li>
                    <li>• Home address</li>
                    <li>• Phone number</li>
                    <li>• Email address</li>
                    <li>• Last 4 digits of SSN (US only)</li>
                  </ul>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Building className="w-6 h-6 dark:text-blue-400 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium">Business Information</h4>
                  </div>
                  <ul className="space-y-2 dark:text-gray-300 text-gray-700">
                    <li>• Business name (if applicable)</li>
                    <li>• Business type (individual, LLC, etc.)</li>
                    <li>• Business address</li>
                    <li>• Business website (if available)</li>
                    <li>• EIN/Tax ID (for businesses)</li>
                  </ul>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <CreditCard className="w-6 h-6 dark:text-blue-400 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium">Banking Information</h4>
                  </div>
                  <ul className="space-y-2 dark:text-gray-300 text-gray-700">
                    <li>• Bank account number</li>
                    <li>• Routing number</li>
                    <li>• Account type (checking or savings)</li>
                    <li>• Bank name</li>
                  </ul>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <FileText className="w-6 h-6 dark:text-blue-400 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium">Identity Verification</h4>
                  </div>
                  <ul className="space-y-2 dark:text-gray-300 text-gray-700">
                    <li>• Government-issued photo ID</li>
                    <li>• Passport, driver's license, or state ID</li>
                    <li>• Ability to take a photo or upload a scan</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setTab("overview")} className="space-x-1">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Overview</span>
                </Button>
                <Button onClick={() => setTab("steps")} className="space-x-1">
                  <span>Continue to Setup Steps</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="steps" className="space-y-6">
              <div className="dark:bg-green-950 bg-green-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold dark:text-white text-green-900 mb-4">Step-by-Step Setup Process</h3>
                <p className="dark:text-green-100 text-green-800 mb-4">
                  Follow these steps to complete your Stripe Connect account setup:
                </p>
                <div className="dark:bg-green-900 bg-green-200 p-3 rounded-md">
                  <p className="font-medium text-sm dark:text-green-100 text-green-800">
                    <strong>Prerequisites:</strong> Before attempting to set up Stripe Connect, ensure that:
                  </p>
                  <ul className="list-disc pl-5 text-sm dark:text-green-100 text-green-800 mt-1">
                    <li>The platform owner has enabled Stripe Connect in the Stripe Dashboard.</li>
                    <li>You have a valid Stripe account (or are ready to create one).</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full dark:bg-blue-900 bg-blue-200 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">Create Stripe Connect Account</h4>
                      <p className="dark:text-gray-300 text-gray-700 mb-3">
                        Click the "Set Up Stripe Connect" button in your seller dashboard. This will initialize your Stripe Connect account.
                      </p>
                      <div className="dark:bg-gray-800 bg-gray-200 p-3 rounded-md">
                        <p className="text-sm dark:text-gray-300 text-gray-700">
                          <strong>Note:</strong> You'll remain on our platform during this process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full dark:bg-blue-900 bg-blue-200 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">Complete the Onboarding Form</h4>
                      <p className="dark:text-gray-300 text-gray-700 mb-3">
                        Fill out the Stripe Connect onboarding form with your personal, business, and banking information.
                      </p>
                      <div className="dark:bg-gray-800 bg-gray-200 p-3 rounded-md">
                        <p className="text-sm dark:text-gray-300 text-gray-700">
                          <strong>Important:</strong> All information must be accurate and match your government records and banking information.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full dark:bg-blue-900 bg-blue-200 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">Verify Your Identity</h4>
                      <p className="dark:text-gray-300 text-gray-700 mb-3">
                        Upload or take a photo of your government-issued ID for verification.
                      </p>
                      <div className="dark:bg-gray-800 bg-gray-200 p-3 rounded-md">
                        <p className="text-sm dark:text-gray-300 text-gray-700">
                          <strong>Tip:</strong> Ensure good lighting and that all text is clearly visible in your ID photo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full dark:bg-blue-900 bg-blue-200 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">Connect Your Bank Account</h4>
                      <p className="dark:text-gray-300 text-gray-700 mb-3">
                        Provide your banking details where you want to receive your payments.
                      </p>
                      <div className="dark:bg-gray-800 bg-gray-200 p-3 rounded-md">
                        <p className="text-sm dark:text-gray-300 text-gray-700">
                          <strong>Security Note:</strong> Your banking information is securely transmitted to Stripe and never stored on our servers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full dark:bg-green-900 bg-green-200 flex items-center justify-center mr-4 flex-shrink-0">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">Ready to Receive Payments</h4>
                      <p className="dark:text-gray-300 text-gray-700 mb-3">
                        Once approved, your Stripe Connect account is ready to receive payments from curriculum sales.
                      </p>
                      <div className="dark:bg-gray-800 bg-gray-200 p-3 rounded-md">
                        <p className="text-sm dark:text-gray-300 text-gray-700">
                          <strong>Timeline:</strong> Most accounts are approved instantly, but some may require additional verification (1-2 business days).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setTab("requirements")} className="space-x-1">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Requirements</span>
                </Button>
                <Button onClick={() => setTab("faq")} className="space-x-1">
                  <span>Continue to FAQ</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="dark:bg-purple-950 bg-purple-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold dark:text-white text-purple-900 mb-4">Frequently Asked Questions</h3>
                <p className="dark:text-purple-100 text-purple-800">
                  Answers to common questions about Stripe Connect and selling on DanceRealmX.
                </p>
              </div>

              <div className="space-y-4">
                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Are there any fees for using Stripe Connect?</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    DanceRealmX charges a platform fee based on your subscription plan. Stripe also charges standard processing fees (typically 2.9% + $0.30 per transaction). These fees are automatically deducted from each transaction.
                  </p>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">How quickly will I receive my payments?</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    By default, Stripe issues payouts on a 2-day rolling basis. Once a payment is processed, funds typically appear in your bank account within 2-3 business days, depending on your bank.
                  </p>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Can I use an existing Stripe account?</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    Yes, if you already have a Stripe account, you can connect it to DanceRealmX. The system will recognize your existing account during the onboarding process.
                  </p>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Is my financial information secure?</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    Yes, all financial information is handled directly by Stripe, which is PCI-compliant and uses bank-level encryption. DanceRealmX never stores your banking information on our servers.
                  </p>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">What if my Stripe Connect application is rejected?</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    If your application is rejected, Stripe will provide a reason. Most rejections are due to incomplete or incorrect information. You can update your information and reapply. If you need assistance, contact our support team.
                  </p>
                </div>

                <div className="dark:bg-gray-900 bg-gray-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Can I disconnect my Stripe account later?</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    Yes, you can disconnect your Stripe Connect account at any time through your seller dashboard. Note that this will affect your ability to receive payments for your curriculum resources.
                  </p>
                </div>

                <div className="dark:bg-red-950 bg-red-100 p-5 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">I'm getting an error "Stripe Connect is not enabled on this account" when setting up. What should I do?</h4>
                  <p className="dark:text-red-100 text-red-900 mb-3">
                    This error occurs because the platform Stripe account hasn't been enabled for Connect functionality yet. This is a prerequisite before any seller can create a Connect account.
                  </p>
                  <p className="dark:text-red-100 text-red-900">
                    <strong>Solution:</strong> Please contact the platform administrator (DanceRealmX support) to enable Stripe Connect on their Stripe Dashboard. Once enabled, you'll be able to create your Connect account successfully.
                  </p>
                </div>
              </div>

              <div className="dark:bg-blue-950 bg-blue-100 p-5 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Need More Help?</h4>
                <p className="dark:text-blue-100 text-blue-800 mb-4">
                  If you have additional questions about Stripe Connect or need assistance with the setup process, check out these resources:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2 dark:text-blue-400 text-blue-600" />
                    <a href="https://stripe.com/docs/connect" target="_blank" rel="noopener noreferrer" className="dark:text-blue-400 text-blue-600 hover:underline">
                      Stripe Connect Documentation
                    </a>
                  </div>
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2 dark:text-blue-400 text-blue-600" />
                    <a href="mailto:support@dancerealmx.com" className="dark:text-blue-400 text-blue-600 hover:underline">
                      Contact DanceRealmX Support
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setTab("steps")} className="space-x-1">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Setup Steps</span>
                </Button>
                <Button onClick={onContinue} className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  Continue to Stripe Connect Setup
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close Guide
          </Button>
          {tab !== "faq" && (
            <Button onClick={onContinue} className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              Skip to Setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}