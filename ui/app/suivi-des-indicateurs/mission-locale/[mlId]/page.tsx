import { MissionLocaleDetailView } from "@/app/_components/statistiques/views/MissionLocaleDetailView";

interface MissionLocaleDetailPageProps {
  params: Promise<{
    mlId: string;
  }>;
}

export default async function MissionLocaleDetailMLPage({ params }: MissionLocaleDetailPageProps) {
  const { mlId } = await params;
  return <MissionLocaleDetailView mlId={mlId} isAdmin={false} />;
}
