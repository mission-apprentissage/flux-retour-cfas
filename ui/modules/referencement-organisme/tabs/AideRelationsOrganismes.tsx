import { Img, ListItem, Table, Tbody, Td, Text, Th, Thead, Tr, UnorderedList } from "@chakra-ui/react";
import React from "react";
import { CONTACT_CARIF_OREF } from "shared";

import Accordion from "@/components/Accordion/Accordion";
import DownloadLink from "@/components/Links/DownloadLink";
import { BasicModal } from "@/components/Modals/BasicModal";
import AidePage from "@/components/Page/AidePage";
import TextHighlight from "@/components/Text/Highlight";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";

const ModalRelationsOrganismes = {
  title: "Affichage de la donnée 'Relations entre organismes'",
  content: (
    <>
      <Text>Les CFA responsables (ou gestionnaires) des formations d’un établissement sont indiqués.</Text>

      <Img src="/images/aide/relations_organismes.png" alt="Exemple d'affichage de la donnée Nature" mt={6} />
    </>
  ),
};

const ModalVerifierFormation = {
  title: "Identifier ses formations déclarées au Carif-Oref",
  content: (
    <>
      <Text>
        Sur votre fiche établissement, disponible dans l’onglet ‘Liste des organismes’ du Catalogue des formations,
        cliquez sur les formations associées. Chaque fiche formation restitue l’information sur l’organisme responsable
        et formateur (Nature).
      </Text>

      <Img src="/images/aide/relations_organismes.png" alt="Exemple d'affichage de la donnée Nature" mt={6} />
    </>
  ),
};

