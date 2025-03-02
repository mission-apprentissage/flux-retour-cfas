import { WarningIcon } from "@chakra-ui/icons";
import {
  Box,
  HStack,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
  Flex,
  Heading,
  ListItem,
  UnorderedList,
} from "@chakra-ui/react";
import React from "react";
import { SOURCE_APPRENANT, STATUT_NAME, SourceApprenant } from "shared";

import { calculateAge } from "@/common/utils/dateUtils";
import { formatSiretSplitted } from "@/common/utils/stringUtils";
import { CustomAccordion } from "@/components/Accordion/CustomAccordion";
import Tag from "@/components/Tag/Tag";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { PlainArrowRight } from "@/theme/components/icons/PlainArrowRight";

import ApprenantsDetailsForm from "./ApprenantsDetailsForm";

type Value = string | number | null | undefined;

const getValueOrFallback = (value: Value): string => {
  return value ? value.toString() : "Non renseignée";
};

const getValueOrFallBackElement = (value: Value) => {
  return value ? value.toString() : <Text color="orange.500">Non renseignée</Text>;
};

const getLastStatut = (statut: any) => {
  if (!statut || !statut.parcours || statut.parcours.length === 0) return { valeur: null, date: null };

  const lastStatut = statut.parcours.reduce((latest, current) => {
    return new Date(current.date) >= new Date(latest.date) ? current : latest;
  });

  return lastStatut;
};

const getRuptureText = (ruptureAt: Date) => {
  const formattedDate = new Date(ruptureAt).toLocaleDateString("fr-FR");
  return (
    <Text color="plaininfo" my={4}>
      Date de rupture du contrat : le{" "}
      <Text as="span" fontWeight="bold">
        {formattedDate}
      </Text>
    </Text>
  );
};
const getSourceText = (source: SourceApprenant, transmittedAt: Date) => {
  const formattedDate = new Date(transmittedAt).toLocaleDateString("fr-FR");
  const sourceLabel = source === SOURCE_APPRENANT.DECA ? "API DECA" : "CFA";
  const prefix = source === SOURCE_APPRENANT.DECA ? "l’" : "le ";

  return source in SOURCE_APPRENANT ? (
    <Text color="plaininfo" my={4}>
      Données transmises par {prefix}
      <Text as="span" fontWeight="bold">
        {sourceLabel}{" "}
      </Text>
      {transmittedAt ? (
        <>
          le{" "}
          <Text as="span" fontWeight="bold">
            {formattedDate}
          </Text>
        </>
      ) : (
        <>
          il y a{" "}
          <Text as="span" fontWeight="bold">
            plus de 2 semaines
          </Text>
        </>
      )}
      .
    </Text>
  ) : (
    <></>
  );
};

