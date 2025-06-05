import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserRole } from '@/types/user';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/router';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRoles?: UserRole[];
  requiredSubscription?: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  requiredRoles = [],
  requiredSubscription = false,
}) => {
  const router = useRouter();
  const { plans, loading, error } = useSubscription();

  const handleUpgrade = async (planId: number) => {
    try {
      // Redirect to payment page with the selected plan
      router.push(`/subscription/checkout?planId=${planId}`);
      onClose();
    } catch (error) {
      console.error('Error initiating upgrade:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Upgrade Required
                </Dialog.Title>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {requiredSubscription && !requiredRoles.length
                      ? 'This feature requires an active subscription.'
                      : requiredRoles.length
                      ? `This feature requires the following roles: ${requiredRoles.join(', ')}`
                      : 'This feature requires an upgrade.'}
                  </p>
                </div>

                {loading ? (
                  <div className="mt-4">Loading subscription plans...</div>
                ) : error ? (
                  <div className="mt-4 text-red-500">Error loading plans. Please try again.</div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {plans?.map((plan) => (
                      <div
                        key={plan.id}
                        className="rounded-lg border p-4 hover:border-blue-500 cursor-pointer"
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        <h4 className="font-medium">{plan.name}</h4>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                        <div className="mt-2">
                          <span className="text-lg font-bold">
                            ${plan.priceMonthly}/month
                          </span>
                          {plan.priceYearly && (
                            <span className="text-sm text-gray-500 ml-2">
                              or ${plan.priceYearly}/year
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Maybe Later
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 