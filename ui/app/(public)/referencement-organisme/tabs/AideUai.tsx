"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { UAI_INCONNUE_CAPITALIZE, UAI_INCONNUE_TAG_FORMAT } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import {
  AideContainer,
  AideDataResponsibility,
  AideDownloadLink,
  AideExampleButton,
  AideExampleImage,
  AideFileCard,
  AideHeader,
  AideLink,
  AideRibbon,
  AideSidebarInfos,
  AideSidebarTips,
  AideTitle,
} from "../_components/AideSection";
import { useAideTypeUser } from "../useAideTypeUser";

const exampleModal = createModal({ id: "aide-uai-exemple", isOpenedByDefault: false });

const CONTACTS_RECTORAT_PDF = "/pdf/Contact-Rectorat-UAI-RAMSESE.pdf";
const LISTE_PUBLIQUE_OF_URL =
  "https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/";

const ReferentielSourceList = () => (
  <ol>
    <li>identifiés par un SIRET</li>
    <li>
      trouvés dans la <AideLink href={LISTE_PUBLIQUE_OF_URL}>Liste publique des Organismes de Formation</AideLink>{" "}
      (Data.gouv), la base <AideLink href="https://www.education.gouv.fr/acce_public/index.php">ACCE</AideLink> et le{" "}
      <AideLink href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements">
        Catalogue des offres de formations en apprentissage
      </AideLink>{" "}
      (base des Carif-Oref)
    </li>
    <li>en lien avec des formations en apprentissage à un moment donné</li>
  </ol>
);

