import UnauthorizedPage from "@/components/Page/UnauthorizedPage";
import withAuth from "@/components/withAuth";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import Televersement from "@/modules/organismes/Televersement";

function TeleversementPage() {
  const { organisme } = useEffectifsOrganismeOrganisation();
  if (!organisme) {
    return <UnauthorizedPage />;
  }

  return <Televersement organismeId={organisme._id} isMine={true} />;
}

export default withAuth(TeleversementPage);
