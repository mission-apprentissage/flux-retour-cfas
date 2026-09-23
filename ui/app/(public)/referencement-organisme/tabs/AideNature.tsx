"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import {
  AideContainer,
  AideDataResponsibility,
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
import { CarifOrefContactTable } from "../_components/CarifOrefContactTable";
import { useAideTypeUser } from "../useAideTypeUser";

const natureModal = createModal({ id: "aide-nature-exemple", isOpenedByDefault: false });
const natureInconnueModal = createModal({ id: "aide-nature-inconnue", isOpenedByDefault: false });
const natureFormationModal = createModal({ id: "aide-nature-formation", isOpenedByDefault: false });

const CARIF_OREF_CONTACTS_PDF = "/pdf/Carif-Oref-contacts.pdf";
const REFERENCER_OFFRE_URL = "https://www.intercariforef.org/referencer-son-offre-de-formation";
const CATALOGUE_URL = "https://catalogue-apprentissage.intercariforef.org/";

export default function AideNature() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();

  return (
    <>
      <AideTitle>Nature, référencement de vos offres de formation en apprentissage</AideTitle>

      <AideHeader>
        <p>
          La donnée « Nature » est déduite des relations entre les organismes, déclarées lors du référencement des
          formations d’un organisme (base des Carif-Oref). Trois natures d’organismes peuvent être observées :
          responsable, responsable et formateur, formateur.
        </p>
      </AideHeader>

      <AideContainer
        sidebarContent={
          <>
            <AideSidebarInfos title="Le saviez-vous ?">
              Il est essentiel que votre offre de formation en apprentissage (et continue) soit correctement référencée
              auprès de votre Carif-Oref régional afin d’en assurer la visibilité auprès de multiples outils et systèmes
              d’information, dont le Tableau de bord.
            </AideSidebarInfos>
            <AideSidebarTips title="Les Carif-Oref en régions">
              Les Carif-Oref sont missionnés par les acteurs emploi/formation régionaux pour collecter l’offre de
              formation continue et en apprentissage afin d’en assurer une large diffusion auprès des jeunes, des
              salariés, des demandeurs d’emploi et personnes en reconversion. Cette offre est diffusée via des sites web
              institutionnels régionaux et nationaux.
            </AideSidebarTips>
          </>
        }
      >
        <AideDataResponsibility
          dataResponsibilityText="Carif-Oref"
          dataResponsibilityLink={REFERENCER_OFFRE_URL}
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
          title="Source de la donnée ‘Nature’"
          content="Cette donnée provient du Catalogue des offres de formation en apprentissage et ne peut être modifiée directement par le Tableau de bord. La nature affichée sur votre espace Tableau de bord est déduite des relations entre les organismes qui proviennent de la base des Carif-Oref."
        >
          <AideExampleButton onClick={() => natureModal.open()} />
        </AideRibbon>

        <natureModal.Component title="Exemple d'affichage de la donnée Nature" size="large">
          <p>
            La nature de votre organisme est affichée sur le bandeau d’identité sur votre espace Tableau de bord, ainsi
            que sur le Référentiel UAI-SIRET de l’ONISEP. Le Tableau de bord ne peut modifier directement cette donnée.
          </p>
          <AideExampleImage src="/images/aide/nature.png" alt="Exemple d'affichage de la donnée Nature" />
        </natureModal.Component>

        <natureInconnueModal.Component title="Affichage d’une nature ‘Inconnue’" size="large">
          <p>
            Si la cellule contient « inconnue », cela signifie que l’offre de formation n’est pas collectée par le
            Carif-Oref. Veuillez déclarer vos formations en apprentissage auprès du Carif-Oref régional.
          </p>
          <AideExampleImage src="/images/aide/nature_inconnue.png" alt="Affichage d’une nature ‘Inconnue’" />
        </natureInconnueModal.Component>

        <natureFormationModal.Component title="Identifier ses formations déclarées au Carif-Oref" size="large">
          <p>
            Sur votre fiche établissement, disponible dans l’onglet ‘Liste des organismes’ du Catalogue des formations,
            cliquez sur les formations associées. Chaque fiche formation restitue l’information sur l’organisme
            responsable et formateur (Nature).
          </p>
          <AideExampleImage
            src="/images/aide/nature_formation.png"
            alt="Identifier ses formations déclarées au Carif-Oref"
          />
        </natureFormationModal.Component>

        <AideFileCard
          category="CARIF-OREF"
          title="Télécharger le fichier"
          description="Plateforme régionale, emails et téléphones"
          fileType="PDF"
          fileSize="417 Ko"
          downloadLink={CARIF_OREF_CONTACTS_PDF}
          onClick={() =>
            trackPlausibleEvent("referencement_telechargement_tuile_nature", undefined, { type_user: typeUser })
          }
        />

        <div className="fr-accordions-group">
          <Accordion label={`Qu'est-ce que la donnée "Nature" ?`} defaultExpanded>
            <AideExampleButton onClick={() => natureModal.open()} />
            <p>
              Lors du référencement d’une offre de formation, le <AideLink href={CATALOGUE_URL}>Catalogue</AideLink> des
              formations en apprentissage identifie trois natures :
            </p>
            <ul>
              <li>
                Un organisme <strong>responsable</strong> (OFA « classique » ou « hors les murs ») :
                <ul>
                  <li>est signataire de la convention de formation en apprentissage ;</li>
                  <li>demande et reçoit l’accord de prise en charge de l’OPCO ;</li>
                  <li>est responsable auprès de l’administration du respect de ses missions et obligations ;</li>
                  <li>réceptionne les vœux formulés par les jeunes pour Affelnet ;</li>
                  <li>délègue la formation à un autre organisme de formation dans le cadre d’une convention.</li>
                </ul>
              </li>
              <li>
                Un organisme <strong>responsable et formateur</strong> dispense également des actions de formation en
                plus des missions mentionnées ci-dessus.
              </li>
              <li>
                Un organisme <strong>formateur</strong>
                <ul>
                  <li>est garant du respect de la mise en œuvre pédagogique de la formation.</li>
                  <li>il peut être appelé prestataire de formation, et peut également être connu sous le nom d’UFA.</li>
                </ul>
              </li>
            </ul>
            <Highlight>
              Si la cellule contient « inconnue », cela signifie que l’organisme n’a pas déclaré son offre de formation
              dans la base de son Carif-Oref. Voici ci-dessous comment la déclarer ou la corriger.
            </Highlight>
          </Accordion>

          <Accordion label="Si ma nature est indiquée “Inconnue”, comment la corriger ?">
            <AideExampleButton onClick={() => natureInconnueModal.open()} />
            <p>
              Si la cellule contient « inconnue », cela signifie que l’offre de formation n’est pas collectée par le
              Carif-Oref. Nous vous invitons à référencer vos formations en apprentissage auprès du{" "}
              <AideLink href={REFERENCER_OFFRE_URL}>Carif-Oref régional</AideLink>.
            </p>
          </Accordion>

          <Accordion label="Comment déclarer une formation en apprentissage à mon Carif-Oref, ou en ajouter une ?">
            <ol>
              <li>
                Si votre CFA n’a jamais déclaré ses formations auprès de son Carif-Oref :
                <p>
                  Pour ajouter une offre de formation au Catalogue, merci de la déclarer auprès du Carif-Oref de votre
                  région en allant sur la page{" "}
                  <AideLink href={REFERENCER_OFFRE_URL}>« référencer son offre de formation »</AideLink>. Les
                  référencements et mises à jour effectuées dans les bases “Offre des Carif-Oref” sont répercutés
                  quotidiennement dans le “Catalogue des offres de formations en apprentissage” (délai 72h entre
                  modifications demandées et publication).
                </p>
              </li>
              <li>
                Si votre CFA a déjà déclaré ses formations auprès de votre Carif-Oref :
                <p>
                  Votre formation devrait figurer dans le Catalogue. Si ce n’est pas le cas, merci de nous signaler
                  votre situation par mail :{" "}
                  <AideLink href="mailto:pole-apprentissage@intercariforef.org">
                    pole-apprentissage@intercariforef.org
                  </AideLink>{" "}
                  avec les informations suivantes :
                </p>
                <ul>
                  <li>SIRET ;</li>
                  <li>RNCP et/ou le code diplôme ;</li>
                  <li>
                    la période d’inscription telle que mentionnée dans le catalogue Carif-Oref (exprimée en AAAA-MM) ;
                  </li>
                  <li>le lieu de la formation (code commune INSEE ou à défaut code postal) ;</li>
                  <li>
                    mail de la personne signalant l’erreur ;
                    <p>
                      Une investigation sera menée par le Réseau des Carif-Oref pour le traitement de cette anomalie. Il
                      reviendra vers vous dès la résolution de ce dysfonctionnement via le mail que vous avez indiqué.
                    </p>
                  </li>
                </ul>
              </li>
            </ol>
          </Accordion>

          <Accordion label="La nature indiquée sur mon espace est incorrecte. Comment la corriger ?">
            <AideExampleButton onClick={() => natureFormationModal.open()} />
            <p>
              Pour comprendre son origine, allez dans l’onglet ‘
              <AideLink href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements">
                Liste des organismes
              </AideLink>
              ’ du Catalogue et cherchez votre établissement avec un UAI ou Siret. Sur la fiche de votre organisme,
              cliquez sur les formations associées. Chaque fiche formation restitue un organisme responsable et
              formateur.
            </p>
            <p>
              Si la nature associée à votre organisme vous semble incorrecte, il se peut que l’offre de formation est
              mal collectée par le Carif-Oref. Il faudra donc la faire vérifier par votre Carif-Oref régional (contacts
              régionaux téléchargeables ci-dessus).
            </p>
            <p>La modification de la nature d’un organisme impacte ses relations avec les autres organismes.</p>
          </Accordion>

          <Accordion label="Pourquoi déclarer mon offre de formation ?">
            <p>Vous assurez la visibilité de votre catalogue de formations auprès d’un panel de visiteurs variés :</p>
            <ul>
              <li>
                Visiteurs du{" "}
                <AideLink href="https://www.intercariforef.org/formations/recherche-formations.html">
                  portail interrégional formation emploi
                </AideLink>
                , site national du réseau des Carif-Oref
              </li>
              <li>
                Visiteurs grand public du site national{" "}
                <AideLink href="https://labonnealternance.apprentissage.beta.gouv.fr/">
                  « La bonne alternance »
                </AideLink>
              </li>
              <li>
                Utilisateurs grand public de la page{" "}
                <AideLink href="https://candidat.francetravail.fr/formations/recherche?range=0-9&tri=0">
                  « Trouver ma formation »
                </AideLink>{" "}
                du site France Travail
              </li>
              <li>
                Visiteurs du site <AideLink href="https://www.1jeune1solution.gouv.fr/">#1jeune1solution</AideLink>
              </li>
            </ul>
            <p>Auprès du public professionnel, tels que les prescripteurs, les orienteurs, les accompagnants…</p>
            <ul>
              <li>Ministères éducatifs (Parcoursup, Affelnet), Conseils régionaux, OPCO…</li>
              <li>
                Visiteurs du{" "}
                <AideLink href={CATALOGUE_URL}>Catalogue des offres de formations en apprentissage</AideLink>, du réseau
                des Carif-Oref
              </li>
              <li>Professionnels et les institutions s’intéressant au marché de la formation professionnelle</li>
            </ul>
          </Accordion>

          <Accordion label="Je suis CFA Responsable (classique ou hors-les-murs) : dois-je référencer l’offre de formation au Carif-Oref ?">
            <p>
              L’organisme responsable doit déclarer toutes ses formations auprès des différents Carif-Oref. S’il délègue
              la déclaration à un ou à ses organismes formateurs, il devra veiller à l’exhaustivité de l’offre de
              formation et à sa non-redondance.
            </p>
            <p>
              Source : <AideLink href="/pdf/vademecum.pdf">Vademecum</AideLink> de la collecte (page 3)
            </p>
          </Accordion>

          <Accordion label="Comment contacter mon Carif-Oref régional et référencer mon offre de formation ?">
            <p>
              En tant que CFA, vous devez déclarer votre offre de formation sur le site institutionnel de la plateforme
              SI, tels que Ofeli, Formanoo, Rafael, SOFI… En cas de difficultés, veuillez contacter votre Carif-Oref.
            </p>
            <CarifOrefContactTable />
          </Accordion>
        </div>
      </AideContainer>
    </>
  );
}
