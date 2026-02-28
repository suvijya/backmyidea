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
  const user = await requireUser();
  const result = await getIdeaById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const idea = result.data;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[28px] leading-tight text-deep-ink">
        Edit Idea
      </h1>
      <p className="mt-1 text-[14px] text-text-secondary">
        Update your idea details. Changes are saved immediately.
      </p>

      <EditIdeaForm idea={idea} />
    </div>
  );
}
