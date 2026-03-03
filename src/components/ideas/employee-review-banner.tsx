"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EmployeeReviewBanner({ ideaId }: { ideaId: string }) {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(action: "approve" | "reject") {
    setActionInProgress(action);
    try {
      const res = await fetch("/api/employee/ideas", {
        method: "POST",
        body: JSON.stringify({ ideaId, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      toast.success(action === "approve" ? "Idea approved!" : "Idea rejected");
      router.refresh();
      router.push("/employee");
    } catch {
      toast.error("Action failed");
      setActionInProgress(null);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">Pending Review</h3>
            <p className="text-sm text-yellow-700">This idea is currently hidden from the public explore feed. Please review and make a decision.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            disabled={!!actionInProgress}
            onClick={() => handleAction("reject")}
          >
            {actionInProgress === "reject" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none bg-green-600 text-white hover:bg-green-700"
            disabled={!!actionInProgress}
            onClick={() => handleAction("approve")}
          >
            {actionInProgress === "approve" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
