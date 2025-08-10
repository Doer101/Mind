import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction, signInWithGoogleAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";
import { FcGoogle } from "react-icons/fc";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md bg-black text-white">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8 text-white">
        <div className="w-full max-w-md rounded-lg border border-white/20 bg-black/70 p-6 shadow-none text-white">
          <UrlProvider>
            <form className="flex flex-col space-y-6">
              <Link
                href="/"
                className="self-start mb-4 text-white hover:underline"
                aria-label="Back to Home"
              >
                ← Back to Home
              </Link>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Sign up
                </h1>
                <p className="text-sm text-white/70">
                  Already have an account?{" "}
                  <Link
                    className="text-white font-medium hover:underline transition-all"
                    href="/sign-in"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="full_name"
                    className="text-sm font-medium text-white"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="w-full bg-white text-black placeholder-black/60"
                  />
                </div>

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
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-white"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Your password"
                    minLength={6}
                    required
                    className="w-full bg-white text-black placeholder-black/60"
                  />
                </div>
              </div>

              <SubmitButton
                formAction={signUpAction}
                pendingText="Signing up..."
                className="w-full border border-white text-white hover:bg-white hover:text-black"
              >
                Sign up with Email
              </SubmitButton>

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

              <SubmitButton
                formAction={signInWithGoogleAction}
                variant="outline"
                className="w-full flex items-center gap-2 border border-white text-white bg-bleck hover:bg-white hover:text-black"
              >
                <FcGoogle className="h-5 w-5" />
                Sign up with Google
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </UrlProvider>
        </div>
      </div>
    </>
  );
}
