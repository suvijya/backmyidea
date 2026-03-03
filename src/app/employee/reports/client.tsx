"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function EmployeeReportsClient({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports);

  async function handleAction(id: string, action: "resolve" | "dismiss") {
    try {
      const res = await fetch("/api/employee/reports", {
        method: "POST",
        body: JSON.stringify({ reportId: id, action }),
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error();
      setReports(reports.filter(r => r.id !== id));
      toast.success(action === "resolve" ? "Report resolved!" : "Report dismissed");
    } catch {
      toast.error("Action failed");
    }
  }

  if (reports.length === 0) return <div className="text-center py-12 border border-dashed rounded-xl bg-warm-subtle/50 text-muted-foreground">No pending reports!</div>;

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <Card key={report.id} className="overflow-hidden border border-warm-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-deep-ink flex items-center gap-2">
                  <Badge variant="destructive">{report.reason}</Badge>
                  {report.entityType.toUpperCase()}
                </h3>
                <p className="text-sm text-text-secondary mt-2">Reported by @{report.user.username} • {new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <p className="text-md mb-4 text-deep-ink">"{report.details || "No details provided"}"</p>
            
            {report.idea && (
              <div className="mb-6 p-4 bg-warm-subtle rounded-lg">
                <p className="text-sm font-semibold mb-1">Related Idea:</p>
                <Link href={`/idea/${report.idea.slug}`} target="_blank" className="text-blue-600 hover:underline">
                  {report.idea.title}
                </Link>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-warm-border">
              <Button variant="outline" onClick={() => handleAction(report.id, "dismiss")}>Dismiss</Button>
              <Button className="bg-brand-red text-white hover:bg-brand-red/90" onClick={() => handleAction(report.id, "resolve")}>Mark Resolved</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
