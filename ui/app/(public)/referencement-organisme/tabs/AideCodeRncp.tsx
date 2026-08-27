"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import {
  AideContainer,
  AideDataResponsibility,
  AideDownloadLink,
  AideHeader,
  AideLink,
  AideRibbon,
  AideSidebarInfos,
  AideTitle,
} from "../_components/AideSection";
import { useAideTypeUser } from "../useAideTypeUser";

export default function AideCodeRncp() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();

  const trackFileDownload = (nomFichier: string) => () =>
    trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
      type_user: typeUser,
      nom_fichier: nomFichier,
    });

  return (
    <>
      <AideTitle>Code RNCP et formations</AideTitle>

      <AideHeader>
        <p>
          Le Répertoire national des certifications professionnelles (RNCP) regroupe les certifications qui conduisent à
          un métier (attestant de toutes les compétences nécessaires à l’exercice d’un métier particulier) et les titres
          à finalité professionnelle (niveau 1 à 8) et certains CQP (certificats de qualification professionnelle).
          France Compétences assure la tenue de ce Répertoire.
        </p>
      </AideHeader>

      <AideContainer
        sidebarContent={
          <AideSidebarInfos title="Le saviez-vous ?">
            Seule une certification enregistrée au RNCP permet la délivrance d’un niveau de qualification reconnu par
            l’Etat (à la seule exception historique des bacs généraux et technologiques), lui-même reconnu dans le cadre
            européen des certifications.
          </AideSidebarInfos>
        }
      >
        <AideDataResponsibility
          dataResponsibilityText="France Compétences"
          dataResponsibilityLink="https://www.francecompetences.fr/recherche-resultats/"
          modificationText="Carif-Oref"
          modificationLink="/pdf/Carif-Oref-contacts.pdf"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "france_competences",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "carif_oref",
            })
          }
        />

        <AideRibbon
          title="Source de la donnée ‘Code RNCP’"
          content="La donnée ‘Code RNCP’ affichée sur le Tableau de bord provient des Carif-Oref. Si cette information est erronée, merci de leur signaler."
        />

        <div className="fr-accordions-group">
          <Accordion label="À quoi sert une certification professionnelle ?" defaultExpanded>
            <p>
              Une certification professionnelle permet d’avoir une reconnaissance officielle des compétences et des
              connaissances professionnelles. Également, elle garantit une reconnaissance sur le marché du travail en
              facilitant l’accès à l’emploi et en sécurisant le parcours professionnel. Les certifications
              professionnelles sont classées par niveau de qualification et domaine d’activité. Elles sont également
              constituées de blocs de compétences, ensembles homogènes et cohérents de compétences contribuant à
              l’exercice autonome d’une activité professionnelle et pouvant être évaluées et validées.
            </p>
            <Highlight>
              Il revient aux CFA de se mettre à jour auprès de France Compétences :{" "}
              <AideLink href="mailto:certificationprofessionnelle@francecompetences.fr">
                certificationprofessionnelle@francecompetences.fr
              </AideLink>
            </Highlight>
            <AideDownloadLink
              href="/pdf/Vadémécum-RNCP-V1.1-VF-.pdf"
              fileType="PDF"
              fileSize="958 Ko"
              onClick={trackFileDownload("vademecum_rncp")}
            >
              Vademecum RNCP
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Comment vérifier ou rechercher mes certifications ?">
            <p>
              Pour vérifier que le diplôme ou la certification est bien reconnu par l’État, effectuez une recherche en
              cliquant sur <AideLink href="https://www.francecompetences.fr/recherche-resultats/">ce lien</AideLink>{" "}
              avec :
            </p>
            <ul>
              <li>
                l’intitulé ou le code de la certification (RNCPXXXXX ou RSXXXXX), grâce à l’aide de la suggestion
                automatique ;
              </li>
              <li>
                une expression en langage naturel, si vous ne connaissez pas précisément l’intitulé ou le code de la
                certification.
              </li>
            </ul>
            <p>
              La consultation de la fiche d’une certification vous permet d’en vérifier les principales caractéristiques
              : si elle est en cours de validité, quels sont les organismes qui sont habilités pour la préparer, les
              compétences visées et pour le RNCP, le niveau de qualification et la structuration des blocs de
              compétences.
            </p>
          </Accordion>

          <Accordion label="Un code RNCP me semble erroné. Comment vérifier ou le corriger ?">
            <p>
              Le code RNCP d’une fiche formation issue du{" "}
              <AideLink href="https://catalogue-apprentissage.intercariforef.org/formation/018817P01213885594860007038855948600070-67118%23L01">
                Catalogue
              </AideLink>{" "}
              (Réseau Carif Oref) est déduit par l’indexation réalisée par les Carif-Oref suite aux données de
              déclarations sur la certification par l’OFA. Veuillez contacter votre Carif-Oref pour signaler une erreur
              (fichier des contacts téléchargeable).
            </p>
            <AideDownloadLink
              href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
              fileType="PDF"
              fileSize="417 Ko"
              onClick={trackFileDownload("liste_contacts_carif_oref")}
            >
              Liste de contacts Carif-Oref
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Quelle est la période de validité d'un code RNCP ?">
            <p>
              Un enregistrement au RNCP est de maximum 5 ans, dépassé ce délai toute fiche doit faire l’objet d’une
              demande de renouvellement.
            </p>
            <p>
              La date de fin de validité du RNCP est contrôlée pour les titres inscrits sur demande au RNCP. Si le RNCP
              n’est plus valide, la formation est exclue du Catalogue des offres de formations en apprentissage.
            </p>
          </Accordion>

          <Accordion label="Mes formations n'apparaissent pas toutes sur le Tableau de bord : comment corriger ?">
            <p>
              Si toutes vos formations ne sont pas visibles sur votre espace Tableau de bord, cela signifie qu’elles ne
              sont pas toutes correctement référencées sur le{" "}
              <AideLink href="https://catalogue-apprentissage.intercariforef.org/">
                Catalogue des offres de formations en apprentissage
              </AideLink>
              . Veuillez les déclarer ou les modifier auprès du Carif-Oref de votre région. Les modifications seront
              ensuite visibles sur le Catalogue et le Tableau de bord.
            </p>
          </Accordion>
        </div>
      </AideContainer>
    </>
  );
}
