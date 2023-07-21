import { useRouter } from "next/router";

import withAuth from "@/components/withAuth";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import Televersement from "@/modules/organismes/Televersement";

function TeleversementPage() {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);

  if (!organisme) return null;
  return <Televersement organismeId={organisme._id} isMine={false} />;
}

export default withAuth(TeleversementPage);
