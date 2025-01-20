import {
  Box,
  Button,
  HStack,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
  Flex,
  Heading,
  Select,
  Textarea,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";
import React, { useState } from "react";

import { calculateAge } from "@/common/utils/dateUtils";
import { CustomAccordion } from "@/components/Accordion/CustomAccordion";
import { PlainArrowRight } from "@/theme/components/icons/PlainArrowRight";

type Value = string | number | null | undefined;

const getValueOrFallback = (value: Value): React.ReactNode => {
  return value ? <Text>{value}</Text> : <Text color="orange.500">Non renseignée</Text>;
};

const getLastStatut = (statut: any) => {
  if (!statut || !statut.parcours || statut.parcours.length === 0) return { valeur: null, date: null };

  const lastStatut = statut.parcours.reduce((latest, current) => {
    return new Date(current.date) > new Date(latest.date) ? current : latest;
  });

  return lastStatut;
};

const ApprenantsDetails = ({ row }) => {
  const [statutCorrect, setStatutCorrect] = useState("");
  const [franceTravail, setFranceTravail] = useState("");
  const [apprenantStatut, setApprenantStatut] = useState<boolean>(false);

  const apprenant = row.original.apprenant;
  const statut = row.original.statut;
  const organisme = row.original.organisme;
  const formation = row.original.formation;
  const users = row.original.users;
  const lastStatut = getLastStatut(statut);

  return (
    <Box borderWidth="2px" borderStyle="solid" borderColor="#E3E3FD" p={4} mt={3}>
      <Flex bg="white" gap={2}>
        <Box p={6} flex="1" bg="#F9F8F6">
          <Heading as="h3" color="gray.900" fontSize="gamma" fontWeight="700" mb={3}>
            Ses informations
          </Heading>
          <Table variant="list">
            <Tbody>
              <Tr>
                <Td fontWeight="bold">Nom</Td>
                <Td>{getValueOrFallback(apprenant.nom)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Prénom</Td>
                <Td>{getValueOrFallback(apprenant.prenom)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Date de naissance</Td>
                <Td>{getValueOrFallback(new Date(apprenant.date_de_naissance).toLocaleDateString())}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Sexe</Td>
                <Td>{getValueOrFallback(apprenant.sexe)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Âge</Td>
                <Td>{getValueOrFallback(calculateAge(apprenant.date_de_naissance))}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Code postal et ville de résidence</Td>
                <Td>
                  {getValueOrFallback(
                    apprenant.adresse ? `${apprenant.adresse.code_postal} ${apprenant.adresse.commune}` : null
                  )}
                </Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Téléphone</Td>
                <Td>{getValueOrFallback(apprenant.telephone)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Email</Td>
                <Td>{getValueOrFallback(apprenant.courriel)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Téléphone du responsable légal</Td>
                <Td>{getValueOrFallback(apprenant.representant_legal?.telephone)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Email du responsable légal</Td>
                <Td>{getValueOrFallback(apprenant.representant_legal?.courriel)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">RQTH</Td>
                <Td>{getValueOrFallback(apprenant.rqth)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Dernier statut déclaré</Td>
                <Td>{getValueOrFallback(lastStatut.valeur)}</Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>
        <Box p={6} flex="1" maxW="600px" mx="auto" bg="#F9F8F6">
          <Heading as="h3" color="gray.900" fontSize="gamma" fontWeight="700" mb={4}>
            Vos commentaires et retours
          </Heading>

          <Text as="span" fontWeight="bold" color="bluefrance" mb={4}>
            Il a été indiqué que le jeune a été contacté le 21/11/2024 .
          </Text>

          <Box my={4}>
            <Text fontSize="md" mb={3}>
              1. Le statut du jeune affiché est-il correct ?
            </Text>
            <RadioGroup
              onChange={(value) => {
                setStatutCorrect(value);
                setApprenantStatut(value === "non");
              }}
              value={statutCorrect}
            >
              <HStack spacing={4}>
                <Radio value="oui">Oui</Radio>
                <Radio value="non">Non</Radio>
              </HStack>
            </RadioGroup>

            {apprenantStatut && (
              <>
                <Text fontSize="sm" mt={4} mb={2}>
                  Veuillez préciser son statut actuel.
                </Text>
                <Select placeholder="Sélectionner une option">
                  <option value="contacte_soutien">Contrat signé non démarré</option>
                  <option value="contacte_pas_de_suivi">Retour en voie scolaire initiale</option>
                  <option value="deja_accompagne">Abandon de la formation</option>
                  <option value="injoignable">Rupture de contrat d’apprentissage</option>
                  <option value="non_contacte">Décrochage (abandon)</option>
                  <option value="non_contacte">Autre raison</option>
                </Select>
              </>
            )}
          </Box>

          <Box mb={6}>
            <Text fontSize="md" mb={3}>
              2. Le jeune est-il inscrit à France Travail ?
            </Text>
            <RadioGroup onChange={setFranceTravail} value={franceTravail}>
              <HStack spacing={4}>
                <Radio value="oui">Oui</Radio>
                <Radio value="non">Non</Radio>
                <Radio value="je_ne_sais_pas">Je ne sais pas</Radio>
              </HStack>
            </RadioGroup>
          </Box>

          <Box mb={6}>
            <Text fontSize="md" mb={3}>
              3. Notez ici des informations recueillies auprès du jeune et sa situation, que vous jugez utiles de
              partager.{" "}
              <Text as="span" fontSize="sm" color="gray.500">
                (200 caractères maximum)
              </Text>
            </Text>
            <Textarea placeholder="Vos retours sur l’accompagnement du jeune" maxLength={200} />
          </Box>
          <Flex justifyContent="flex-end">
            <Button variant="secondary" size={"sm"}>
              Enregistrer
            </Button>
          </Flex>
        </Box>
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
                    <Td>{getValueOrFallback(organisme.nom)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Code postal et ville</Td>
                    <Td>{getValueOrFallback(organisme.departement)}</Td>
                  </Tr>
                  {users.map((user, index) => (
                    <>
                      <Tr>
                        <Td fontWeight="bold">Compte utilisateur {index}</Td>
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
                    <Td>{getValueOrFallback(formation.intitule)}</Td>
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
                    <Td fontWeight="bold">Niveau</Td>
                    <Td>{getValueOrFallback(formation.niveau)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Durée théorique en mois</Td>
                    <Td>{getValueOrFallback(formation.duree_formation_relle)}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Code RNCP</Td>
                    <Td>{getValueOrFallback(formation.code_rncp)}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </CustomAccordion.Content>
        </CustomAccordion.Item>
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
