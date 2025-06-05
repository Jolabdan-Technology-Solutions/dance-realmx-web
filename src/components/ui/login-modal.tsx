import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "./dialog";
import { Loader2 } from "lucide-react";
import { AuthContext } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
  const authContext = useContext(AuthContext);
  const loginMutation = authContext?.loginMutation;
  const [authError, setAuthError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    setAuthError(null);
    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
    };
    if (loginMutation) {
      loginMutation.mutate(trimmedData, {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onOpenChange(false);
        },
        onError: (error: any) => {
          setAuthError(error?.message || "Login failed. Please try again.");
        },
      });
    } else {
      setAuthError("Authentication service is currently unavailable. Please try again later.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>Sign in to continue to payment.</DialogDescription>
        </DialogHeader>
        {authError && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-4" role="alert">
            <span className="block sm:inline">{authError}</span>
          </div>
        )}
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full" disabled={loginMutation?.isPending}>
              {loginMutation?.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 