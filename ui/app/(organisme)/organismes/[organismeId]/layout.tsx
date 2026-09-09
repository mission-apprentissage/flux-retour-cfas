import { OrganismeFicheHeader } from "@/app/_components/dashboard/OrganismeFicheHeader";

export default async function OrganismeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organismeId: string }>;
}) {
  const { organismeId } = await params;

  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <OrganismeFicheHeader organismeId={organismeId} />
      {children}
    </div>
  );
}
