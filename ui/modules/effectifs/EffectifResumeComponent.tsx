import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Text, Box, HStack, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";
import { IEffectifCreationSchema } from "shared/models/apis/effectifsCreationSchema";

import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { PlainArrowRight } from "@/theme/components/icons/PlainArrowRight";

const titleRowStyle = {
  padding: "0px 12px",
  flex: 4,
  fontWeight: "400",
  fontStyle: "italic",
  fontSize: "14px",
  color: "#161616",
};

const contentRowStyle = {
  padding: "0px 12px",
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

const AccordionItemChild = ({ title, children, isExpanded }: { title: string; children: any; isExpanded: boolean }) => {
  return (
    <>
      <AccordionButton bg="#F9F8F6">
        {isExpanded ? (
          <PlainArrowRight boxSize={7} color="bluefrance" transform="rotate(90deg)" />
        ) : (
          <PlainArrowRight boxSize={7} color="bluefrance" />
        )}
        <Box flex="1" textAlign="left">
          <HStack>
            <Text fontWeight="bold">{title}</Text>
          </HStack>
        </Box>
      </AccordionButton>
      <AccordionPanel pb={4}>{isExpanded && children}</AccordionPanel>
    </>
  );
};

interface EffectifResumeComponentProps {
  effectif: IEffectifCreationSchema;
}
const EffectifResumeComponent = ({ effectif }: EffectifResumeComponentProps) => {
  const [showStatut, setShowStatut] = useState(false);
  const [showCoordonnees, setShowCoordonnees] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [showContrats, setShowContrats] = useState(false);

  const formatDate = (d: Date | null | undefined) => {
    return d ? formatDateNumericDayMonthYear(d) : undefined;
  };

  return (
    <Box>
      <Accordion allowToggle>
        <AccordionItem>
          {({ isExpanded }) => (
            <AccordionItemChild isExpanded={isExpanded} title="Statut">
              <VStack>
                <SingleRow title="Statut actuel" content="Bonjour" />
                <SingleRow title="Date de déclaration du statut" content="Bonjour" />
                <SingleRow title="Date de réception du statut" content="Bonjour" />
              </VStack>
            </AccordionItemChild>
          )}
        </AccordionItem>

        <AccordionItem>
          {({ isExpanded }) => (
            <AccordionItemChild isExpanded={isExpanded} title="Coordonnées">
              <VStack>
                <SingleRow title="Nom de naissance" content={effectif.apprenant?.nom} />
                <SingleRow title="Prénom" content={effectif.apprenant?.prenom} />
                <SingleRow title="Date de naissance" content={formatDate(effectif.apprenant?.date_de_naissance)} />
                <SingleRow title="Code postal de naissance" content={effectif.apprenant?.code_postal_de_naissance} />
                <SingleRow title="Courriel" content={effectif.apprenant?.courriel} />
                <SingleRow title="Téléphone" content={effectif.apprenant?.telephone} />
                <SingleRow title="Numéro INE" content={effectif.apprenant?.ine} />
                <SingleRow title="RQTH" content={effectif.apprenant?.rqth} />
                <SingleRow title="Date RQTH" content={formatDate(effectif.apprenant?.date_rqth)} />
                <SingleRow title="Adresse de résidence" content={effectif.apprenant?.adresse?.complete} />
                <SingleRow
                  title="Responsable légal - Prénom"
                  content={effectif.apprenant?.representant_legal?.prenom}
                />
                <SingleRow title="Responsable légal - Nom" content={effectif.apprenant?.representant_legal?.nom} />
                <SingleRow
                  title="Responsable légal - Courriel"
                  content={effectif.apprenant?.representant_legal?.courriel}
                />
                <SingleRow
                  title="Responsable légal - Téléphone"
                  content={effectif.apprenant?.representant_legal?.telephone}
                />
                <SingleRow title="Nationalité" content={effectif.apprenant?.nationalite} />
                <SingleRow title="Situation avant contrat" content={effectif.apprenant?.situation_avant_contrat} />
                {/* <SingleRow title="Etablissement fréquenté l'année dernière (N-1)" content={effectif.apprenant?.} />
                <SingleRow title="Situation de fréquenté l'année dernière (N-1)" content={effectif.apprenant?.date_de_naissance} />
                <SingleRow title="Intitulé précis du dernier diplôme ou titre préparé" content={effectif.apprenant?.date_de_naissance} /> */}
                <SingleRow title="Dernier diplôme obtenu" content={effectif.apprenant?.dernier_diplome} />
              </VStack>
            </AccordionItemChild>
          )}
        </AccordionItem>

        <AccordionItem>
          {({ isExpanded }) => (
            <AccordionItemChild isExpanded={isExpanded} title="Formation">
              <VStack>
                <SingleRow
                  title="Etablissement responsable"
                  content={<Link href={`/organismes/${effectif.organisme_responsable_id}`}>Voir l'organisme</Link>}
                />
                <SingleRow
                  title="Etablissement formateur"
                  content={<Link href={`/organismes/${effectif.organisme_formateur_id}`}>Voir l'organisme</Link>}
                />
                <SingleRow
                  title="Site de formation"
                  content={<Link href={`/organismes/${effectif.organisme_id}`}>Voir l'organisme</Link>}
                />
                <SingleRow title="Année scolaire" content={effectif.annee_scolaire} />
                <SingleRow title="Année de formation" content={effectif.formation?.annee} />
                <SingleRow
                  title="Date d'inscription en formation"
                  content={formatDate(effectif.formation?.date_inscription)}
                />
                <SingleRow title="Date d’entrée en formation" content={formatDate(effectif.formation?.date_entree)} />
                <SingleRow title="Date de fin en formation" content={formatDate(effectif.formation?.date_fin)} />
                <SingleRow
                  title="Durée de la formation réelle en mois"
                  content={effectif.formation?.duree_formation_relle}
                />
                <SingleRow title="Durée théorique en mois" content={effectif.formation?.duree_theorique_mois} />
                <SingleRow title="Libellé court" content={effectif.formation?.libelle_court} />
                <SingleRow title="Code Formation Diplôme (CFD)" content={effectif.formation?.cfd} />
                <SingleRow title="Code RNCP de la formation" content={effectif.formation?.rncp} />
                <SingleRow
                  title="Date d’exclusion de la formation"
                  content={formatDate(effectif.formation?.date_exclusion)}
                />
                <SingleRow title="Cause d’exclusion de la formation" content={effectif.formation?.cause_exclusion} />
                <SingleRow title="Obtention du diplôme" content={effectif.formation?.obtention_diplome} />
                <SingleRow
                  title="Date d’obtention du diplôme"
                  content={formatDate(effectif.formation?.date_obtention_diplome)}
                />
                <SingleRow title="Coordonnées du référent handicap" content={effectif.formation?.referent_handicap} />
                <SingleRow title="Formation présentielle" content={effectif.formation?.formation_presentielle} />
              </VStack>
            </AccordionItemChild>
          )}
        </AccordionItem>
        <AccordionItem>
          {({ isExpanded }) => <AccordionItemChild isExpanded={isExpanded} title="Contrat(s)"></AccordionItemChild>}
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

export default EffectifResumeComponent;
