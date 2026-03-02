import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-md mx-auto">
        <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4 mb-6">
          <HelpCircle className="h-10 w-10 text-zinc-400" />
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          Page not found
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          We couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue/90 text-white">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </>
  );
}