const ApprenantsDetails = ({ row, updateSituationState }) => {
  const id = row.original.id;
  const apprenant = row.original.apprenant;
  const statut = row.original.statut;
  const organisme = row.original.organisme;
  const formation = row.original.formation;
  const users = row.original.users;
  const contrat = row.original.contrat;
  const lastStatut = getLastStatut(statut);
  const sourceText = getSourceText(row.original.source, row.original.transmitted_at);

  return (
    <Box borderWidth="2px" borderStyle="solid" borderColor="#E3E3FD" p={4} mt={3}>
      <Flex bg="white" gap={2}>
        <Box p={6} flex="1" bg="#F9F8F6">
          <Heading as="h3" color="gray.900" fontSize="gamma" fontWeight="700" mb={3}>
            Ses informations
          </Heading>
          {sourceText}
          <Table variant="list" width="100%">
            <Tbody>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Dernier statut déclaré
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  <Tag
                    leftIcon={WarningIcon}
                    primaryText={getValueOrFallback(STATUT_NAME[lastStatut.valeur] as Value)}
                    colorScheme="redlight_tag"
                    variant="badge"
                    w="fit-content"
                    rounded="full"
                    pl={2}
                    pr={4}
                  />
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Nom
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.nom)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Prénom
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.prenom)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Date de naissance
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(new Date(apprenant.date_de_naissance).toLocaleDateString())}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Sexe
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.sexe)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Âge
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(calculateAge(apprenant.date_de_naissance))}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Code postal et ville de résidence
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(
                    apprenant.adresse ? `${apprenant.adresse.code_postal} ${apprenant.adresse.commune}` : null
                  )}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Téléphone
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.telephone)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Email
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.courriel)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Téléphone du responsable légal
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.representant_legal?.telephone)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  Email du responsable légal
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.representant_legal?.courriel)}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold" width="50%">
                  RQTH
                </Td>
                <Td width="50%" whiteSpace="nowrap">
                  {getValueOrFallback(apprenant.rqth)}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>
        <ApprenantsDetailsForm
          effectifId={id}
          situationData={row.original.situation_data}
          updateSituationState={updateSituationState}
        />
      </Flex>

      <CustomAccordion collapsible>
        {/* Son organisme de formation */}
        <CustomAccordion.Item value="Son organisme de formation">
          <CustomAccordion.Trigger bg="#F9F8F6" border={0}>
            {({ isExpanded }) => <TriggerHeader isExpanded={isExpanded} title="Son organisme de formation" />}
          </CustomAccordion.Trigger>
          <CustomAccordion.Content>
            <TableContainer p={3}>
              <Table variant="list">
                <Tbody>
                  <Tr>
                    <Td fontWeight="bold">Raison sociale</Td>
                    <Td whiteSpace="nowrap">{getValueOrFallback(organisme.nom)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Code postal et ville</Td>
                    <Td>
                      {getValueOrFallback(
                        organisme.adresse ? `${organisme.adresse.code_postal} ${organisme.adresse.commune}` : null
                      )}
                    </Td>
                  </Tr>
                  {users.map((user, index) => (
                    <>
                      <Tr>
                        <Td fontWeight="bold">
                          Compte utilisateur {index}{" "}
                          <InfoTooltip
                            headerComponent={() => "Compte utilisateur du CFA"}
                            contentComponent={() => (
                              <Box>
                                <Text>
                                  Coordonnées de la personne ayant créé un compte utilisateur pour son CFA sur le
                                  Tableau de bord de l’apprentissage.
                                </Text>
                              </Box>
                            )}
                          />
                        </Td>
                        <Td>{getValueOrFallback(`${user.prenom} ${user.nom}`)}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Fonction</Td>
                        <Td>{getValueOrFallback(user.fonction)}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Email</Td>
                        <Td>{getValueOrFallback(user.email)}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Téléphone</Td>
                        <Td>{getValueOrFallback(user.telephone)}</Td>
                      </Tr>
                    </>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CustomAccordion.Content>
        </CustomAccordion.Item>

        {/* Sa formation */}
        <CustomAccordion.Item value="Sa formation">
          <CustomAccordion.Trigger bg="#F9F8F6" border={0}>
            {({ isExpanded }) => <TriggerHeader isExpanded={isExpanded} title="Sa formation" />}
          </CustomAccordion.Trigger>
          <CustomAccordion.Content>
            <TableContainer p={3}>
              <Table variant="list">
                <Tbody>
                  <Tr>
                    <Td fontWeight="bold">Intitulé</Td>
                    <Td>{getValueOrFallback(formation.libelle_long)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Date d&apos;entrée en formation</Td>
                    <Td>
                      {getValueOrFallback(
                        formation.date_entree ? new Date(formation.date_entree).toLocaleDateString() : null
                      )}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Date d&apos;inscription en formation</Td>
                    <Td>
                      {getValueOrFallback(
                        formation.date_inscription ? new Date(formation.date_inscription).toLocaleDateString() : null
                      )}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Date théorique de fin</Td>
                    <Td>
                      {getValueOrFallback(
                        formation.date_fin ? new Date(formation.date_fin).toLocaleDateString() : null
                      )}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">
                      Niveau{" "}
                      <InfoTooltip
                        popoverWidth="lg"
                        headerComponent={() => "Niveaux de formation"}
                        contentComponent={() => (
                          <Box>
                            <Text>Nomenclature des diplômes par niveau :</Text>
                            <UnorderedList mt={4}>
                              <ListItem>3 : CAP, BEP</ListItem>
                              <ListItem>4 : Baccalauréat</ListItem>
                              <ListItem>5 : DEUG, BTS, DUT, DEUST</ListItem>
                              <ListItem>6 : Licence, licence professionnelle, BUT, Maîtrise</ListItem>
                              <ListItem>
                                7 : Master, diplôme d’études approfondies, diplôme d’études supérieures spécialisées,
                                diplôme d’ingénieur
                              </ListItem>
                              <ListItem>8 : Doctorat, habilitation à diriger des recherches</ListItem>
                            </UnorderedList>
                          </Box>
                        )}
                      />
                    </Td>
                    <Td>{getValueOrFallback(formation.niveau_libelle)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Durée théorique en mois</Td>
                    <Td>{getValueOrFallback(formation.duree_formation_relle)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Code RNCP</Td>
                    <Td>{getValueOrFallback(formation.rncp)}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </CustomAccordion.Content>
        </CustomAccordion.Item>
        {contrat && (
          <CustomAccordion.Item value="Son contrat d'apprentissage">
            <CustomAccordion.Trigger bg="#F9F8F6" border={0}>
              {({ isExpanded }) => <TriggerHeader isExpanded={isExpanded} title="Son contrat d'apprentissage" />}
            </CustomAccordion.Trigger>
            <CustomAccordion.Content>
              <TableContainer p={3}>
                <Table variant="list">
                  <Tbody>
                    {contrat.date_rupture && <Tr>{getRuptureText(contrat.date_rupture)}</Tr>}
                    <Tr>
                      <Td fontWeight="bold">Date d&apos;exéctuion du contrat </Td>
                      <Td>
                        {getValueOrFallBackElement(
                          contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString() : null
                        )}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Date de fin du contrat </Td>
                      <Td>
                        {getValueOrFallBackElement(
                          contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString() : null
                        )}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Motif de rupture du contrat </Td>
                      <Td>{getValueOrFallBackElement(contrat.cause_rupture)}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">N° SIRET de l&apos;employeur </Td>
                      <Td>{getValueOrFallBackElement(formatSiretSplitted(contrat.siret))}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Dénomination </Td>
                      <Td>{getValueOrFallBackElement(contrat.denomination)}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">NAF </Td>
                      <Td>{getValueOrFallBackElement(contrat.naf)}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Code postal et commune de l&apos;employeur </Td>
                      <Td>
                        {getValueOrFallBackElement(
                          `${contrat.adresse?.code_postal ?? ""} ${contrat.adresse?.commune ?? ""}`.trim()
                        )}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </CustomAccordion.Content>
          </CustomAccordion.Item>
        )}
      </CustomAccordion>
    </Box>
  );
};

const TriggerHeader = ({ isExpanded, title }) => (
  <HStack flex="1" spacing={4}>
    <PlainArrowRight boxSize={7} color="bluefrance" transform={isExpanded ? "rotate(90deg)" : undefined} />
    <Text fontWeight="bold">{title}</Text>
  </HStack>
);

export default ApprenantsDetails;
