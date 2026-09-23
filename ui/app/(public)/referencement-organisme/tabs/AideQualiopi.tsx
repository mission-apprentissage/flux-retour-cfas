"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import {
  AideContainer,
  AideDataResponsibility,
  AideHeader,
  AideLink,
  AideRibbon,
  AideSidebarInfos,
  AideTitle,
} from "../_components/AideSection";
import { useAideTypeUser } from "../useAideTypeUser";

const LISTE_PUBLIQUE_OF_URL =
  "https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/";
const ORGANISMES_CERTIFICATEURS_URL =
  "https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs";

export default function AideQualiopi() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();

  return (
    <>
      <AideTitle>Certification Qualiopi</AideTitle>

      <AideHeader>
        <p>
          Le label Qualiopi est une certification permettant d’attester de la qualité d’un organisme de formation. Cette
          certification est obligatoire pour obtenir des financements publics.
        </p>
        <p>
          La certification Qualiopi est accordée à des organismes qui exercent des actions de formation, de bilan de
          compétences, de validation d’acquis de l’expérience ou d’apprentissage. Elle permet à ces organismes d’accéder
          à des financements publics.
        </p>
        <p>
          La certification Qualiopi est accordée par des tiers certificateurs sur la base d’un référentiel national
          unique.
        </p>
      </AideHeader>

      <AideContainer
        sidebarContent={
          <AideSidebarInfos title="Le saviez-vous ?">
            La certification Qualiopi est valable trois ans. À l’issue de cette période, un audit de renouvellement
            décide d’une nouvelle période de certification, toujours de 3 ans.
          </AideSidebarInfos>
        }
      >
        <AideDataResponsibility
          dataResponsibilityText="Liste Publique"
          dataResponsibilityLink={LISTE_PUBLIQUE_OF_URL}
          modificationText="Organismes certificateurs"
          modificationLink={ORGANISMES_CERTIFICATEURS_URL}
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "liste_publique",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "organismes_certificateurs",
            })
          }
        />

        <AideRibbon
          title="Source de la donnée ‘Qualiopi’"
          content={
            <>
              La donnée ‘certifié Qualiopi’ provient de la{" "}
              <AideLink href={LISTE_PUBLIQUE_OF_URL}>Liste Publique des Organismes de Formations</AideLink>. Si cette
              information est erronée, merci de le signaler à votre organisme certificateur.
            </>
          }
        />

        <div className="fr-accordions-group">
          <Accordion label="À quoi sert la Certification Qualiopi ?" defaultExpanded>
            <p>
              La certification Qualiopi atteste de la qualité d’une formation professionnelle. Plus globalement, elle
              offre une plus grande lisibilité à la formation professionnelle auprès des entreprises et des citoyens.
            </p>
            <p>Cette certification est valable 3 ans et renouvelable après audit.</p>
            <p>
              Depuis la loi Liberté de choisir son avenir professionnel de 2018, la certification Qualiopi est
              obligatoire afin d’obtenir des financements publics ou mutualisés pour les organismes de formation
              pré-cités.
            </p>
          </Accordion>

          <Accordion label="Quels sont les critères à respecter ?">
            <p>
              Les critères à respecter pour être accrédité Qualiopi sont référencés dans un{" "}
              <AideLink href="https://travail-emploi.gouv.fr/IMG/pdf/guide-lecture-referentiel-qualite.pdf">
                Référentiel national qualité
              </AideLink>
              .
            </p>
            <p>
              Ce référentiel unique est organisé autour de 7 critères et 32 indicateurs, répartis entre ces critères.
            </p>
            <p>Les 7 critères évalués par les organismes certificateurs sont les suivants :</p>
            <ul>
              <li>Conditions d’information du public sur les prestations proposées, les résultats et les délais</li>
              <li>L’identification des objectifs des prestations proposées</li>
              <li>L’adaptation des prestations proposées aux besoins des différents publics</li>
              <li>L’adéquation entre moyens et objectifs des formations</li>
              <li>La qualification et les compétences du personnel chargé des formations</li>
              <li>La place de l’organisme dans son environnement professionnel</li>
              <li>Le recueil et la prise en compte des appréciations et des réclamations</li>
            </ul>
          </Accordion>

          <Accordion label="Sur mon espace Tableau de bord, il est indiqué que mon CFA n'est pas certifié Qualiopi. Comment corriger cette donnée ?">
            <p>
              Les organismes de formation certifiés (action de formation, bilan de compétences, VAE, action de formation
              par apprentissage) sont identifiés sur la liste publique des organismes de formation, disponible sur la{" "}
              <AideLink href={LISTE_PUBLIQUE_OF_URL}>Plateforme ouverte des données publiques françaises</AideLink>,
              depuis le 3 janvier 2022.
            </p>
            <p>
              Si l’organisme n’est pas identifié sur la liste publique ou s’il constate une erreur sur le périmètre de
              sa certification, il doit contacter son organisme certificateur ou son instance de labellisation. Les
              établissements d’enseignement supérieur mentionnés à l’article L.6316-4 doivent contacter la Direction
              générale de l’enseignement supérieur et de l’insertion professionnelle.
            </p>
            <p>
              <AideLink href={ORGANISMES_CERTIFICATEURS_URL}>Contacts des organismes certificateurs</AideLink>
            </p>
          </Accordion>

          <Accordion label="Qui accorde la certification Qualiopi ?">
            <p>
              La certification Qualiopi est délivrée par des organismes certificateurs accrédités par le Comité français
              d’accréditation (Cofrac) ou par France Compétences.
            </p>
            <p>La liste des organismes certificateurs accrédités est consultable en ligne (voir ci-dessus).</p>
            <Highlight>un organisme qui n’est pas accrédité ne peut pas délivrer de certification Qualiopi.</Highlight>
          </Accordion>

          <Accordion label="Comment obtenir la certification Qualiopi ?">
            <p>
              Si vous dirigez un organisme de formation et que vous souhaitez obtenir la certification Qualiopi, vous
              devrez :
            </p>
            <ul>
              <li>Faire une demande de certification auprès d’un organisme certificateur accrédité.</li>
              <li>
                Si votre organisme remplit les critères pré-cités et que la demande est acceptée, un contrat avec
                l’organisme de certification
              </li>
              <li>Accepter un audit initial, puis un audit de surveillance au bout de 18 mois</li>
            </ul>
          </Accordion>
        </div>
      </AideContainer>
    </>
  );
}
