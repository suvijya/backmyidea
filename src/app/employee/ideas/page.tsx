import { IdeasClient } from "@/components/admin/ideas-client";
import { requireUser } from "@/lib/clerk";
import { redirect } from "next/navigation";

export default async function EmployeeIdeasPage() {
  const user = await requireUser();
  if (!user.isEmployee && !user.isAdmin) {
    redirect("/");
  }
  return <IdeasClient />;
}
