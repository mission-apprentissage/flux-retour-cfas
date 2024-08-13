import { Text, Flex, Img, OrderedList, ListItem } from "@chakra-ui/react";
import React from "react";
import { UAI_INCONNUE_CAPITALIZE, UAI_INCONNUE_TAG_FORMAT } from "shared";

import AidePage from "@/components/Page/AidePage";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";

const ModalUai = {
  title: "Exemple d'affichage de la donnée UAI",
  content: (
    <>
      <Text>
        L’UAI d’un organisme est affiché sur le bandeau d’identité de votre espace. Ce dernier peut être ‘Inconnu’. Le
        Tableau de bord ne peut modifier directement cette donnée.
      </Text>

      <Text as="i">
        Source :{" "}
        <AidePage.Link href="https://referentiel.apprentissage.onisep.fr/organismes">
          Référentiel UAI-SIRET des OFA-CFA
        </AidePage.Link>{" "}
        (ONISEP)
      </Text>
      <Img src="/images/aide/uai.png" alt="Exemple d'affichage de la donnée Siret" mt={6} />
    </>
  ),
};

const AideUai = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { auth } = useAuth();

  return (
    <AidePage>
      <AidePage.Title>UAI (Unité Administrative Immatriculée)</AidePage.Title>

      <AidePage.Header>
        <Text>
          Le numéro UAI (Unité Administrative Immatriculée) est composé de 7 chiffres et 1 lettre. C’est un code
          attribué par le Ministère de l’Éducation nationale, dans le répertoire académique et ministériel sur les
          établissements du système éducatif (RAMSESE) aux établissements du système éducatif (écoles, collèges, lycées,
          CFA, établissements d’enseignement supérieur, public ou privé). Il est utilisé pour les identifier dans
          différentes bases de données et systèmes administratifs. L’UAI s’obtient auprès des services du rectorat de
          l’académie où se situe le CFA.
        </Text>
      </AidePage.Header>

      <AidePage.Container
        sidebarContent={
          <Flex direction="column">
            <AidePage.SidebarInfos title="Le saviez-vous ?">
              Chaque CFA doit disposer d’un numéro de déclaration d’activité (NDA) et d’un numéro UAI unique. Ce dernier
              s’obtient auprès des services du rectorat de l’académie (RAMSESE) où se situe le CFA. L’absence de ce
              numéro bloque l’enregistrement des contrats d’apprentissage.
            </AidePage.SidebarInfos>
            <AidePage.SidebarTips title="Astuce : chercher une UAI">
              Pour rechercher votre numéro UAI, consultez le site{" "}
              <AidePage.Link href="https://www.education.gouv.fr/acce_public/index.php">ACCE</AidePage.Link> (Éducation
              Nationale).
            </AidePage.SidebarTips>
          </Flex>
        }
      >
        <AidePage.DataResponsibility
          dataResponsibilityText="Rectorat (RAMSESE)"
          dataResponsibilityLink="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf"
          modificationText="Référentiel"
          modificationLink="mailto:referentiel-uai-siret@onisep.fr"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "rectorat_ramsese",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "referentiel_uai_siret",
            })
          }
        />

        <AidePage.Ribbon
          title="Source de la donnée ‘UAI’"
          content={
            <>
              Cette donnée ne peut être modifiée directement par le Tableau de bord. L’UAI affiché sur votre espace
              Tableau de bord provient du{" "}
              <AidePage.Link href="https://referentiel.apprentissage.onisep.fr/organismes">
                Référentiel UAI-SIRET
              </AidePage.Link>{" "}
              de l’ONISEP.
            </>
          }
          modalTitle={ModalUai.title}
          modalContent={ModalUai.content}
        />

        <AidePage.FileCard
          category="ACADÉMIES"
          title="Télécharger le fichier des contacts"
          description="Emails et téléphones"
          fileType="PDF"
          fileSize="81 Ko"
          downloadLink="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf"
          onClick={() =>
            trackPlausibleEvent("referencement_telechargement_tuile_uai", undefined, {
              type_user: auth ? auth.organisation.type : "public",
            })
          }
        />

        <AidePage.Accordion defaultIndex={0} allowToggle mt={12}>
          <AidePage.AccordionItem
            title={`Mon UAI est signalée "${UAI_INCONNUE_CAPITALIZE}" sur mon espace Tableau de bord mais j'en possède une.`}
          >
            <AidePage.ModalButton
              buttonText="Voir un exemple"
              modalTitle={ModalUai.title}
              modalContent={ModalUai.content}
            />
            <Text>
              Si votre numéro UAI est répertorié comme « {UAI_INCONNUE_TAG_FORMAT} » alors que votre organisme en
              possède un, vous devez le communiquer en écrivant à{" "}
              <AidePage.Link href="mailto:referentiel-uai-siret@onisep.fr">
                referentiel-uai-siret@onisep.fr
              </AidePage.Link>{" "}
              avec la fiche UAI, afin qu&apos;il soit mis à jour. L&apos;absence de ce numéro bloque
              l&apos;enregistrement des contrats d&apos;apprentissage. N&apos;oubliez pas que votre UAI devra être
              reporté sur le CERFA.
            </Text>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Le numéro UAI indiqué sur mon espace me semble erroné. Comment le corriger ?">
            <Text>
              Sur votre espace Tableau de bord de l&apos;apprentissage, l&apos;UAI associé à votre SIRET et
              établissement provient du Référentiel UAI-SIRET de l&apos;ONISEP. Si l&apos;UAI vous semble erroné,
              veuillez écrire un email demandant la modification (et en la justifiant), à{" "}
              <AidePage.Link href="mailto:referentiel-uai-siret@onisep.fr">
                referentiel-uai-siret@onisep.fr
              </AidePage.Link>{" "}
              ou bien directement au service académique en charge de RAMSESE (répertoire académique et ministériel sur
              les établissements du système éducatif). Une expertise sera alors réalisée par le service.
            </Text>

            <AidePage.DownloadLink
              href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf"
              fileType="PDF"
              fileSize="81 Ko"
              isExternal
              onClick={() =>
                trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                  type_user: auth ? auth.organisation.type : "public",
                  nom_fichier: "contact_rectorat_uai_ramsese",
                })
              }
            >
              Liste de contacts des services académiques
            </AidePage.DownloadLink>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Mon établissement ne possède pas d'UAI. Où et comment en faire la demande ?">
            <Text>
              Votre numéro UAI s&apos;obtient auprès des services du rectorat de votre académie. Téléchargez, remplissez
              le formulaire ci-dessous, et retournez-le complété au service académique pour l&apos;immatriculation
              d&apos;un OF-CFA adressé au Répertoire Académique et Ministériel sur les Établissements du Système
              Éducatif (RAMSESE).
            </Text>
            <Flex gap={6}>
              <AidePage.DownloadLink
                href="/pdf/formulaire-immatriculation-uai-pour-of_cfa.pdf"
                fileType="PDF"
                fileSize="105 Ko"
                isExternal
                onClick={() =>
                  trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                    type_user: auth ? auth.organisation.type : "public",
                    nom_fichier: "formulaire_immatriculation_uai_of_cfa",
                  })
                }
              >
                Formulaire UAI
              </AidePage.DownloadLink>{" "}
              <AidePage.DownloadLink
                href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf"
                fileType="PDF"
                fileSize="81 Ko"
                isExternal
                onClick={() =>
                  trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                    type_user: auth ? auth.organisation.type : "public",
                    nom_fichier: "contact_rectorat_uai_ramsese",
                  })
                }
              >
                Liste des contacts des services académiques
              </AidePage.DownloadLink>
            </Flex>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Mon établissement délègue la gestion des contrats à un CFA et je n'ai pas d'UAI.">
            <Text>
              Dans le cadre de la formation en apprentissage en France, si votre établissement formateur est distinct de
              l&apos;établissement gestionnaire / responsable qui porte les contrats, vous avez besoin d&apos;un numéro
              UAI (Unité Administrative Immatriculée) pour identifier spécifiquement votre établissement de formation.
              Veuillez prendre contact avec le Rectorat (RAMSESE) de votre Académie.
            </Text>
            <AidePage.DownloadLink
              href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf"
              fileType="PDF"
              fileSize="81 Ko"
              isExternal
              onClick={() =>
                trackPlausibleEvent("referencement_telechargement_fichier", undefined, {
                  type_user: auth ? auth.organisation.type : "public",
                  nom_fichier: "contact_rectorat_uai_ramsese",
                })
              }
            >
              Liste de contacts des services académiques
            </AidePage.DownloadLink>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Un organisme ne devrait pas apparaître dans le Tableau de bord et le Référentiel.">
            <Text>
              Si un organisme ne devrait pas être présent dans le référentiel (par exemple s&apos;il s&apos;agit
              d&apos;une école maternelle ou élémentaire), merci de le signaler à l&apos;adresse mail suivante :{" "}
              <AidePage.Link href="mailto:referentiel-uai-siret@onisep.fr">
                referentiel-uai-siret@onisep.fr
              </AidePage.Link>{" "}
              pour demander le retrait des listes de cet organisme.
            </Text>
            <Text>
              Veuillez noter que le Référentiel contient 97% d&apos;OFA-CFA validés sur le territoire national. Ils sont
              :
            </Text>
            <OrderedList pl={2}>
              <ListItem>identifiés par un SIRET</ListItem>
              <ListItem>
                trouvés dans la{" "}
                <AidePage.Link
                  href="https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/"
                  isExternal
                >
                  Liste publique des Organismes de Formation
                </AidePage.Link>{" "}
                (Data.gouv), la base{" "}
                <AidePage.Link href="https://www.education.gouv.fr/acce_public/index.php">ACCE</AidePage.Link> et le{" "}
                <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements">
                  Catalogue des formations en apprentissage
                </AidePage.Link>{" "}
                (base des Carif-Oref)
              </ListItem>
              <ListItem>en lien avec des formations en apprentissage à un moment donné</ListItem>
            </OrderedList>
          </AidePage.AccordionItem>

          <AidePage.AccordionItem title="Qu'est-ce que le Référentiel UAI-SIRET de l'ONISEP ?">
            <Text>Le Référentiel contient 97% d&apos;OFA-CFA validés sur le territoire national. Ils sont :</Text>
            <OrderedList pl={2}>
              <ListItem>identifiés par un SIRET</ListItem>
              <ListItem>
                trouvés dans la{" "}
                <AidePage.Link href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf">
                  Liste publique des Organismes de Formation
                </AidePage.Link>{" "}
                (Data.gouv), la base{" "}
                <AidePage.Link href="https://www.education.gouv.fr/acce_public/index.php">ACCE</AidePage.Link> et le{" "}
                <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements">
                  Catalogue des formations en apprentissage
                </AidePage.Link>{" "}
                (base des Carif-Oref)
              </ListItem>
              <ListItem>en lien avec des formations en apprentissage à un moment donné</ListItem>
            </OrderedList>
            <Text>
              Le Référentiel UAI-SIRET s&apos;assure que chaque établissement en apprentissage est correctement
              identifié. Toutes les administrations et parties prenantes concernées (Rectorats, DREETS, etc...) doivent
              s&apos;y référer.
            </Text>
          </AidePage.AccordionItem>
        </AidePage.Accordion>
      </AidePage.Container>
    </AidePage>
  );
};

export default AideUai;