const AideRelationsOrganismes = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { auth } = useAuth();

  return (
    <AidePage>
      <AidePage.Title>Formations et relations entre organismes</AidePage.Title>

      <AidePage.Header>
        <Text>
          L’affichage des relations entre les organismes est basé sur la déclaration de l’offre de formation auprès des
          Carif-Oref. Ces dernières sont retranscrites dans le Catalogue des offres de formations, le Référentiel
          UAI-SIRET (onglet “Relations”) et le Tableau de bord de l’apprentissage.
        </Text>
      </AidePage.Header>

      <AidePage.Container
        sidebarContent={
          <AidePage.SidebarInfos title="Le saviez-vous ?">
            L’organisme responsable doit déclarer toutes ses formations auprès des différents Carif-Oref. S’il délègue
            la déclaration à un ou à ses organismes formateurs, il devra veiller à l’exhaustivité de l’offre de
            formation et à sa non-redondance.
          </AidePage.SidebarInfos>
        }
      >
        <AidePage.DataResponsibility
          dataResponsibilityText="Carif-Oref"
          dataResponsibilityLink="https://www.intercariforef.org/referencer-son-offre-de-formation"
          modificationText="Plateforme régionale du Carif-Oref"
          modificationLink="/pdf/Carif-Oref-contacts.pdf"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "carif_oref",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "plateforme_regional_carif_oref",
            })
          }
        />

        <AidePage.Ribbon
          title="Source de la donnée 'Relations entre organismes'"
          content={
            <>
              Cette donnée provient du{" "}
              <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/">
                Catalogue des offres de formations en apprentissage
              </AidePage.Link>
              , maintenu par le Réseau des Carif-Oref. Elle ne peut être modifiée directement par le Tableau de bord.
            </>
          }
          modalTitle={ModalRelationsOrganismes.title}
          modalContent={ModalRelationsOrganismes.content}
        />

        <Accordion defaultIndex={0} allowToggle mt={12}>
          <Accordion.Item title="Qu’est-ce que les relations entre organismes ?">
            <Text>
              Les relations entres les organismes sont identifiées au niveau de l’offre de formation en apprentissage
              collectée par les Carif-Oref. Chaque offre de formation peut être associée :
            </Text>
            <UnorderedList>
              <ListItem>
                à deux (ou plus) organismes : un “Responsable” (gestionnaire) et un “Formateur”, créant ainsi une
                relation entre eux (SIRET différents)
              </ListItem>
              <ListItem>
                un seul et même organisme qui est à la fois “Responsable et Formateur” (SIRET identique).
              </ListItem>
            </UnorderedList>
            <DownloadLink
              href="/pdf/vademecum-rco.pdf"
              fileType="PDF"
              fileSize="517 Ko"
              isExternal
              onClick={() =>
                trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                  type_user: auth ? auth.organisation.type : "public",
                  nom_fichier: "vademecum_rco",
                })
              }
            >
              Vademecum RCO
            </DownloadLink>
          </Accordion.Item>

          <Accordion.Item title="Une relation avec un organisme est affichée mais n’a plus lieu d’être. Comment la corriger ?">
            <AidePage.ModalButton
              buttonText="Voir un exemple"
              modalTitle={ModalRelationsOrganismes.title}
              modalContent={ModalRelationsOrganismes.content}
            />
            <Text>
              Cette donnée affichée vient de la base des Carif-Oref. Cela signifie qu’une offre a été déclarée en lien
              avec ce CFA. Les Carif-Oref transportent les offres tant que la session de formation déclarée n’a pas été
              terminée. Sur le{" "}
              <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/">
                Catalogue des offres de formations en apprentissage
              </AidePage.Link>
              , vérifiez les formations en cours déclarées. Si des informations sont erronées, veuillez contacter le
              service Formations de votre Carif-Oref régional ou écrire à{" "}
              <AidePage.Link href="mailto:support@intercariforef.org" isExternal>
                support@intercariforef.org
              </AidePage.Link>
              .
            </Text>
            <TextHighlight>
              Chaque OFA déclare son offre de formation auprès des Carif-Oref à partir des SIRET (et non des UAI).
            </TextHighlight>
            <DownloadLink
              href="/pdf/Carif-Oref-contacts.pdf"
              fileType="PDF"
              fileSize="417 Ko"
              isExternal
              onClick={() =>
                trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                  type_user: auth ? auth.organisation.type : "public",
                  nom_fichier: "carif_oref",
                })
              }
            >
              Liste des contacts des Carif-Oref
            </DownloadLink>
          </Accordion.Item>

          <Accordion.Item title="Dans la page “Mes organismes”, une information (UAI, Siret, adresse, etc.) sur un établissement doit être corrigée. Comment faire ?">
            <AidePage.ModalButton
              buttonText="Voir un exemple"
              modalTitle={ModalRelationsOrganismes.title}
              modalContent={ModalRelationsOrganismes.content}
            />
            <UnorderedList>
              <ListItem>
                Si il s’agit d’une UAI erronée, contactez le Référentiel UAI-SIRET de l’apprentissage (ONISEP) en
                apportant les précisions nécessaires :{" "}
                <AidePage.Link href="mailto:referentiel-uai-siret@onisep.fr" isExternal>
                  referentiel-uai-siret@onisep.fr
                </AidePage.Link>
              </ListItem>
              <ListItem>
                Si il s’agit de la domiciliation (adresse), les modifications doivent être réalisées sur le{" "}
                <AidePage.Link href="https://procedures.inpi.fr/?/">Guichet Unique (INPI)</AidePage.Link>.
              </ListItem>
              <ListItem>
                Si il s’agit d’un changement de SIRET, suite à un déménagement, assurez-vous de communiquer le nouveau
                SIRET aux instances concernées (Rectorat, Carif-Oref, MAF, DREETS, OPCO).
              </ListItem>
            </UnorderedList>
          </Accordion.Item>

          <Accordion.Item title="Dans la page “Mes organismes”, un établissement est manquant. Pourquoi et que faire ?">
            <Text>
              Si un (ou plusieurs) organisme(s), dont la gestion de ses formations est confiée à votre CFA, n’apparaît
              pas dans la liste, veuillez vous rapprocher de votre Carif-Oref afin de déclarer ou modifier la collecte
              des offres de formations, en vous connectant au SI régional (voir la liste ci-dessous).
            </Text>

            <TextHighlight>
              Sur le Catalogue des formations en apprentissage, vérifiez les{" "}
              <BasicModal
                renderTrigger={(onOpen) => (
                  <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={onOpen}>
                    formations
                  </span>
                )}
                title={ModalVerifierFormation.title}
                size="4xl"
              >
                {ModalVerifierFormation.content}
              </BasicModal>{" "}
              en cours déclarées.
            </TextHighlight>
            <DownloadLink
              href="/pdf/Carif-Oref-contacts.pdf"
              fileType="PDF"
              fileSize="417 Ko"
              isExternal
              onClick={() =>
                trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                  type_user: auth ? auth.organisation.type : "public",
                  nom_fichier: "carif_oref",
                })
              }
            >
              Liste des contacts des Carif-Oref
            </DownloadLink>
          </Accordion.Item>

          <Accordion.Item title="Comment contacter mon Carif-Oref régional et référencer mon offre de formation ?">
            <Text>
              En tant que CFA, vous devez déclarer votre offre de formation sur le site institutionnel (plateforme SI,
              tels que OFeli, Formanoo, Rafael, SOFI...). En cas de difficultés, veuillez contacter votre Carif-Oref.
            </Text>
            <Table variant="striped" size="md" mt={12} fontSize="omega">
              <Thead>
                <Tr>
                  <Th width="40%">Région</Th>
                  <Th width="30%">Plateforme</Th>
                  <Th width="20%">Téléphone</Th>
                  <Th width="10%">Email</Th>
                </Tr>
              </Thead>
              <Tbody>
                {CONTACT_CARIF_OREF.map((contact, index) => (
                  <Tr key={index}>
                    <Td fontWeight="bold">{contact.region}</Td>
                    <Td>
                      <AidePage.Link href={contact.link} isExternal textDecoration="underLine">
                        {contact.platform}
                      </AidePage.Link>
                    </Td>
                    <Td>{contact.phone}</Td>
                    <Td>
                      {contact.email !== "-" ? (
                        <AidePage.Link href={`mailto:${contact.email}`} isExternal>
                          {contact.email}
                        </AidePage.Link>
                      ) : (
                        contact.email
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Accordion.Item>
        </Accordion>
      </AidePage.Container>
    </AidePage>
  );
};

export default AideRelationsOrganismes;
