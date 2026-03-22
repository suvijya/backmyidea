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
  Instagram,
  Download,
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
      : `https://piqd.in/idea/${slug}`;

  const shareText = `Check out "${title}" on Piqd`;

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

  const [timestamp, setTimestamp] = useState(Date.now());

  const handleDownload = async () => {
    try {
      toast.info("Generating card...");
      const res = await fetch(`/api/validation-card/${ideaId}?t=${timestamp}`);
      if (!res.ok) throw new Error("Failed to fetch card");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `piqd-${slug}-card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Card downloaded successfully!");
      incrementShareCount(ideaId).catch(console.error);
    } catch (e) {
      console.error(e);
      toast.error("Failed to download card");
    }
  };

  const handleRegenerate = () => {
    setTimestamp(Date.now());
    toast.success("Preview updated with current data!");
  };

  const handleInstagramShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleDownload();
    toast("Card downloaded! You can now share it to your Instagram Story.");
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
    {
      name: "Instagram",
      icon: Instagram,
      url: "#",
      onClick: handleInstagramShare,
    }
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
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
            className="text-[13px] text-text-secondary w-full"
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

        {/* Card Preview */}
        <div className="mt-4 flex justify-center overflow-hidden rounded-xl border border-warm-border bg-warm-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`/api/validation-card/${ideaId}?t=${timestamp}`} 
            alt="Validation Card Preview" 
            className="w-full max-h-[350px] object-contain bg-white"
          />
        </div>

        {/* Buttons */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleRegenerate}
            variant="outline"
            className="w-full gap-2 border-warm-border text-text-secondary hover:bg-warm-hover"
          >
            Refresh Preview
          </Button>
          <Button
            onClick={handleDownload}
            className="w-full gap-2 bg-saffron text-white hover:bg-saffron-dark"
          >
            <Download className="h-4 w-4" />
            Download Card
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target={link.url !== "#" ? "_blank" : undefined}
              rel={link.url !== "#" ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                if (link.onClick) {
                  link.onClick(e);
                } else {
                  incrementShareCount(ideaId).catch(console.error);
                }
              }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-warm-border p-2 text-text-secondary transition-colors hover:border-saffron hover:bg-saffron-light hover:text-saffron"
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">{link.name}</span>
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
