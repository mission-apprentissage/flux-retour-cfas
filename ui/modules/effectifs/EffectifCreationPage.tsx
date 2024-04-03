import { ArrowBackIcon } from "@chakra-ui/icons";
import { Container, Heading, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  IEffectifCreationCoordonnesSchema,
  IEffectifCreationContratsSchema,
  IEffectifCreationFormationSchema,
} from "shared/models/apis/effectifsCreationSchema";

import { Organisme } from "@/common/internal/Organisme";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import StepperComponent from "@/components/Stepper/Stepper";

import EffectfCoordonneesComponent from "./steps/EffectifCoordonneesComponent";

interface EffectifCreationPageProps {
  organisme: Organisme;
}

const EffectifCreationPage = ({ organisme }: EffectifCreationPageProps) => {
  const [coordonnees, setCoordonnees] = useState({} as IEffectifCreationCoordonnesSchema);
  const [contrats, setContrats] = useState({} as IEffectifCreationContratsSchema);
  const [formation, setFormation] = useState({} as IEffectifCreationFormationSchema);

  const steps = [
    {
      title: "Renseigner les coordonnées de l'apprenant",
      component: (props) => <EffectfCoordonneesComponent data={coordonnees} onValidate={setCoordonnees} {...props} />,
    },
    {
      title: "Renseigner la formation de l'apprenant",
      component: () => null,
    },
    {
      title: "Renseigner le contrat d'apprentissage de l'apprenant",
      component: () => null,
    },
    {
      title: "Relecture finale et validation",
      component: () => null,
    },
  ];
  return (
    <SimplePage>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#161616" fontSize="beta" fontWeight="700" mb="4w">
          Ajouter un apprenant
        </Heading>
        <HStack mt={8} mb={8}>
          <Link
            href={`/effectifs`}
            color="action-high-blue-france"
            borderBottom="1px"
            _hover={{ textDecoration: "none" }}
          >
            <ArrowBackIcon mr={2} />
            Retour au tableau des effectifs
          </Link>
        </HStack>
        <StepperComponent steps={steps} />
      </Container>
    </SimplePage>
  );
};

export default EffectifCreationPage;
