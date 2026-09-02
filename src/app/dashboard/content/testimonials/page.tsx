import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ArchiveButton, DeleteButton, RestoreButton, TestimonialForm } from "@/components/dashboard/content-forms";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  await requirePermission("content.manage");
  const testimonials = await prisma.testimonial.findMany({ orderBy: { position: "asc" } });

  return (
    <>
      <DashboardHeader
        title="Testimonials"
        description="Shown on the homepage and About page. Only publish quotes you have permission to use."
        breadcrumbs={[{ label: "Content" }, { label: "Testimonials" }]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {testimonials.length ? (
            testimonials.map((testimonial) => (
              <Panel
                key={testimonial.id}
                title={`${testimonial.author} — ${testimonial.role}`}
                action={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={testimonial.status} />
                    {testimonial.status !== "ARCHIVED" ? (
                      <ArchiveButton entity="testimonial" id={testimonial.id} />
                    ) : (
                      <>
                        <RestoreButton entity="testimonial" id={testimonial.id} />
                        <DeleteButton entity="testimonial" id={testimonial.id} />
                      </>
                    )}
                  </div>
                }
              >
                <TestimonialForm
                  draft={{
                    id: testimonial.id,
                    author: testimonial.author,
                    role: testimonial.role,
                    company: testimonial.company ?? "",
                    quote: testimonial.quote,
                    rating: testimonial.rating,
                    status: testimonial.status,
                  }}
                />
              </Panel>
            ))
          ) : (
            <EmptyState icon="Quote" title="No testimonials yet" description="Add your first one on the right." />
          )}
        </div>

        <Panel title="Add a testimonial">
          <TestimonialForm />
        </Panel>
      </div>
    </>
  );
}
