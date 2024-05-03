import { ArrowBackIcon } from "@chakra-ui/icons";
import { Container, Heading, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  IEffectifCreationCoordonnesSchema,
  IEffectifCreationContratsSchema,
  IEffectifCreationFormationSchema,
  IEffectifCreationCoordonnesFormSchema,
  effectifCreationCoordonnesFormSchema,
  effectifCreationCoordonnesSchema,
} from "shared/models/apis/effectifsCreationSchema";

import { _get, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import StepperComponent from "@/components/Stepper/Stepper";

import EffectifContratsComponent from "./steps/EffectifContratsComponent";
import EffectifCoordonneesComponent from "./steps/EffectifCoordonneesComponent";
import EffectifFormationComponent from "./steps/EffectifFomationComponent";
import EffectifValidationComponent from "./steps/EffectifValidationComponent";

interface EffectifCreationPageProps {
  organisme: Organisme;
}

const EffectifCreationPage = ({ organisme }: EffectifCreationPageProps) => {
  const [coordonnees, setCoordonnees] = useState({} as IEffectifCreationCoordonnesFormSchema);
  const [contrats, setContrats] = useState({} as IEffectifCreationContratsSchema);
  const [formation, setFormation] = useState({} as IEffectifCreationFormationSchema);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const onCoordonneesValidate = async (data: IEffectifCreationCoordonnesSchema) => {
    await _put("/api/v1/user/effectif-draft", data);
    refetch();
  };

  const onFormationValidate = async () => {
    console.log("Formation validate");
    await refetch();
  };

  const onContratValidate = async () => {
    console.log("Formation validate");
    await refetch();
  };

  const onEffectifValidate = async () => {
    console.log("onEffectifValidate");
    await refetch();
  };

  const getDraft = async () => {
    const draft = await _get("/api/v1/user/effectif-draft");
    const formattedDraft = effectifCreationCoordonnesSchema.parse(draft);
    return effectifCreationCoordonnesFormSchema.parse(formattedDraft);
  };

  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["effectif-query"],
    queryFn: getDraft,
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    const { apprenant, annee_scolaire, formation, organisme, contrats } = data;

    setCoordonnees({ apprenant });
  }, [isFetching, error, data]);

  const steps = [
    {
      title: "Renseigner les coordonnées de l'apprenant",
      component: (props) => <EffectifCoordonneesComponent onValidate={onCoordonneesValidate} {...props} />,
    },
    {
      title: "Renseigner la formation de l'apprenant",
      component: (props) => <EffectifFormationComponent onValidate={onFormationValidate} {...props} />,
    },
    {
      title: "Renseigner le contrat d'apprentissage de l'apprenant",
      component: (props) => <EffectifContratsComponent onValidate={onContratValidate} {...props} />,
    },
    {
      title: "Relecture finale et validation",
      component: (props) => <EffectifValidationComponent onValidate={onEffectifValidate} {...props} />,
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
        {!isFetching && (
          <StepperComponent
            currentStepIndex={currentStepIndex}
            setCurrentStepIndex={setCurrentStepIndex}
            steps={steps}
            data={data}
          />
        )}
      </Container>
    </SimplePage>
  );
};

export default EffectifCreationPage;
