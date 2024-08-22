import { Text, UnorderedList, ListItem, Box } from "@chakra-ui/react";
import React from "react";

import Accordion from "@/components/Accordion/Accordion";
import AidePage from "@/components/Page/AidePage";
import TextHighlight from "@/components/Text/Highlight";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";

const AideQualiopi = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { auth } = useAuth();

  return (
    <AidePage>
      <AidePage.Title>Certification Qualiopi</AidePage.Title>

      <AidePage.Header>
        <Text>
          Le label Qualiopi est une certification permettant d&apos;attester de la qualité d&apos;un organisme de
          formation. Cette certification est obligatoire pour obtenir des financements publics.
        </Text>
        <Text>
          La certification Qualiopi est accordée à des organismes qui exercent des actions de formation, de bilan de
          compétences, de validation d&apos;acquis de l&apos;expérience ou d&apos;apprentissage. Elle permet à ces
          organismes d&apos;accéder à des financements publics.
        </Text>
        <Text>
          La certification Qualiopi est accordée par des tiers certificateurs sur la base d&apos;un référentiel national
          unique.
        </Text>
      </AidePage.Header>

      <AidePage.Container
        sidebarContent={
          <AidePage.SidebarInfos title="Le saviez-vous ?">
            La certification Qualiopi est valable trois ans. À l&apos;issue de cette période, un audit de renouvellement
            décide d&apos;une nouvelle période de certification, toujours de 3 ans.
          </AidePage.SidebarInfos>
        }
      >
        <AidePage.DataResponsibility
          dataResponsibilityText="Liste Publique"
          dataResponsibilityLink="https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/"
          modificationText="Organismes certificateurs"
          modificationLink="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "liste_publique",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "organismes_certificateurs",
            })
          }
        />

        <AidePage.Ribbon
          title="Source de la donnée ‘Qualiopi’"
          content={
            <>
              La donnée ‘certifié Qualiopi’ provient de la{" "}
              <AidePage.Link href="https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/">
                Liste Publique des Organismes de Formations
              </AidePage.Link>
              . Si cette information est erronée, merci de le signaler à votre organisme certificateur.
            </>
          }
        />

        <Accordion defaultIndex={0} allowToggle mt={12}>
          <Accordion.Item title="À quoi sert la Certification Qualiopi ?">
            <Text>
              La certification Qualiopi atteste de la qualité d&apos;une formation professionnelle. Plus globalement,
              elle offre une plus grande lisibilité à la formation professionnelle auprès des entreprises et des
              citoyens.
            </Text>
            <Text>Cette certification est valable 3 ans et renouvelable après audit.</Text>
            <Text>
              Depuis la loi Liberté de choisir son avenir professionnel de 2018, la certification Qualiopi est
              obligatoire afin d&apos;obtenir des financements publics ou mutualisés pour les organismes de formation
              pré-cités.
            </Text>
          </Accordion.Item>

          <Accordion.Item title="Quels sont les critères à respecter ?">
            <Text>
              Les critères à respecter pour être accrédité Qualiopi sont référencés dans un{" "}
              <AidePage.Link href="https://travail-emploi.gouv.fr/IMG/pdf/guide-lecture-referentiel-qualite.pdf">
                Référentiel national qualité
              </AidePage.Link>
              .
            </Text>
            <Text>
              Ce référentiel unique est organisé autour de 7 critères et 32 indicateurs, répartis entre ces critères.
            </Text>
            <Text>Les 7 critères évalués par les organismes certificateurs sont les suivants :</Text>
            <UnorderedList>
              <ListItem>
                Conditions d&apos;information du public sur les prestations proposées, les résultats et les délais
              </ListItem>
              <ListItem>L&apos;identification des objectifs des prestations proposées</ListItem>
              <ListItem>L&apos;adaptation des prestations proposées aux besoins des différents publics</ListItem>
              <ListItem>L&apos;adéquation entre moyens et objectifs des formations</ListItem>
              <ListItem>La qualification et les compétences du personnel chargé des formations</ListItem>
              <ListItem>La place de l&apos;organisme dans son environnement professionnel</ListItem>
              <ListItem>Le recueil et la prise en compte des appréciations et des réclamations</ListItem>
            </UnorderedList>
          </Accordion.Item>

          <Accordion.Item title="Sur mon espace Tableau de bord, il est indiqué que mon CFA n'est pas certifié Qualiopi. Comment corriger cette donnée ?">
            <Text>
              Les organismes de formation certifiés (action de formation, bilan de compétences, VAE, action de formation
              par apprentissage) sont identifiés sur la liste publique des organismes de formation, disponible sur la{" "}
              <AidePage.Link href="https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/">
                Plateforme ouverte des données publiques françaises
              </AidePage.Link>
              , depuis le 3 janvier 2022.
            </Text>
            <Text>
              Si l&apos;organisme n&apos;est pas identifié sur la liste publique ou s&apos;il constate une erreur sur le
              périmètre de sa certification, il doit contacter son organisme certificateur ou son instance de
              labellisation. Les établissements d&apos;enseignement supérieur mentionnés à l&apos;article L.6316-4
              doivent contacter la Direction générale de l&apos;enseignement supérieur et de l&apos;insertion
              professionnelle.
            </Text>
            <Text>
              <AidePage.Link
                href="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs"
                color="bluefrance"
              >
                Contacts des organismes certificateurs <Box as="i" className="ri-arrow-right-line" color="bluefrance" />
              </AidePage.Link>
            </Text>
          </Accordion.Item>

          <Accordion.Item title="Qui accorde la certification Qualiopi ?">
            <Text>
              La certification Qualiopi est délivrée par des organismes certificateurs accrédités par le Comité français
              d&apos;accréditation (Cofrac) ou par France Compétences.
            </Text>
            <Text>La liste des organismes certificateurs accrédités est consultable en ligne (voir ci-dessus).</Text>
            <TextHighlight>
              un organisme qui n&apos;est pas accrédité ne peut pas délivrer de certification Qualiopi.
            </TextHighlight>
          </Accordion.Item>

          <Accordion.Item title="Comment obtenir la certification Qualiopi ?">
            <Text>
              Si vous dirigez un organisme de formation et que vous souhaitez obtenir la certification Qualiopi, <br />
              vous devrez :
            </Text>
            <UnorderedList>
              <ListItem>
                Faire une demande de certification auprès d&apos;un organisme certificateur accrédité.
              </ListItem>
              <ListItem>
                Si votre organisme remplit les critères pré-cités et que la demande est acceptée, un contrat avec
                l&apos;organisme de certification
              </ListItem>
              <ListItem>Accepter un audit initial, puis un audit de surveillance au bout de 18 mois</ListItem>
            </UnorderedList>
          </Accordion.Item>
        </Accordion>
      </AidePage.Container>
    </AidePage>
  );
};

export default AideQualiopi;
