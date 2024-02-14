import { Container, Heading } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { parametresNavigationAtom, ParametresNavigationStep } from "@/hooks/parametresAtoms";
import ChoixDeTransmissions from "@/modules/parametres/ChoixDeTransmissions";
import ERPSelection from "@/modules/parametres/ERPSelection";
import TransmissionConfiguration from "@/modules/parametres/TransmissionConfiguration";

const ParametresPages = () => {
  const navigationStep = useRecoilValue(parametresNavigationAtom);
  const { organisme, refetch: refetchOrganisme } = useOrganisationOrganisme();
  const title = "Paramétrage de votre moyen de transmission";

  if (!organisme) {
    return null;
  }
  const renderBody = () => {
    switch (navigationStep) {
      case ParametresNavigationStep.TRANSMISSION_MODE:
        return <ChoixDeTransmissions organisme={organisme} onERPSelected={refetchOrganisme}></ChoixDeTransmissions>;
      case ParametresNavigationStep.ERP_SELECTION:
        return <ERPSelection organisme={organisme} onERPSelected={refetchOrganisme}></ERPSelection>;
      default:
        <></>;
    }
  };

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
          {title}
        </Heading>
        {organisme.mode_de_transmission ? (
          <TransmissionConfiguration
            organisme={organisme}
            onKeyGenerated={refetchOrganisme}
          ></TransmissionConfiguration>
        ) : (
          renderBody()
        )}
      </Container>
    </SimplePage>
  );
};

export default withAuth(ParametresPages);
