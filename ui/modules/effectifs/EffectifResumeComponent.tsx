import { Collapse, Box, HStack, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { IEffectifCreationSchema } from "shared/models/apis/effectifsCreationSchema";

interface EffectifResumeComponentProps {
  effectif: IEffectifCreationSchema;
}

const headerStyle = {
  backgroundColor: "#F9F8F6",
  color: "#3A3A3A",
  fontWeight: "700",
  fontSize: "18px",
};

const titleRowStyle = {
  padding: "8px 12px",
  flex: 3,
  fontWeight: "400",
  fontStyle: "italic",
  fontSize: "14px",
};

const contentRowStyle = {
  padding: "8px 12px",
  flex: 7,
  fontWeight: "700",
  fontSize: "14px",
};

const SingleRow = ({ title, content }) => {
  return (
    <HStack w={"100%"}>
      <Box style={titleRowStyle}>{title}</Box>
      <Box style={contentRowStyle}>{content}</Box>
    </HStack>
  );
};
const EffectifResumeComponent = ({ effectif }) => {
  const [showStatut, setShowStatut] = useState(false);
  const [showCoordonnees, setShowCoordonnees] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [showContrats, setShowContrats] = useState(false);

  return (
    <Box>
      <HStack style={headerStyle} onClick={() => setShowStatut(!showStatut)}>
        <Box padding={"8px"}>Statut</Box>
      </HStack>

      <Collapse in={showStatut}>
        <VStack>
          <SingleRow title="Statut actuel" content="Bonjour" />
          <SingleRow title="Date de déclaration du statut" content="Bonjour" />
          <SingleRow title="Date de réception du statut" content="Bonjour" />
        </VStack>
      </Collapse>

      <HStack style={headerStyle} onClick={() => setShowCoordonnees(!showCoordonnees)}>
        <Box>Coordonnées</Box>
      </HStack>
      <Collapse in={showCoordonnees}>
        <VStack>
          <SingleRow title="Nom de naissance" content="Bonjour" />
          <SingleRow title="Prénom" content="Bonjour" />
          <SingleRow title="Date de naissance" content="Bonjour" />
          <SingleRow title="Code postal de naissance" content="Bonjour" />
          <SingleRow title="Courriel" content="Bonjour" />
          <SingleRow title="Téléphone" content="Bonjour" />
          <SingleRow title="Numéro INE" content="Bonjour" />
          <SingleRow title="RQTH" content="Bonjour" />
          <SingleRow title="Date RQTH" content="Bonjour" />
          <SingleRow title="Adresse de résidence" content="Bonjour" />
          <SingleRow title="Responsable légal" content="Bonjour" />
          <SingleRow title="Nationalité" content="Bonjour" />
          <SingleRow title="Sitation avant contrat" content="Bonjour" />
          <SingleRow title="Etablissement fréquenté l'année dernière (N-1)" content="Bonjour" />
          <SingleRow title="Situation de fréquenté l'année dernière (N-1)" content="Bonjour" />
          <SingleRow title="Intitulé précis du dernier diplôme ou titre préparé" content="Bonjour" />
          <SingleRow title="Dernier diplôme obtenu" content="Bonjour" />
        </VStack>
      </Collapse>
      <HStack style={headerStyle} onClick={() => setShowFormation(!showFormation)}>
        <Box>Formation</Box>
      </HStack>
      <Collapse in={showFormation}>
        <VStack>
          <SingleRow title="UAI de l’établissement responsable" content="Bonjour" />
          <SingleRow title="SIRET de l’établissement responsable" content="Bonjour" />
          <SingleRow title="UAI de l’établissement formateur" content="Bonjour" />
          <SingleRow title="SIRET de l’établissement formateur" content="Bonjour" />
          <SingleRow title="UAI du site de formation" content="Bonjour" />
          <SingleRow title="Année scolaire" content="Bonjour" />
          <SingleRow title="Année de formation" content="Bonjour" />
          <SingleRow title="Date d'inscription en formation" content="Bonjour" />
          <SingleRow title="Date d’entrée en formation" content="Bonjour" />
          <SingleRow title="Date de fin en formation" content="Bonjour" />
          <SingleRow title="Durée de la formation réelle en mois" content="Bonjour" />
          <SingleRow title="Durée théorique en mois" content="Bonjour" />
          <SingleRow title="Libellé court" content="Bonjour" />
          <SingleRow title="Code Formation Diplôme (CFD)" content="Bonjour" />
          <SingleRow title="Code RNCP de la formation" content="Bonjour" />
          <SingleRow title="Date d’exclusion de la formation" content="Bonjour" />
          <SingleRow title="Cause d’exclusion de la formation" content="Bonjour" />
          <SingleRow title="Obtention du diplôme" content="Bonjour" />
          <SingleRow title="Date d’obtention du diplôme" content="Bonjour" />
          <SingleRow title="Coordonnées du référent handicap" content="Bonjour" />
          <SingleRow title="Formation présentielle" content="Bonjour" />
        </VStack>
      </Collapse>
      <HStack style={headerStyle} onClick={() => setShowContrats(!showContrats)}>
        <Box>Contrat(s)</Box>
      </HStack>
      <Collapse in={showContrats}>
        <HStack>
          <Box>Yo</Box>
          <Box>Yi</Box>
        </HStack>
      </Collapse>
    </Box>
  );
};

export default EffectifResumeComponent;