export default function AideUai() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();

  const trackFileDownload = (nomFichier: string) => () =>
    trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
      type_user: typeUser,
      nom_fichier: nomFichier,
    });

  return (
    <>
      <AideTitle>UAI (Unité Administrative Immatriculée)</AideTitle>

      <AideHeader>
        <p>
          Le numéro UAI (Unité Administrative Immatriculée) est composé de 7 chiffres et 1 lettre. C’est un code
          attribué par le Ministère de l’Éducation nationale, dans le répertoire académique et ministériel sur les
          établissements du système éducatif (RAMSESE) aux établissements du système éducatif (écoles, collèges, lycées,
          CFA, établissements d’enseignement supérieur, public ou privé). Il est utilisé pour les identifier dans
          différentes bases de données et systèmes administratifs. L’UAI s’obtient auprès des services du rectorat de
          l’académie où se situe le CFA.
        </p>
      </AideHeader>

      <AideContainer
        sidebarContent={
          <>
            <AideSidebarInfos title="Le saviez-vous ?">
              Chaque CFA doit disposer d’un numéro de déclaration d’activité (NDA) et d’un numéro UAI unique. Ce dernier
              s’obtient auprès des services du rectorat de l’académie (RAMSESE) où se situe le CFA. L’absence de ce
              numéro bloque l’enregistrement des contrats d’apprentissage.
            </AideSidebarInfos>
            <AideSidebarTips title="Astuce : chercher une UAI">
              Pour rechercher votre numéro UAI, consultez le site{" "}
              <AideLink href="https://www.education.gouv.fr/acce_public/index.php">ACCE</AideLink> (Éducation
              Nationale).
            </AideSidebarTips>
          </>
        }
      >
        <AideDataResponsibility
          dataResponsibilityText="Rectorat (RAMSESE)"
          dataResponsibilityLink={CONTACTS_RECTORAT_PDF}
          modificationText="Référentiel"
          modificationLink="mailto:referentiel-uai-siret@onisep.fr"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "rectorat_ramsese",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: typeUser,
              nom_responsable: "referentiel_uai_siret",
            })
          }
        />

        <AideRibbon
          title="Source de la donnée ‘UAI’"
          content={
            <>
              Cette donnée ne peut être modifiée directement par le Tableau de bord. L’UAI affiché sur votre espace
              Tableau de bord provient du{" "}
              <AideLink href="https://referentiel.apprentissage.onisep.fr/organismes">Référentiel UAI-SIRET</AideLink>{" "}
              de l’ONISEP.
            </>
          }
        >
          <AideExampleButton onClick={() => exampleModal.open()} />
        </AideRibbon>

        <exampleModal.Component title="Exemple d'affichage de la donnée UAI" size="large">
          <p>
            L’UAI d’un organisme est affiché sur le bandeau d’identité de votre espace. Ce dernier peut être ‘Inconnu’.
            Le Tableau de bord ne peut modifier directement cette donnée.
          </p>
          <p>
            <i>
              Source :{" "}
              <AideLink href="https://referentiel.apprentissage.onisep.fr/organismes">
                Référentiel UAI-SIRET des OFA-CFA
              </AideLink>{" "}
              (ONISEP)
            </i>
          </p>
          <AideExampleImage src="/images/aide/uai.png" alt="Exemple d'affichage de la donnée UAI" />
        </exampleModal.Component>

        <AideFileCard
          category="ACADÉMIES"
          title="Télécharger le fichier des contacts"
          description="Emails et téléphones"
          fileType="PDF"
          fileSize="81 Ko"
          downloadLink={CONTACTS_RECTORAT_PDF}
          onClick={() =>
            trackPlausibleEvent("referencement_telechargement_tuile_uai", undefined, { type_user: typeUser })
          }
        />

        <div className="fr-accordions-group">
          <Accordion
            label={`Mon UAI est signalée "${UAI_INCONNUE_CAPITALIZE}" sur mon espace Tableau de bord mais j'en possède une.`}
            defaultExpanded
          >
            <AideExampleButton onClick={() => exampleModal.open()} />
            <p>
              Si votre numéro UAI est répertorié comme « {UAI_INCONNUE_TAG_FORMAT} » alors que votre organisme en
              possède un, vous devez le communiquer en écrivant à{" "}
              <AideLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</AideLink> avec la
              fiche UAI, afin qu’il soit mis à jour. L’absence de ce numéro bloque l’enregistrement des contrats
              d’apprentissage. N’oubliez pas que votre UAI devra être reporté sur le CERFA.
            </p>
          </Accordion>

          <Accordion label="Le numéro UAI indiqué sur mon espace me semble erroné. Comment le corriger ?">
            <p>
              Sur votre espace Tableau de bord de l’apprentissage, l’UAI associé à votre SIRET et établissement provient
              du Référentiel UAI-SIRET de l’ONISEP. Si l’UAI vous semble erroné, veuillez écrire un email demandant la
              modification (et en la justifiant), à{" "}
              <AideLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</AideLink> ou bien
              directement au service académique en charge de RAMSESE (répertoire académique et ministériel sur les
              établissements du système éducatif). Une expertise sera alors réalisée par le service.
            </p>
            <AideDownloadLink
              href={CONTACTS_RECTORAT_PDF}
              fileType="PDF"
              fileSize="81 Ko"
              onClick={trackFileDownload("contact_rectorat_uai_ramsese")}
            >
              Liste de contacts des services académiques
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Mon établissement ne possède pas d'UAI. Où et comment en faire la demande ?">
            <p>
              Votre numéro UAI s’obtient auprès des services du rectorat de votre académie. Téléchargez, remplissez le
              formulaire ci-dessous, et retournez-le complété au service académique pour l’immatriculation d’un OF-CFA
              adressé au Répertoire Académique et Ministériel sur les Établissements du Système Éducatif (RAMSESE).
            </p>
            <AideDownloadLink
              href="/pdf/formulaire-immatriculation-uai-pour-of_cfa.pdf"
              fileType="PDF"
              fileSize="105 Ko"
              onClick={trackFileDownload("formulaire_immatriculation_uai_of_cfa")}
            >
              Formulaire UAI
            </AideDownloadLink>
            <AideDownloadLink
              href={CONTACTS_RECTORAT_PDF}
              fileType="PDF"
              fileSize="81 Ko"
              onClick={trackFileDownload("contact_rectorat_uai_ramsese")}
            >
              Liste des contacts des services académiques
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Mon établissement délègue la gestion des contrats à un CFA et je n'ai pas d'UAI.">
            <p>
              Dans le cadre de la formation en apprentissage en France, si votre établissement formateur est distinct de
              l’établissement gestionnaire / responsable qui porte les contrats, vous avez besoin d’un numéro UAI (Unité
              Administrative Immatriculée) pour identifier spécifiquement votre établissement de formation. Veuillez
              prendre contact avec le Rectorat (RAMSESE) de votre Académie.
            </p>
            <AideDownloadLink
              href={CONTACTS_RECTORAT_PDF}
              fileType="PDF"
              fileSize="81 Ko"
              onClick={trackFileDownload("contact_rectorat_uai_ramsese")}
            >
              Liste de contacts des services académiques
            </AideDownloadLink>
          </Accordion>

          <Accordion label="Un organisme ne devrait pas apparaître dans le Tableau de bord et le Référentiel.">
            <p>
              Si un organisme ne devrait pas être présent dans le référentiel (par exemple s’il s’agit d’une école
              maternelle ou élémentaire), merci de le signaler à l’adresse mail suivante :{" "}
              <AideLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</AideLink> pour
              demander le retrait des listes de cet organisme.
            </p>
            <p>
              Veuillez noter que le Référentiel contient 97% d’OFA-CFA validés sur le territoire national. Ils sont :
            </p>
            <ReferentielSourceList />
          </Accordion>

          <Accordion label="Qu'est-ce que le Référentiel UAI-SIRET de l'ONISEP ?">
            <p>Le Référentiel contient 97% d’OFA-CFA validés sur le territoire national. Ils sont :</p>
            <ReferentielSourceList />
            <p>
              Le Référentiel UAI-SIRET s’assure que chaque établissement en apprentissage est correctement identifié.
              Toutes les administrations et parties prenantes concernées (Rectorats, DREETS, etc...) doivent s’y
              référer.
            </p>
          </Accordion>
        </div>
      </AideContainer>
    </>
  );
}
