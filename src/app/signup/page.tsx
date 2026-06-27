import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">AnimateAI</span>
      </Link>
      <SignupForm />
    </div>
  );
}
