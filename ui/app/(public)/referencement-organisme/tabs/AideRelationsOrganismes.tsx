"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import {
  AideContainer,
  AideDataResponsibility,
  AideDownloadLink,
  AideExampleButton,
  AideExampleImage,
  AideHeader,
  AideLink,
  AideRibbon,
  AideSidebarInfos,
  AideTitle,
} from "../_components/AideSection";
import { CarifOrefContactTable } from "../_components/CarifOrefContactTable";
import { useAideTypeUser } from "../useAideTypeUser";

const relationsModal = createModal({ id: "aide-relations-exemple", isOpenedByDefault: false });
const verifierFormationModal = createModal({ id: "aide-relations-verifier-formation", isOpenedByDefault: false });
const correctionModal = createModal({ id: "aide-relations-correction", isOpenedByDefault: false });

const CARIF_OREF_CONTACTS_PDF = "/pdf/Carif-Oref-contacts.pdf";
const CATALOGUE_URL = "https://catalogue-apprentissage.intercariforef.org/";

export default function AideRelationsOrganismes() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();

  const trackFileDownload = (nomFichier: string) => () =>
    trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
      type_user: typeUser,
      nom_fichier: nomFichier,
    });

  return (
    <>
      <AideTitle>Formations et relations entre organismes</AideTitle>

      <AideHeader>
        <p>
          L’affichage des relations entre les organismes est basé sur la déclaration de l’offre de formation auprès des
          Carif-Oref. Ces dernières sont retranscrites dans le Catalogue des offres de formations, le Référentiel
          UAI-SIRET (onglet “Relations”) et le Tableau de bord de l’apprentissage.
        </p>
      </AideHeader>

      <AideContainer
        sidebarContent={
          <AideSidebarInfos title="Le saviez-vous ?">
            L’organisme responsable doit déclarer toutes ses formations auprès des différents Carif-Oref. S’il délègue
            la déclaration à un ou à ses organismes formateurs, il devra veiller à l’exhaustivité de l’offre de
            formation et à sa non-redondance.
          </AideSidebarInfos>
        }
      >
        <AideDataResponsibility
          dataResponsibilityText="Carif-Oref"
          dataResponsibilityLink="https://www.intercariforef.org/referencer-son-offre-de-formation"
          modificationText="Plateforme régionale du Carif-Oref"
          modificationLink={CARIF_OREF_CONTACTS_PDF}
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "carif_oref",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "plateforme_regional_carif_oref",
            })
          }
        />

        <AideRibbon
          title="Source de la donnée 'Relations entre organismes'"
          content={
            <>
              Cette donnée provient du{" "}
              <AideLink href={CATALOGUE_URL}>Catalogue des offres de formations en apprentissage</AideLink>, maintenu
              par le Réseau des Carif-Oref. Elle ne peut être modifiée directement par le Tableau de bord.
            </>
          }
        >
          <AideExampleButton onClick={() => relationsModal.open()} />
        </AideRibbon>

        <relationsModal.Component title="Affichage de la donnée 'Relations entre organismes'" size="large">
          <p>
            Les CFA responsables (ou gestionnaires) des formations d’un établissement sont restitués sur votre espace,
            dans le cas où une relation existe. Le Tableau de bord ne peut modifier cette donnée. Si vous constatez une
            erreur, veuillez contacter votre Carif-Oref régional.
          </p>
          <AideExampleImage
            src="/images/aide/relations_organismes.png"
            alt="Exemple d'affichage de la donnée Relations entre organismes"
          />
        </relationsModal.Component>

        <verifierFormationModal.Component title="Identifier ses formations déclarées au Carif-Oref" size="large">
          <p>
            Sur votre fiche établissement, disponible dans l’onglet ‘Liste des organismes’ du Catalogue des formations,
            cliquez sur les formations associées. Chaque fiche formation restitue l’information sur l’organisme
            responsable et formateur (Nature).
          </p>
          <AideExampleImage
            src="/images/aide/verifier_formation.png"
            alt="Exemple de fiche formation du Catalogue affichant l'organisme responsable et formateur"
          />
        </verifierFormationModal.Component>

        <correctionModal.Component title="Corriger des informations sur la page “Mes organismes”" size="large">
          <p>
            Sur la page “Mes organismes”, est affichée la liste des établissements dont votre CFA est gestionnaire. Si
            un site est manquant ou, au contraire, ne devrait pas (ou plus) apparaître, contactez votre Carif-Oref
            régional pour faire modifier la collecte de l’offre de formation.
          </p>
          <AideExampleImage
            src="/images/aide/correction_informations.png"
            alt="Exemple d'affichage de la page Mes organismes"
          />
        </correctionModal.Component>

        <div className="fr-accordions-group">
          <Accordion label="Qu’est-ce que les relations entre organismes ?" defaultExpanded>
            <p>
              Les relations entres les organismes sont identifiées au niveau de l’offre de formation en apprentissage
              collectée par les Carif-Oref. Chaque offre de formation peut être associée :
            </p>
            <ul>
              <li>
                à deux (ou plus) organismes : un “Responsable” (gestionnaire) et un “Formateur”, créant ainsi une
                relation entre eux (SIRET différents)
              </li>
              <li>un seul et même organisme qui est à la fois “Responsable et Formateur” (SIRET identique).</li>
            </ul>
            <AideDownloadLink
              href="/pdf/vademecum-rco.pdf"
              fileType="PDF"
              fileSize="517 Ko"
              onClick={trackFileDownload("vademecum_rco")}
            >
              Vademecum RCO
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Une relation avec un organisme est affichée mais n’a plus lieu d’être. Comment la corriger ?">
            <AideExampleButton onClick={() => relationsModal.open()} />
            <p>
              Cette donnée affichée vient de la base des Carif-Oref. Cela signifie qu’une offre a été déclarée en lien
              avec ce CFA. Les Carif-Oref transportent les offres tant que la session de formation déclarée n’a pas été
              terminée. Sur le{" "}
              <AideLink href={CATALOGUE_URL}>Catalogue des offres de formations en apprentissage</AideLink>, vérifiez
              les formations en cours déclarées. Si des informations sont erronées, veuillez contacter le service
              Formations de votre Carif-Oref régional ou écrire à{" "}
              <AideLink href="mailto:support@intercariforef.org">support@intercariforef.org</AideLink>.
            </p>
            <Highlight>
              Chaque OFA déclare son offre de formation auprès des Carif-Oref à partir des SIRET (et non des UAI).
            </Highlight>
            <AideDownloadLink
              href={CARIF_OREF_CONTACTS_PDF}
              fileType="PDF"
              fileSize="417 Ko"
              onClick={trackFileDownload("carif_oref")}
            >
              Liste des contacts des Carif-Oref
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Dans la page “Mes organismes”, une information (UAI, Siret, adresse, etc.) sur un établissement doit être corrigée. Comment faire ?">
            <AideExampleButton onClick={() => correctionModal.open()} />
            <ul>
              <li>
                Si il s’agit d’une UAI erronée, contactez le Référentiel UAI-SIRET de l’apprentissage (ONISEP) en
                apportant les précisions nécessaires :{" "}
                <AideLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</AideLink>
              </li>
              <li>
                Si il s’agit de la domiciliation (adresse), les modifications doivent être réalisées sur le{" "}
                <AideLink href="https://procedures.inpi.fr/?/">Guichet Unique (INPI)</AideLink>.
              </li>
              <li>
                Si il s’agit d’un changement de SIRET, suite à un déménagement, assurez-vous de communiquer le nouveau
                SIRET aux instances concernées (Rectorat, Carif-Oref, MAF, DREETS, OPCO).
              </li>
            </ul>
          </Accordion>

          <Accordion label="Dans la page “Mes organismes”, un établissement est manquant. Pourquoi et que faire ?">
            <p>
              Si un (ou plusieurs) organisme(s), dont la gestion de ses formations est confiée à votre CFA, n’apparaît
              pas dans la liste, veuillez vous rapprocher de votre Carif-Oref afin de déclarer ou modifier la collecte
              des offres de formations, en vous connectant au SI régional (voir la liste ci-dessous).
            </p>
            <Highlight>
              Sur le <AideLink href={CATALOGUE_URL}>Catalogue des offres de formations en apprentissage</AideLink> en
              apprentissage, vérifiez les{" "}
              <button type="button" className={fr.cx("fr-link")} onClick={() => verifierFormationModal.open()}>
                formations
              </button>{" "}
              en cours déclarées.
            </Highlight>
            <AideDownloadLink
              href={CARIF_OREF_CONTACTS_PDF}
              fileType="PDF"
              fileSize="417 Ko"
              onClick={trackFileDownload("carif_oref")}
            >
              Liste des contacts des Carif-Oref
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Comment contacter mon Carif-Oref régional et référencer mon offre de formation ?">
            <p>
              En tant que CFA, vous devez déclarer votre offre de formation sur le site institutionnel (plateforme SI,
              tels que OFeli, Formanoo, Rafael, SOFI...). En cas de difficultés, veuillez contacter votre Carif-Oref.
            </p>
            <CarifOrefContactTable />
          </Accordion>
        </div>
      </AideContainer>
    </>
  );
}
