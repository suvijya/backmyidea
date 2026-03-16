import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { SearchX, ArrowLeft, Lightbulb } from "lucide-react";
import * as motion from "framer-motion/client";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col selection:bg-brand-blue/20">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue/5 dark:bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-xl w-full text-center relative z-10"
        >
          <div className="relative inline-block mb-8 group">
            <motion.div 
              initial={{ rotate: -15, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute -top-6 -left-8 bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Not an Idea
            </motion.div>
            
            <div className="relative w-32 h-32 mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-transparent opacity-50" />
              <SearchX className="h-16 w-16 text-zinc-400 dark:text-zinc-500 relative z-10" />
            </div>
            
            <motion.div 
              initial={{ rotate: 15, opacity: 0 }}
              animate={{ rotate: 6, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute -bottom-4 -right-6 bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg"
            >
              404 Error
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Lost in the Pitch Deck?
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-md mx-auto leading-relaxed">
            We couldn't find the page you're looking for. It might have pivoted, failed to find product-market fit, or never existed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full bg-brand-blue hover:bg-brand-blue/90 text-white h-12 px-8 shadow-lg shadow-brand-blue/25 transition-all hover:scale-105 active:scale-95">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95">
              <Link href="/explore">
                Explore Ideas
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}