import { Text, Link, UnorderedList, OrderedList, ListItem, Img } from "@chakra-ui/react";
import React, { useState } from "react";

import AidePage from "@/components/Page/AidePage";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";

const AideSiret = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { auth } = useAuth();

  const [expandedIndex, setExpandedIndex] = useState<number | number[]>(0);

  return (
    <AidePage>
      <AidePage.Title>Siret et domiciliation</AidePage.Title>

      <AidePage.Header>
        <Text>
          Le numéro Siret (Système d’Identification du Répertoire des Etablissements) est le numéro d’immatriculation de
          chaque établissement d’une entreprise (l’unité légale). Il se compose de 14 chiffres attribués par l’INSEE. Le
          Siret permet l’identification de chaque établissement par les administrations et organismes publics. Une
          entreprise peut avoir plusieurs SIRET même si la majorité n’en possède qu’un seul (établissement unique).
        </Text>
      </AidePage.Header>

      <AidePage.Container
        sidebarContent={
          <AidePage.SidebarInfos title="Le saviez-vous ?">
            Si votre établissement change de Siret ou de coordonnées, n’oubliez pas de le mettre à jour sur votre compte
            Mon Activité Formation, et de le signaler à votre Carif-Oref, votre DREETS, le Rectorat de votre Académie et
            OPCO.
          </AidePage.SidebarInfos>
        }
      >
        <AidePage.DataResponsibility
          dataResponsibilityText="INSEE"
          dataResponsibilityLink="https://www.insee.fr/"
          modificationText="Guichet unique des entreprises"
          modificationLink="https://procedures.inpi.fr/?/"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "insee",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "guichet_unique_entreprises",
            })
          }
        />

        <AidePage.Ribbon
          title="Source de la donnée ‘Siret’"
          content="Cette donnée restituée sur votre espace ne peut être modifiée par le Tableau de bord. Le Siret, son état et sa domiciliation (adresse) affichés sur votre espace proviennent de la base INSEE, se consultent sur l’Annuaire des entreprises et se modifient sur le Guichet unique."
          modalTitle="Les données obligatoires à renseigner"
          modalContent={
            <>
              <Text>
                Le Siret de l’organisme est affiché sur le bandeau d’identité de votre espace, ainsi que son état (‘en
                activité’ ou ‘fermé’). Le Tableau de bord ne peut modifier directement cette donnée.
              </Text>

              <Text as="i">
                Source : Base INSEE (
                <AidePage.Link
                  href="https://annuaire-entreprises.data.gouv.fr/"
                  isExternal
                  textDecoration="underLine"
                  display="inline"
                >
                  Annuaire des entreprises
                </AidePage.Link>
                )
              </Text>
              <Img src="/images/aide/siret.png" alt="Exemple d'affichage de la donnée Siret" mt={6} />
            </>
          }
        />

        <AidePage.Accordion index={expandedIndex} onChange={setExpandedIndex} allowToggle mt={12}>
          <AidePage.AccordionItem title="Mon établissement a déménagé. Que dois-je faire ?">
            <Text>
              Lors d&apos;un changement d&apos;adresse, vous obtenez un nouveau Siret (dans cette situation, seuls les 5
              derniers chiffres de votre Siret changent). L&apos;ancien Siret est alors fermé. Vous devez déclarer le
              déménagement auprès du{" "}
              <AidePage.Link href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</AidePage.Link> pour
              recevoir votre nouvelle immatriculation, délivrée par l’INSEE.
            </Text>
            <Text>
              Pour garantir la mise à jour correcte de vos informations administratives et légales, n&apos;oubliez pas
              de signaler votre nouveau Siret à :
            </Text>
            <UnorderedList pl={2}>
              <ListItem>votre Carif-Oref régional,</ListItem>
              <ListItem>
                la DREETS (Direction Régionale de l&apos;Économie, de l&apos;Emploi, du Travail et des Solidarités),
              </ListItem>
              <ListItem>
                au Rectorat de votre Académie (voir les contacts dans l&apos;onglet dédié à l&apos;UAI),
              </ListItem>
              <ListItem>OPCO (Opérateur de Compétences) concerné(s),</ListItem>
              <ListItem>
                votre contact national ou régional, si votre CFA appartient à un réseau (ex : Chambre de Commerce et
                d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc...),
              </ListItem>
              <ListItem>
                et de le mettre à jour sur{" "}
                <AidePage.Link href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/">
                  Mon Activité Formation
                </AidePage.Link>
                .
              </ListItem>
            </UnorderedList>
            <Text>
              Concernant le Tableau de bord, demandez la suppression de votre compte utilisateur à{" "}
              <AidePage.Link href="https://tableaudebord-apprentissage.atlassian.net/servicedesk/customer/portal/3/group/14/create/52">
                notre service support
              </AidePage.Link>{" "}
              pour pouvoir ensuite créer un nouveau sur votre dernier SIRET.
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Le Siret indiqué sur mon espace me semble erroné. Comment le corriger ?">
            <Text>
              La donnée &quot;Siret&quot; et l&apos;état administratif de l&apos;organisme &quot;en activité&quot; ou
              &quot;fermé&quot; provient de l&apos;INSEE dont l&apos;une des missions est la charge du Système National
              d&apos;Identification et du Répertoire des Entreprises et de leurs Établissements (SIRENE). Le Référentiel
              UAI-SIRET utilise cette base ainsi que le Tableau de bord.
            </Text>
            <Text>Si le Siret sur votre espace Tableau de bord vous semble erroné :</Text>
            <OrderedList pl={2}>
              <ListItem>
                Vérifiez les informations de votre entreprise sur{" "}
                <AidePage.Link href="https://annuaire-entreprises.data.gouv.fr/">
                  l’Annuaire des entreprises
                </AidePage.Link>
              </ListItem>
              <ListItem>
                Si besoin, signalez un problème sur le{" "}
                <AidePage.Link href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</AidePage.Link>
              </ListItem>
              <ListItem>
                Assurez-vous que le bon Siret est bien communiqué aux différents acteurs (OPCO, DREETS, Rectorat,
                Carif-Oref, etc…)
              </ListItem>
            </OrderedList>
            <Text>
              Note : pour transmettre vos effectifs au Tableau de bord, l’état administratif du Siret de
              l’établissement, tel qu&apos;il est enregistré auprès de l’INSEE, doit être ouvert.
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Comment obtenir un Siret ? Mon établissement peut-il en avoir plusieurs ?">
            <Text>
              Le numéro Siret, composé de 14 chiffres, est délivré automatiquement après la demande
              d&apos;immatriculation de l&apos;entreprise sur le site internet des{" "}
              <AidePage.Link href="https://formalites.entreprises.gouv.fr/">formalités des entreprises</AidePage.Link>.
              Si vous n&apos;avez pas encore reçu ce numéro, vous pourrez suivre l&apos;évolution du traitement de votre
              demande sur ce même site internet.
            </Text>
            <Text>
              Une entreprise peut avoir plusieurs SIRET même si la majorité n&apos;en possède qu&apos;un seul
              (établissement unique).
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Sur mon espace, il est indiqué que mon établissement est 'Fermé'. Que dois-je faire ?">
            <Text>
              Cette information est tirée de la base INSEE. Un établissement est affiché &quot;Fermé&quot; suite à une
              cessation d&apos;activité ou un déménagement. Si vous avez créé un compte Tableau de bord sur un
              établissement considéré &quot;Fermé&quot;, aucun effectif en apprentissage ne devrait être transmis sur ce
              dernier. Si votre établissement a déménagé et possède un nouveau Siret, veuillez suivre les démarches
              mentionnées ci-dessus (
              <Link as="button" onClick={() => setExpandedIndex(0)} textDecoration="underLine" display="inline">
                &quot;Mon établissement a déménagé. Que dois-je faire ?&quot;
              </Link>
              ).
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Comment modifier l'adresse de mon établissement ?">
            <Text>
              Si la structure dont vous souhaitez modifier l&apos;adresse est une entreprise, son/sa dirigeant(e) peut
              modifier l&apos;adresse sur le{" "}
              <AidePage.Link href="https://www.inpi.fr/formalites-entreprises">
                guichet unique pour les déclarations de création et modification d&apos;entreprise
              </AidePage.Link>
              .
            </Text>
            <Text>
              Si la structure est une association, la démarche se fait sur le{" "}
              <AidePage.Link href="https://lecompteasso.associations.gouv.fr/">Compte Asso</AidePage.Link>.
            </Text>
            <Text>
              Une fois le changement d&apos;adresse validé, le Tableau de bord affichera automatiquement la nouvelle
              domiciliation.
            </Text>
          </AidePage.AccordionItem>
        </AidePage.Accordion>
      </AidePage.Container>
    </AidePage>
  );
};

export default AideSiret;
