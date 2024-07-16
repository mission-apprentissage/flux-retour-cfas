import { Text, UnorderedList, ListItem, Img, Flex } from "@chakra-ui/react";
import React, { useState } from "react";

import AidePage from "@/components/Page/AidePage";

const AideCodeRncp = () => {
  const [expandedIndex] = useState<number | number[]>(0);

  return (
    <AidePage>
      <AidePage.Title>Certification Professionnelle</AidePage.Title>

      <AidePage.Header>
        <Text>
          La donnée &quot;Nature&quot; est déduite des relations entre les organismes, déclarées lors du référencement
          des formations d’un organisme (base des Carif-Oref). Trois natures d&apos;organismes peuvent être observées :
          responsable, responsable et formateur, formateur.
        </Text>
      </AidePage.Header>

      <AidePage.Container
        sidebarContent={
          <AidePage.SidebarInfos title="Le saviez-vous ?">
            Seule une certification enregistrée au RNCP permet la délivrance d’un niveau de qualification reconnu par
            l’Etat (à la seule exception historique des bacs généraux et technologiques), lui-même reconnu dans le cadre
            européen des certifications.
          </AidePage.SidebarInfos>
        }
      >
        <AidePage.DataResponsibility
          dataResponsibilityText="France Compétences"
          dataResponsibilityLink="https://www.francecompetences.fr/recherche-resultats/"
          modificationText="Carif-Oref"
          modificationLink="https://procedures.inpi.fr/?/"
        />

        <AidePage.Ribbon
          title="Source de la donnée ‘Code RNCP’"
          content="La donnée ‘Code RNCP’ affichée sur le Tableau de bord provient des Carif-Oref. Si cette information est erronée, merci de leur signaler."
        />

        <AidePage.Accordion defaultIndex={expandedIndex} allowToggle mt={12}>
          <AidePage.AccordionItem title="À quoi sert une certification professionnelle ?">
            <Text>
              Une certification professionnelle permet d&apos;avoir une reconnaissance officielle des compétences et des
              connaissances professionnelles. Également, elle garantit une reconnaissance sur le marché du travail en
              facilitant l&apos;accès à l&apos;emploi et en sécurisant le parcours professionnel. Les certifications
              professionnelles sont classées par niveau de qualification et domaine d&apos;activité. Elles sont
              également constituées de blocs de compétences, ensembles homogènes et cohérents de compétences contribuant
              à l&apos;exercice autonome d&apos;une activité professionnelle et pouvant être évaluées et validées.
            </Text>
            <Flex align="center">
              <Img src="/images/ampoule.png" alt="Bon à savoir" height={5} width="auto" mr={2} mt={1} />
              <Text>
                <b>Bon à savoir :</b> Il revient aux CFA de se mettre à jour auprès de France Compétences :{" "}
              </Text>
            </Flex>
            <AidePage.DownloadLink href="/pdf/Vadémécum-RNCP-V1.1-VF-.pdf" fileType="PDF" fileSize="958 Ko" isExternal>
              Vademecum RNCP
            </AidePage.DownloadLink>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Comment vérifier ou rechercher mes certifications ?">
            <Text>
              Pour vérifier que le diplôme ou la certification est bien reconnu par l&apos;État, effectuez une recherche
              en cliquant sur{" "}
              <AidePage.Link href="https://www.francecompetences.fr/recherche-resultats/">ce lien</AidePage.Link> avec :
            </Text>
            <UnorderedList>
              <ListItem>
                l&apos;intitulé ou le code de la certification (RNCPXXXXX ou RSXXXXX), grâce à l&apos;aide de la
                suggestion automatique ;
              </ListItem>
              <ListItem>
                une expression en langage naturel, si vous ne connaissez pas précisément l&apos;intitulé ou le code de
                la certification.
              </ListItem>
            </UnorderedList>
            <Text>
              La consultation de la fiche d&apos;une certification vous permet d&apos;en vérifier les principales
              caractéristiques : si elle est en cours de validité, quels sont les organismes qui sont habilités pour la
              préparer, les compétences visées et pour le RNCP, le niveau de qualification et la structuration des blocs
              de compétences.
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Un code RNCP me semble erroné. Comment vérifier ou le corriger ?">
            <Text>
              Le code RNCP d&apos;une fiche formation issue du{" "}
              <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/formation/018817P01213885594860007038855948600070-67118%23L01">
                Catalogue
              </AidePage.Link>{" "}
              (Réseau Carif Oref) est déduit par l&apos;indexation réalisée par les Carif-Oref suite aux données
              déclarations sur la certification par l&apos;OFA. Veuillez contacter votre Carif-Oref pour signaler une
              erreur (fichier des contacts téléchargeable).
            </Text>
            <AidePage.DownloadLink
              href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
              fileType="PDF"
              fileSize="417 Ko"
              isExternal
            >
              Liste de contacts Carif-Oref
            </AidePage.DownloadLink>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Quelle est la période de validité d'un code RNCP ?">
            <Text>
              Un enregistrement au RNCP est de maximum 5 ans, dépassé ce délai toute fiche doit faire l&apos;objet
              d&apos;une demande de renouvellement.
            </Text>
            <Text>
              La date de fin de validité du RNCP est contrôlée pour les titres inscrits sur demande au RNCP. Si le RNCP
              n&apos;est plus valide, la formation est exclue du Catalogue des formations en apprentissage.
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Mes formations n'apparaissent pas toutes sur le Tableau de bord : comment corriger ?">
            <Text>
              Si toutes vos formations ne sont pas visibles sur votre espace Tableau de bord, cela signifie
              qu&apos;elles ne sont pas toutes correctement référencées sur le{" "}
              <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/">
                Catalogue de l&apos;offre de formation en apprentissage
              </AidePage.Link>
              . Veuillez les déclarer ou les modifier auprès du Carif-Oref de votre région. Les modifications seront
              ensuite visibles sur le Catalogue et le Tableau de bord.
            </Text>
          </AidePage.AccordionItem>
        </AidePage.Accordion>
      </AidePage.Container>
    </AidePage>
  );
};

export default AideCodeRncp;
