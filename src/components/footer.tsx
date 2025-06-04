import Link from "next/link";
import { Twitter, Instagram, Facebook } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* Product Links */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Product</h3>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="#features">Features</Link>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="#pricing">Premium</Link>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="/blog">Blog</Link>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="/prompts">Prompt Library</Link>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="/support">Support</Link>
                </Button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="/privacy">Privacy</Link>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="px-0 h-auto font-normal"
                  asChild
                >
                  <Link href="/terms">Terms</Link>
                </Button>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} MindMuse. All rights reserved.
          </p>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="#" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="#" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="#" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
