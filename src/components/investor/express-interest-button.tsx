"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { expressInterest } from "@/actions/investor-actions";

interface ExpressInterestButtonProps {
  ideaId: string;
  ideaTitle: string;
}

export function ExpressInterestButton({
  ideaId,
  ideaTitle,
}: ExpressInterestButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await expressInterest(ideaId, message || undefined);
      if (result.success) {
        setSent(true);
        toast.success("Interest expressed! The founder will be notified.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green-light px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-brand-green" />
        <span className="text-[13px] font-medium text-brand-green">
          Interest expressed
        </span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-saffron text-white hover:bg-saffron-dark">
          <Send className="h-4 w-4" />
          Express Interest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px] text-deep-ink">
            Express Interest
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Let the founder of &quot;{ideaTitle}&quot; know you&apos;re interested.
            They&apos;ll receive a notification and can choose to connect with you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            placeholder="Optional message to the founder (e.g., what caught your eye, how you might help)..."
            className="resize-none border-warm-border text-[13px]"
            rows={4}
          />
          <p className="mt-1 text-right text-[11px] text-text-muted">
            {message.length}/500
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-warm-border text-text-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Interest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
