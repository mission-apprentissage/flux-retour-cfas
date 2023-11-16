import { ArrowForwardIcon } from "@chakra-ui/icons";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { getOrganisationLabel } from "@/common/internal/Organisation";
import Link from "@/components/Links/Link";
import useAuth from "@/hooks/useAuth";

const SuggestFeature = () => {
  const { auth } = useAuth();

  return (
    <Link
      href={`mailto:${CONTACT_ADDRESS}?subject=Suggestion de fonctionnalité TDB [${getOrganisationLabel(
        auth.organisation
      )}]`}
      target="_blank"
      rel="noopener noreferrer"
      color="action-high-blue-france"
      borderBottom="1px"
      _hover={{ textDecoration: "none" }}
    >
      <ArrowForwardIcon mr={2} />
      Suggérer une fonctionnalité
    </Link>
  );
};

export default SuggestFeature;
