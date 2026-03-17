"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { directMessageSchema, DirectMessageInput } from "@/lib/validations";
import { sendDirectMessage } from "@/actions/dm-actions";

interface SendSuggestionModalProps {
  ideaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendSuggestionModal({ ideaId, open, onOpenChange }: SendSuggestionModalProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<DirectMessageInput>({
    resolver: zodResolver(directMessageSchema),
    defaultValues: {
      ideaId,
      content: "",
    },
  });

  const onSubmit = (data: DirectMessageInput) => {
    startTransition(async () => {
      const result = await sendDirectMessage(data.ideaId, data.content);
      
      if (result.success) {
        toast.success("Private suggestion sent to the founder!");
        form.reset();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Private Suggestion</DialogTitle>
          <DialogDescription>
            Have feedback for the founder? This message will only be visible to them.
            Limit: 2 messages per day.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Suggestion
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
