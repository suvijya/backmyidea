"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Twitter,
  Linkedin,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { incrementShareCount } from "@/actions/idea-actions";

interface ShareModalProps {
  ideaId: string;
  title: string;
  slug: string;
  children?: React.ReactNode;
}

export function ShareModal({ ideaId, title, slug, children }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/idea/${slug}`
      : `https://backmyidea.in/idea/${slug}`;

  const shareText = `Check out "${title}" on BackMyIdea`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    incrementShareCount(ideaId).catch(console.error);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url });
        incrementShareCount(ideaId).catch(console.error);
      } catch {
        // User cancelled
      }
    }
  };

  const shareLinks = [
    {
      name: "Twitter / X",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            className="gap-2 border-warm-border text-text-secondary hover:bg-warm-hover"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] text-deep-ink">
            Share this idea
          </DialogTitle>
        </DialogHeader>

        {/* Copy link */}
        <div className="mt-2 flex items-center gap-2">
          <Input
            readOnly
            value={url}
            className="text-[13px] text-text-secondary"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            className="shrink-0 gap-1.5 border-warm-border"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-brand-green" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Social share buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                incrementShareCount(ideaId).catch(console.error);
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-warm-border p-3 text-text-secondary transition-colors hover:border-saffron hover:bg-saffron-light hover:text-saffron"
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{link.name}</span>
            </a>
          ))}
        </div>

        {/* Native share (mobile) */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            onClick={handleNativeShare}
            className="mt-3 w-full gap-2 bg-saffron text-white hover:bg-saffron-dark"
          >
            <Share2 className="h-4 w-4" />
            More sharing options
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
