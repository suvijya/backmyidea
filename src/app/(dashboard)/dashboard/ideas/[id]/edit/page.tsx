import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/clerk";
import { getIdeaById } from "@/actions/idea-actions";
import { EditIdeaForm } from "@/components/dashboard/edit-idea-form";

export const dynamic = "force-dynamic";

interface EditIdeaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditIdeaPage({ params }: EditIdeaPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[28px] leading-tight text-deep-ink">
        Edit Idea
      </h1>
      <p className="mt-1 text-[14px] text-text-secondary">
        Update your idea details. Changes are saved immediately.
      </p>

      <Suspense fallback={<EditIdeaSkeleton />}>
        <EditIdeaLoader id={id} />
      </Suspense>
    </div>
  );
}

async function EditIdeaLoader({ id }: { id: string }) {
  await requireUser();
  const result = await getIdeaById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const idea = result.data;

  return <EditIdeaForm idea={idea} />;
}

function EditIdeaSkeleton() {
  return (
    <div className="mt-8 space-y-6 animate-pulse">
      {/* Skeleton for basic inputs */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-warm-subtle rounded"></div>
        <div className="h-10 w-full bg-warm-subtle rounded-md"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 bg-warm-subtle rounded"></div>
        <div className="h-24 w-full bg-warm-subtle rounded-md"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-warm-subtle rounded"></div>
          <div className="h-10 w-full bg-warm-subtle rounded-md"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-warm-subtle rounded"></div>
          <div className="h-10 w-full bg-warm-subtle rounded-md"></div>
        </div>
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-10 w-full bg-warm-subtle rounded-md"></div>
      </div>
    </div>
  );
}
