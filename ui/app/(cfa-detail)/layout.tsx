import dynamic from "next/dynamic";

import { DetailLayout } from "../_components/layouts/DetailLayout";

const CrispChatNoSSR = dynamic(() => import("../_components/CrispChat").then((mod) => mod.CrispChat));

export default async function CfaDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <DetailLayout>
      {children}
      <CrispChatNoSSR />
    </DetailLayout>
  );
}
