"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useState } from "react";
import { GC_SUPPRESSION_COMPTE_ELEMENT_LINK } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import {
  AideContainer,
  AideDataResponsibility,
  AideExampleButton,
  AideExampleImage,
  AideHeader,
  AideLink,
  AideRibbon,
  AideSidebarInfos,
  AideTitle,
} from "../_components/AideSection";
import { useAideTypeUser } from "../useAideTypeUser";

const exampleModal = createModal({ id: "aide-siret-exemple", isOpenedByDefault: false });

const QUESTIONS = [
  "Mon établissement a déménagé. Que dois-je faire ?",
  "Le Siret indiqué sur mon espace me semble erroné. Comment le corriger ?",
  "Comment obtenir un Siret ? Mon établissement peut-il en avoir plusieurs ?",
  "Sur mon espace, il est indiqué que mon établissement est 'Fermé'. Que dois-je faire ?",
  "Comment modifier l'adresse de mon établissement ?",
];

export default function AideSiret() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const accordionProps = (index: number) => ({
    label: QUESTIONS[index],
    expanded: expandedIndex === index,
    onExpandedChange: (expanded: boolean) => setExpandedIndex(expanded ? index : null),
  });

  return (
    <>
      <AideTitle>Siret et domiciliation</AideTitle>

      <AideHeader>
        <p>
          Le numéro Siret (Système d’Identification du Répertoire des Etablissements) est le numéro d’immatriculation de
          chaque établissement d’une entreprise (l’unité légale). Il se compose de 14 chiffres attribués par l’INSEE. Le
          Siret permet l’identification de chaque établissement par les administrations et organismes publics. Une
          entreprise peut avoir plusieurs SIRET même si la majorité n’en possède qu’un seul (établissement unique).
        </p>
      </AideHeader>

      <AideContainer
        sidebarContent={
          <AideSidebarInfos title="Le saviez-vous ?">
            Si votre établissement change de Siret ou de coordonnées, n’oubliez pas de le mettre à jour sur votre compte
            Mon Activité Formation, et de le signaler à votre Carif-Oref, votre DREETS, le Rectorat de votre Académie et
            OPCO.
          </AideSidebarInfos>
        }
      >
        <AideDataResponsibility
          dataResponsibilityText="INSEE"
          dataResponsibilityLink="https://www.insee.fr/"
          modificationText="Guichet unique des entreprises"
          modificationLink="https://procedures.inpi.fr/?/"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "insee",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "guichet_unique_entreprises",
            })
          }
        />

        <AideRibbon
          title="Source de la donnée ‘Siret’"
          content="Cette donnée restituée sur votre espace ne peut être modifiée par le Tableau de bord. Le Siret, son état et sa domiciliation (adresse) affichés sur votre espace proviennent de la base INSEE, se consultent sur l’Annuaire des entreprises et se modifient sur le Guichet unique."
        >
          <AideExampleButton onClick={() => exampleModal.open()} />
        </AideRibbon>

        <exampleModal.Component title="Les données obligatoires à renseigner" size="large">
          <p>
            Le Siret de l’organisme est affiché sur le bandeau d’identité de votre espace, ainsi que son état (‘en
            activité’ ou ‘fermé’). Le Tableau de bord ne peut modifier directement cette donnée.
          </p>
          <p>
            <i>
              Source : Base INSEE (
              <AideLink href="https://annuaire-entreprises.data.gouv.fr/">Annuaire des entreprises</AideLink>)
            </i>
          </p>
          <AideExampleImage src="/images/aide/siret.png" alt="Exemple d'affichage de la donnée Siret" />
        </exampleModal.Component>

        <div className="fr-accordions-group">
          <Accordion {...accordionProps(0)}>
            <p>
              Lors d’un changement d’adresse, vous obtenez un nouveau Siret (dans cette situation, seuls les 5 derniers
              chiffres de votre Siret changent). L’ancien Siret est alors fermé. Vous devez déclarer le déménagement
              auprès du <AideLink href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</AideLink> pour
              recevoir votre nouvelle immatriculation, délivrée par l’INSEE.
            </p>
            <p>
              Pour garantir la mise à jour correcte de vos informations administratives et légales, n’oubliez pas de
              signaler votre nouveau Siret à :
            </p>
            <ul>
              <li>votre Carif-Oref régional,</li>
              <li>la DREETS (Direction Régionale de l’Économie, de l’Emploi, du Travail et des Solidarités),</li>
              <li>au Rectorat de votre Académie (voir les contacts dans l’onglet dédié à l’UAI),</li>
              <li>OPCO (Opérateur de Compétences) concerné(s),</li>
              <li>
                votre contact national ou régional, si votre CFA appartient à un réseau (ex : Chambre de Commerce et
                d’Industrie (CCI), Chambre de Métiers et de l’Artisanat (CMA), MFR, etc...),
              </li>
              <li>
                et de le mettre à jour sur{" "}
                <AideLink href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/">
                  Mon Activité Formation
                </AideLink>
                .
              </li>
            </ul>
            <p>
              Concernant le Tableau de bord, demandez la suppression de votre compte utilisateur à{" "}
              <AideLink href={GC_SUPPRESSION_COMPTE_ELEMENT_LINK}>notre service support</AideLink> pour pouvoir ensuite
              créer un nouveau sur votre dernier SIRET.
            </p>
          </Accordion>

          <Accordion {...accordionProps(1)}>
            <p>
              La donnée « Siret » et l’état administratif de l’organisme « en activité » ou « fermé » provient de
              l’INSEE dont l’une des missions est la charge du Système National d’Identification et du Répertoire des
              Entreprises et de leurs Établissements (SIRENE). Le Référentiel UAI-SIRET utilise cette base ainsi que le
              Tableau de bord.
            </p>
            <p>Si le Siret sur votre espace Tableau de bord vous semble erroné :</p>
            <ol>
              <li>
                Vérifiez les informations de votre entreprise sur{" "}
                <AideLink href="https://annuaire-entreprises.data.gouv.fr/">l’Annuaire des entreprises</AideLink>
              </li>
              <li>
                Si besoin, signalez un problème sur le{" "}
                <AideLink href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</AideLink>
              </li>
              <li>
                Assurez-vous que le bon Siret est bien communiqué aux différents acteurs (OPCO, DREETS, Rectorat,
                Carif-Oref, etc…)
              </li>
            </ol>
            <p>
              Note : pour transmettre vos effectifs au Tableau de bord, l’état administratif du Siret de
              l’établissement, tel qu’il est enregistré auprès de l’INSEE, doit être en activité.
            </p>
          </Accordion>

          <Accordion {...accordionProps(2)}>
            <p>
              Le numéro Siret, composé de 14 chiffres, est délivré automatiquement après la demande d’immatriculation de
              l’entreprise sur le site internet des{" "}
              <AideLink href="https://formalites.entreprises.gouv.fr/">formalités des entreprises</AideLink>. Si vous
              n’avez pas encore reçu ce numéro, vous pourrez suivre l’évolution du traitement de votre demande sur ce
              même site internet.
            </p>
            <p>
              Une entreprise peut avoir plusieurs SIRET même si la majorité n’en possède qu’un seul (établissement
              unique).
            </p>
          </Accordion>

          <Accordion {...accordionProps(3)}>
            <p>
              Cette information est tirée de la base INSEE. Un établissement est affiché « Fermé » suite à une cessation
              d’activité ou un déménagement. Si vous avez créé un compte Tableau de bord sur un établissement considéré
              « Fermé », aucun effectif en apprentissage ne devrait être transmis sur ce dernier. Si votre établissement
              a déménagé et possède un nouveau Siret, veuillez suivre les démarches mentionnées ci-dessus (
              <button type="button" className="fr-link" onClick={() => setExpandedIndex(0)}>
                « Mon établissement a déménagé. Que dois-je faire ? »
              </button>
              ).
            </p>
          </Accordion>

          <Accordion {...accordionProps(4)}>
            <p>
              Si la structure dont vous souhaitez modifier l’adresse est une entreprise, son/sa dirigeant(e) peut
              modifier l’adresse sur le{" "}
              <AideLink href="https://www.inpi.fr/formalites-entreprises">
                guichet unique pour les déclarations de création et modification d’entreprise
              </AideLink>
              .
            </p>
            <p>
              Si la structure est une association, la démarche se fait sur le{" "}
              <AideLink href="https://lecompteasso.associations.gouv.fr/">Compte Asso</AideLink>.
            </p>
            <p>
              Une fois le changement d’adresse validé, le Tableau de bord affichera automatiquement la nouvelle
              domiciliation.
            </p>
          </Accordion>
        </div>
      </AideContainer>
    </>
  );
}
