import { signInAction, signInWithGoogleAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

interface LoginProps {
  searchParams: Promise<Message>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const message = await searchParams;

  if ("message" in message) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md bg-black text-white">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8 text-white">
        <div className="w-full max-w-md rounded-lg border border-white/20 bg-black/70 p-6 shadow-none text-white">
          <div className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <Link
                href="/"
                className="self-start mb-4 text-white hover:underline"
                aria-label="Back to Home"
              >
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Sign in
              </h1>
              <p className="text-sm text-white/70">
                Don't have an account?{" "}
                <Link
                  className="text-white font-medium hover:underline transition-all"
                  href="/sign-up"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <form action={signInAction} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-white"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white text-black placeholder-black/60"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-white"
                  >
                    Password
                  </Label>
                  <Link
                    className="text-xs text-white/70 hover:text-white hover:underline transition-all"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Your password"
                  required
                  className="w-full bg-white text-black placeholder-black/60"
                />
              </div>

              <SubmitButton
                className="w-full border border-white text-white hover:bg-white hover:text-black"
                pendingText="Signing in..."
              >
                Sign in with Email
              </SubmitButton>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/70 px-2 text-white/70">
                  Or continue with
                </span>
              </div>
            </div>

            <form action={signInWithGoogleAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full flex items-center gap-2 border border-white bg-black text-white hover:bg-white hover:text-black"
              >
                <FcGoogle className="h-5 w-5" />
                Sign in with Google
              </Button>
            </form>

            <FormMessage message={message} />
          </div>
        </div>
      </div>
    </>
  );
}
