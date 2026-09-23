import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";

import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./page.module.scss";

export const metadata = PAGES.static.glossaire.getMetadata();

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
    {children}
  </a>
);

const CATALOGUE_URL = "https://catalogue-apprentissage.intercariforef.org";
const CARIF_OREF_URL = "https://www.intercariforef.org/referencer-son-offre-de-formation";
const REFERENTIEL_UAI_SIRET_URL = "https://referentiel.apprentissage.onisep.fr/organismes";
const INSEE_URL = "https://www.insee.fr/fr/accueil";

const ENTRIES: { term: string; definition: ReactNode }[] = [
  {
    term: "Année de formation",
    definition: (
      <>
        <p>
          Elle est censée refléter le niveau auquel est inscrit l’apprenti par rapport à la durée théorique du cursus de
          formation. Par exemple, pour une formation de plusieurs années, numéro de l’année en cours : 1 = 1ère année de
          formation, 2 = 2ème année de formation, etc.
        </p>
        <p>
          Dans le cas des CAP avec une durée théorique égale à 24 mois mais avec une durée réelle de 12 mois, les
          apprentis sont déclarés en 1e et en 2e en N an 1.
        </p>
        <p>
          Dans le cas des Bac Pro avec des cursus en durée réelle en 24 mois où les apprentis font 1ère–terminale, ils
          sont donc renseignés en 2 et en 3 l’année suivante.
        </p>
        <p>
          De manière générale, si les apprentis passent l’examen cette année sans redoubler, ils sont renseignés en : 2
          pour un CAP ou un BTS et en 3 pour un Bac Pro. Ce principe est appliqué pour l’ensemble des diplômes quelle
          que soit leur durée théorique.
        </p>
      </>
    ),
  },
  {
    term: "Code Commune INSEE",
    definition: (
      <>
        <p>
          Les codes INSEE des communes françaises sont consultables sur{" "}
          <ExternalLink href={INSEE_URL}>www.insee.fr</ExternalLink>. Cette nomenclature est mise à jour chaque année.
        </p>
        <p>Attention : ne pas confondre avec les codes postaux.</p>
      </>
    ),
  },
  {
    term: "Code Formation Diplôme (CFD)",
    definition: (
      <>
        <p>
          Le <ExternalLink href={CATALOGUE_URL}>Code Formation Diplôme</ExternalLink> est une codification qui concerne
          l’ensemble des diplômes technologiques et professionnels des ministères certificateurs (Éducation Nationale).
        </p>
        <p>
          Y sont ajoutés, en tant que de besoin et à la demande des centres de formation par l’apprentissage, les autres
          diplômes et titres inscrits au répertoire national des certifications professionnelles (RNCP), dès lorsqu’ils
          sont préparés par la voie de l’apprentissage. L’affichage permet, par l’usage de ce code, d’identifier la
          formation concernée et les effectifs par typologie de formations et par secteur.
        </p>
        <p>
          Les codes diplômes peuvent être trouvés sur le Catalogue des offres de formations en apprentissage. Format :
          la codification des diplômes et certifications préparés par la voie de l’apprentissage se traduit par un code
          à 8 positions (exemple : 40025510).
        </p>
      </>
    ),
  },
  {
    term: "DECA",
    definition: (
      <>
        <p>
          La{" "}
          <ExternalLink href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F">
            plateforme DECA
          </ExternalLink>
          , pour Dépôts des Contrats d’Alternance, est gérée par le Ministère du Travail, de la Santé et des
          Solidarités. Une entreprise qui signe un contrat d’apprentissage doit le transmettre à son Opérateur de
          Compétences (OPCO) pour instruction, prise en charge financière et dépôt de ces contrats auprès des services
          du Ministère.
        </p>
        <p>
          Le Tableau de bord de l’apprentissage intègre et restitue les données issues de DECA, actualisées
          régulièrement.
        </p>
      </>
    ),
  },
  {
    term: "Enquête SIFA",
    definition: (
      <p>
        Enquête annuelle obligatoire recensant tous les apprentis inscrits au 31 décembre de chaque année en centre de
        formation des apprentis (CFA) ou en section d’apprentissage (SA). Elle est produite par la Direction de
        l’évaluation, de la prospective et de la performance (DEPP) au Ministère de l’éducation nationale et de la
        jeunesse.
      </p>
    ),
  },
  {
    term: "Lieu de formation",
    definition: (
      <>
        <p>
          Le lieu de formation est l’adresse physique où l’apprenti se rend pour suivre la totalité ou la majeure partie
          de la formation. La formation peut être 100 % à distance. Les lieux de formations sont caractérisés par une
          adresse postale et des coordonnées de géolocalisation et toujours rattaché à un organisme de formation.
        </p>
        <p>
          La donnée “lieu de formation” provient des Carif-Oref. Si cette donnée est inconnue ou incorrecte,{" "}
          <ExternalLink href={CARIF_OREF_URL}>contactez votre Carif-Oref</ExternalLink>.
        </p>
      </>
    ),
  },
  {
    term: "Nature de l’organisme",
    definition: (
      <>
        <p>
          Trois natures d’organismes peuvent être observées via le{" "}
          <ExternalLink href={CARIF_OREF_URL}>Catalogue des offres de formation en apprentissage</ExternalLink> :
        </p>
        <p>
          <strong>Les organismes « responsables » :</strong>
        </p>
        <ul>
          <li>
            Ne dispensent pas de formation mais délèguent à des organismes responsables et formateurs ou uniquement
            formateurs ;
          </li>
          <li>Sont signataires de la convention de formation ;</li>
          <li>Demandent et reçoivent les financements de l’OPCO ;</li>
          <li>Sont responsables auprès de l’administration du respect de ses missions et obligations ;</li>
          <li>
            Sont titulaires de la certification qualité en tant que CFA et est garant du respect des critères qualité au
            sein de l’UFA.
          </li>
        </ul>
        <p>
          <strong>Les organismes « responsables et formateurs » :</strong>
        </p>
        <ul>
          <li>
            Dispensent des formations par apprentissage déclarées auprès des services de l’État (n° de déclaration
            d’activité (NDA)) ;
          </li>
          <li>Sont signataires de la convention de formation ;</li>
          <li>Demandent et reçoivent les financements de l’OPCO ;</li>
          <li>Sont responsables envers l’administration quant au respect de leurs missions et obligations ;</li>
          <li>
            Détiennent la certification qualité en tant que CFA et veillent à respecter les critères qualité au sein de
            l’UFA.
          </li>
        </ul>
        <p>
          <strong>Les organismes « formateurs » :</strong>
        </p>
        <ul>
          <li>Sont garant du respect de la mise en oeuvre pédagogique de la formation.</li>
          <li>
            Dispensent des actions de formation par apprentissage déclarées auprès des services de l’État (n° de
            déclaration d’activité (NDA))
          </li>
        </ul>
        <p>
          Si la nature d’un organisme est affichée “Inconnue” sur le Tableau de bord de l’apprentissage, ce dernier doit
          se rapprocher de son Carif-Oref Régional pour faire{" "}
          <ExternalLink href={CARIF_OREF_URL}>référencer son offre de formation en apprentissage</ExternalLink>.
        </p>
      </>
    ),
  },
  {
    term: "Numéro de déclaration d’activité (NDA)",
    definition: (
      <>
        <p>
          Un organisme réalisant des prestations de formation professionnelle (dont apprentissage) doit obtenir un
          numéro de déclaration d’activité auprès du service régional de contrôle de la Dreets (ex-Direccte).
        </p>
        <p>
          La donnée « NDA » est disponible sur le{" "}
          <ExternalLink href={REFERENTIEL_UAI_SIRET_URL}>Référentiel UAI-SIRET</ExternalLink> de l’ONISEP et provient de
          la{" "}
          <ExternalLink href="https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/">
            Liste Publique des Organismes de Formations
          </ExternalLink>
          . Si cette information est erronée, merci de leur signaler.
        </p>
      </>
    ),
  },
  {
    term: "Niveau de formation",
    definition: (
      <>
        <p>Nomenclature des diplômes par niveau :</p>
        <ul>
          <li>3 CAP, BEP</li>
          <li>4 Baccalauréat</li>
          <li>5 DEUG, BTS, DUT, DEUST</li>
          <li>6 Licence, licence professionnelle, BUT, Maîtrise</li>
          <li>
            7 Master, diplôme d’études approfondies, diplôme d’études supérieures spécialisées, diplôme d’ingénieur
          </li>
          <li>8 Doctorat, habilitation à diriger des recherches</li>
        </ul>
      </>
    ),
  },
  {
    term: "Organisme de formation (OFA)",
    definition: (
      <>
        <p>Organismes de formation approuvés par le Tableau de bord, incluant ceux :</p>
        <ul>
          <li>
            répertoriés dans le{" "}
            <ExternalLink href={CATALOGUE_URL}>Catalogue des offres de formations en apprentissage</ExternalLink> (base
            des Carif-Oref) et <ExternalLink href={REFERENTIEL_UAI_SIRET_URL}>Référentiel UAI-SIRET</ExternalLink>
          </li>
          <li>
            identifiés avec les détails suivants : UAI, SIREN, SIRET (en activité), Nature (Responsable, Responsable et
            formateur, Formateur)
          </li>
        </ul>
        <p>
          Numéro de déclaration d’activité (NDA), Certification Qualiopi, Nom commercial, Dénomination sociale,
          Appartenance à un réseau, Adresse, Région, Académie
        </p>
        <p>
          Ce nombre inclut : les OFA « historiques », les OFA académiques et d’entreprise, les lycées avec une section
          apprentissage.
        </p>
      </>
    ),
  },
  {
    term: "Qualiopi",
    definition: (
      <>
        <p>
          Qualiopi est une certification qui atteste de la qualité du processus mis en œuvre par les prestataires de la
          formation en apprentissage. Elle permet pour un CFA d’être référencé auprès des financeurs publics et
          paritaires. Depuis janvier 2022, tous les CFA qui souhaitent accéder à des fonds publics ou mutualisés doivent
          être certifiés Qualiopi.
        </p>
        <p>
          Pour savoir si un organisme de formation est certifié Qualiopi, consultez l’
          <ExternalLink href="https://annuaire-entreprises.data.gouv.fr/">Annuaire des Entreprises</ExternalLink>, dans
          l’onglet “Labels et certificats”.
        </p>
      </>
    ),
  },
  {
    term: "Relations entre les organismes",
    definition: (
      <>
        <p>
          <strong>
            Les relations entres les organismes sont identifiées au niveau de l’offre de formation en apprentissage
            collectée par les Carif-Oref.
          </strong>{" "}
          En effet, chaque offre de formation est associée à un organisme responsable et un organisme formateur (chacun
          est connu par son SIRET et son UAI le cas échéant).
        </p>
        <ul>
          <li>
            Si les organismes associés à une offre de formation ont le même SIRET, on en déduit la nature “responsable
            et formateur” et on ne génère pas de relation.
          </li>
          <li>
            Si les organismes associés à une offre de formation n’ont pas le même SIRET, on en déduit la nature
            “responsable” pour l’un et “formateur” pour l’autre, et on génère une relation entre eux.
          </li>
        </ul>
      </>
    ),
  },
  {
    term: "Réseau",
    definition: (
      <p>
        Un réseau dans le contexte de l’apprentissage peut regrouper différents partenaires institutionnels, organismes
        de formation, centres de formation d’apprentis (CFA), entreprises, chambres consulaires, branches
        professionnelles et acteurs régionaux. Ces entités peuvent s’associer au sein d’associations ou de groupements
        consulaires pour coordonner leurs actions et missions, avec des objectifs partagés dans le domaine de la
        formation en apprentissage. L’objectif principal de ces réseaux est de favoriser la collaboration et la mise en
        commun des ressources pour promouvoir et soutenir l’apprentissage.
      </p>
    ),
  },
  {
    term: "RNCP",
    definition: (
      <>
        <p>
          Le Répertoire national des certifications professionnelles (RNCP) a pour rôle de fournir une information
          constamment mise à jour sur les diplômes, les titres à finalité professionnelle ainsi que sur les certificats
          de qualification, accessible à tous. France compétences est en charge de maintenir à jour le RNCP. Grâce à un
          code spécifique, les formations concernées peuvent être identifiées, ce qui facilite la classification des
          effectifs selon le type de formation et le secteur.
        </p>
        <p>
          Pour plus d’information sur la certification et son éligibilité à l’apprentissage, consulter le site Internet
          de France Compétences (
          <ExternalLink href="https://www.francecompetences.fr/reguler-le-marche/certification-professionnelle/">
            www.francecompetences.fr/reguler-le-marche/certification-professionnelle
          </ExternalLink>
          ).
        </p>
      </>
    ),
  },
  {
    term: "Secteur d’activité",
    definition: (
      <p>
        Notre nomenclature se base sur le{" "}
        <ExternalLink href="https://www.francetravail.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html">
          Code ROME
        </ExternalLink>
        , un référentiel conçu par Pôle emploi et actualisé régulièrement, tenant compte des évolutions du marché du
        travail. Il présente l’ensemble des métiers regroupés par fiches, organisées par 14 grands domaines
        professionnels. Ces fiches proposent une description détaillée des métiers : définition, accès à l’emploi,
        compétences (savoir-faire, savoir-être professionnels et savoirs), contextes de travail, et mobilité
        professionnelle.
      </p>
    ),
  },
  {
    term: "SIRET",
    definition: (
      <p>
        Le numéro Siret (Système d’Identification du Répertoire des Etablissements) est un numéro d’immatriculation
        unique de chaque établissement d’une entreprise (l’unité légale). Il se compose de 14 chiffres attribués par
        l’INSEE. Le Siret permet l’identification de chaque établissement par les administrations et organismes publics.
        Lorsqu’un organisme de formation change de domiciliation, il doit obtenir un nouveau Siret, qu’il devra mettre à
        jour sur son compte{" "}
        <ExternalLink href="https://info.monactiviteformation.emploi.gouv.fr/">Mon Activité Formation</ExternalLink>, et
        le signaler à son Carif-Oref, la DREETS, le Rectorat de son Académie et OPCO. Pour plus d’informations,
        contacter l’ <ExternalLink href={INSEE_URL}>INSEE</ExternalLink> ou se connecter via le{" "}
        <ExternalLink href="https://procedures.inpi.fr/?/">Guichet Unique</ExternalLink> (INPI).
      </p>
    ),
  },
  {
    term: "UAI",
    definition: (
      <p>
        Le code UAI (Unité Administrative Immatriculée) composé de 7 chiffres et 1 lettre, est un code attribué par le
        Ministère de l’Éducation nationale aux établissements d’enseignement (écoles, collèges, lycées, universités,
        etc.). Il est utilisé pour les identifier dans différentes bases de données et systèmes administratifs. La
        donnée “UAI” affichée sur le Tableau de bord provient du{" "}
        <ExternalLink href={REFERENTIEL_UAI_SIRET_URL}>Référentiel UAI-SIRET</ExternalLink> des OFA-CFA (ONISEP) et de
        la base de données <ExternalLink href="https://dep.adc.education.fr/acce/index.php">RAMSESE</ExternalLink> et
        notamment exploité par la DEC avant d’être validée au niveau de chaque territoire.
      </p>
    ),
  },
  {
    term: "Zone d’emploi",
    definition: (
      <p>
        Espace géographique regroupant généralement plusieurs cantons et présentant une cohésion en matière
        d’infrastructures, de marché du travail et de mouvements économiques. Un bassin d’emploi est constitué
        généralement autour d’un pôle attractif et peut correspondre soit à une agglomération, soit à une micro-région
        industrielle développée à partir d’une activité spécifique ou d’une grande entreprise industrielle, soit à un
        territoire où se regroupent des activités diverses. Un bassin d’emploi est déterminé, selon l’INSEE, à partir du
        facteur déplacement domicile-travail dans un espace restreint permettant aux personnes actives de résider et
        travailler dans un établissement du bassin, et aux employeurs de recruter la main d’œuvre sur place. C’est
        l’aire de déplacements domicile-travail autour d’un pôle d’emplois de plus de 5.000 emplois.
      </p>
    ),
  },
];

export default function GlossairePage() {
  return (
    <main className={fr.cx("fr-container", "fr-py-6w")}>
      <h1 className={styles.title}>Clarification des termes techniques et données</h1>

      <div className={`${fr.cx("fr-table", "fr-table--bordered", "fr-table--no-caption")} ${styles.table}`}>
        <table>
          <caption>Glossaire des termes techniques et données du tableau de bord de l’apprentissage</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.termColumn}>
                Termes
              </th>
              <th scope="col">Définitions et périmètre</th>
            </tr>
          </thead>
          <tbody>
            {ENTRIES.map(({ term, definition }) => (
              <tr key={term}>
                <th scope="row" className={styles.term}>
                  {term}
                </th>
                <td className={styles.definition}>{definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
