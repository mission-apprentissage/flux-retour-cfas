import { WarningTwoIcon, InfoIcon } from "@chakra-ui/icons";
import { Box, Table, Tbody, Text, Tr, Td, UnorderedList, TableContainer, ListItem, Link } from "@chakra-ui/react";
import { TD_MANUEL_ELEMENT_LINK } from "shared";

import { InfoTooltip } from "../Tooltip/InfoTooltip";

const attributes = [
  { label: "Nom de naissance", value: "nom_apprenant" },
  { label: "Prénom", value: "prenom_apprenant" },
  { label: "Date de naissance", value: "date_de_naissance_apprenant" },
  { label: "Année scolaire", value: "annee_scolaire" },
  { label: "Statut apprenant", value: "statut_apprenant" },
  { label: "Date de changement de statut", value: "date_metier_mise_a_jour_statut" },
  { label: "Identifant ERP", value: "id_erp_apprenant" },
  { label: "INE de l'apprenant", value: "ine_apprenant" },
  { label: "Courriel", value: "email_contact" },
  { label: "Téléphone", value: "tel_apprenant" },
  { label: "Libellé court formation", value: "libelle_court_formation" },
  { label: "Année de la formation", value: "annee_formation" },
  { label: "Code RNCP", value: "formation_rncp" },
  { label: "Date de début de contrat", value: "contrat_date_debut" },
  { label: "Date de fin du contrat", value: "contrat_date_fin" },
  { label: "Date de rupture du contrat", value: "contrat_date_rupture" },
  { label: "Adresse", value: "adresse_apprenant" },
  { label: "Code postal de résidence", value: "code_postal_apprenant" },
  { label: "Code postal de naissance", value: "code_postal_de_naissance_apprenant" },
  { label: "Sexe", value: "sexe_apprenant" },
  { label: "RQTH", value: "rqth_apprenant" },
  { label: "Date de reconnaisance RQTH", value: "date_rqth_apprenant" },
  { label: "Email du responsable 1", value: "responsable_apprenant_mail1" },
  { label: "Email du responsable 2", value: "responsable_apprenant_mail2" },
  { label: "Diplôme de la formation obtenu", value: "obtention_diplome_formation" },
  { label: "Date d’obtention du diplôme", value: "date_obtention_diplome_formation" },
  { label: "Date d’exclusion de la formation", value: "date_exclusion_formation" },
  { label: "Cause d’exclusion de la formation", value: "cause_exclusion_formation" },
  { label: "Nom du référent handicap de la formation", value: "nom_referent_handicap_formation" },
  { label: "Prénom du référent handicap de la formation", value: "prenom_referent_handicap_formation" },
  { label: "Courriel du référent handicap de la formation", value: "email_referent_handicap_formation" },
  { label: "Cause de la rupture du contrat", value: "cause_rupture_contrat" },
  { label: "Date de début du contrat 2", value: "contrat_date_debut_2" },
  { label: "Date de fin du contrat 2", value: "contrat_date_fin_2" },
  { label: "Date de rupture du contrat 2", value: "contrat_date_rupture_2" },
  { label: "Cause de rupture du contrat 2", value: "cause_rupture_contrat_2" },
  { label: "Date de début du contrat 3", value: "contrat_date_debut_3" },
  { label: "Date de fin du contrat 3", value: "contrat_date_fin_3" },
  { label: "Date de rupture du contrat 3", value: "contrat_date_rupture_3" },
  { label: "Cause de rupture du contrat 3", value: "cause_rupture_contrat_3" },
  { label: "Date de début du contrat 4", value: "contrat_date_debut_4" },
  { label: "Date de fin du contrat 4", value: "contrat_date_fin_4" },
  { label: "Date de rupture du contrat 4", value: "contrat_date_rupture_4" },
  { label: "Cause de rupture du contrat 4", value: "cause_rupture_contrat_4" },
  { label: "SIRET de l’employeur ", value: "siret_employeur" },
  { label: "SIRET de l’employeur 2", value: "siret_employeur_2" },
  { label: "SIRET de l’employeur 3", value: "siret_employeur_3" },
  { label: "SIRET de l’employeur 4", value: "siret_employeur_4" },
  { label: "Formation présentielle", value: "formation_presentielle" },
  { label: "Durée théorique de la formation ( années )", value: "duree_theorique_formation" },
  { label: "Durée théorique de la formation ( mois )", value: "duree_theorique_formation_mois" },
  { label: "Date inscription dans la formation", value: "date_inscription_formation" },
  { label: "Date d'entrée dans la formation", value: "date_entree_formation" },
  { label: "Date de fin de la formation", value: "date_fin_formation" },
  { label: "UAI de l'établissement responsable", value: "etablissement_responsable_uai" },
  { label: "SIRET de l'établissement responsable", value: "etablissement_responsable_siret" },
  { label: "UAI de l'établissement formateur", value: "etablissement_formateur_uai" },
  { label: "SIRET de l'établissement formateur", value: "etablissement_formateur_siret" },
  { label: "UAI de l'établissement du lieu de formation", value: "etablissement_lieu_de_formation_uai" },
  { label: "SIRET de l'établissement du lieu de formation", value: "etablissement_lieu_de_formation_siret" },
  { label: "Code CFD de la formation", value: "formation_cfd" },
  { label: "Dernière situation", value: "derniere_situation" },
  { label: "UAI du dernier organisme", value: "dernier_organisme_uai" },
  { label: "Type de CFA", value: "type_cfa" },
];
interface EffectifQueueItemViewProps {
  effectifQueueItem: any; // use zod typings
}

