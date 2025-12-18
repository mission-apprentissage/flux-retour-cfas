import { RegionView } from "@/app/_components/statistiques/views/RegionView";

interface RegionDetailPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RegionDetailMLPage({ params }: RegionDetailPageProps) {
  const { code } = await params;
  return <RegionView regionCode={code} isAdmin={false} />;
}
