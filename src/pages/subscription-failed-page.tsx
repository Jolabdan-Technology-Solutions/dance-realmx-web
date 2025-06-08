import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SubscriptionCanceledProps {
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function SubscriptionCanceled({
  onRetry,
  onGoBack,
}: SubscriptionCanceledProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mb-4 mx-auto rounded-full bg-orange-500/20 p-3 w-fit">
            <XCircle className="h-10 w-10 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Canceled</CardTitle>
          <CardDescription className="text-base">
            Your subscription process was canceled. No charges were made to your
            account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            {onGoBack && (
              <Button
                onClick={onGoBack}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            )}

            {!onRetry && !onGoBack && (
              <Button
                onClick={() => (window.location.href = "/subscription")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/support" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