const buildValidationError = (validation_errors: Array<any>) => {
  return validation_errors.reduce((acc: object, { message, path }) => {
    return {
      ...acc,
      ...path.reduce((acc2, pathValue) => {
        return {
          ...acc2,
          [pathValue]: acc[pathValue] ? [...acc[pathValue], message] : [message],
        };
      }, {}),
    };
  }, {});
};

const DescriptionErrorListComponent = ({ errorList }) => (
  <UnorderedList>
    {errorList.map((err: string, index) => (
      <ListItem key={index}>
        <Text>{err}</Text>
      </ListItem>
    ))}
  </UnorderedList>
);

const EffectifQueueItemView = ({ effectifQueueItem }: EffectifQueueItemViewProps) => {
  const validationErrorFormated = buildValidationError(effectifQueueItem.validation_errors);
  return (
    <Box>
      {effectifQueueItem.source !== "televersement" ? (
        <Text color="#0063CB" fontSize={15} mt={5} mb={5}>
          <InfoIcon mr={2} />
          Veuillez corriger ces données directement dans votre ERP pour qu’elles soient correctement transmises.
        </Text>
      ) : (
        <Text color="#0063CB" fontSize={15} mt={5} mb={5}>
          <InfoIcon mr={2} />
          Veuillez prendre connaissance des erreurs. Si des questions persistent, veuillez{" "}
          <Link variant="link" color="inherit" href={TD_MANUEL_ELEMENT_LINK} isExternal>
            nous contacter
          </Link>
        </Text>
      )}

      <TableContainer>
        <Table variant="unstyled">
          <Tbody>
            {attributes.map((rowItem, index) => (
              <Tr key={index}>
                <Td fontStyle="italic">{rowItem.label}</Td>
                <Td>{rowItem.value}</Td>
                <Td fontWeight="bold">
                  {validationErrorFormated[rowItem.value] ? <WarningTwoIcon color="#CE0500" mr={1} /> : null}
                  {effectifQueueItem[rowItem.value]}
                  {validationErrorFormated[rowItem.value] ? (
                    <InfoTooltip
                      headerComponent={() => <Text>{rowItem.value}</Text>}
                      contentComponent={() => (
                        <DescriptionErrorListComponent errorList={validationErrorFormated[rowItem.value]} />
                      )}
                    />
                  ) : null}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EffectifQueueItemView;
