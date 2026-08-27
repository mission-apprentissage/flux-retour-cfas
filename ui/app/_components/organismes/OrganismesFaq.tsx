"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { IOrganisationType, SUPPORT_PAGE_ACCUEIL } from "shared";

const ExternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="fr-link">
    {children}
  </a>
);

const DownloadFileLink = ({
  href,
  fileType,
  fileSize,
  children,
}: {
  href: string;
  fileType: string;
  fileSize: string;
  children: React.ReactNode;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="fr-link fr-link--download">
    {children}
    <span className="fr-link__detail">
      {fileType} – {fileSize}
    </span>
  </a>
);

const CONTACTS_RECTORAT = (
  <DownloadFileLink href="/pdf/Contact-Rectorat-UAI-RAMSESE.pdf" fileType="PDF" fileSize="81 Ko">
    Liste des contacts des services académiques
  </DownloadFileLink>
);

const CONTACTS_CARIF_OREF = (
  <DownloadFileLink
    href="https://drive.google.com/file/d/1xjshlQqxl3UKhoU7xrEhziCUqVsPAxCU/view?usp=drive_link"
    fileType="PDF"
    fileSize="417 Ko"
  >
    Liste de contacts Carif-Oref
  </DownloadFileLink>
);

function FaqOrganismeFormation() {
  return (
    <div className="fr-accordions-group">
      <Accordion
        label='Si des établissements ont une UAI "non déterminée", que cela signifie-t-il et que faire ?'
        defaultExpanded
      >
        <p>
          Si l&apos;UAI est répertoriée comme &quot;Non déterminée&quot; alors que l&apos;organisme en possède une, il
          doit la communiquer en écrivant à{" "}
          <ExternalLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</ExternalLink>{" "}
          avec la fiche descriptive UAI, pour mise à jour. L&apos;absence de ce numéro bloque l&apos;enregistrement des
          contrats d&apos;apprentissage. La mise à jour sur le Référentiel entraîne automatiquement la mise à jour sur
          le Tableau de bord.
        </p>
        <div className="fr-highlight fr-my-2w">
          <p>
            L&apos;UAI (Unité Administrative Immatriculée) est un code attribué par le Ministère de l&apos;éducation
            nationale, dans le répertoire académique et ministériel sur les établissements du système éducatif (RAMSESE)
            aux établissements du système éducatif (écoles, collèges, lycées, CFA, établissements d&apos;enseignement
            supérieur, public ou privé). Il est utilisé pour les identifier dans différentes bases de données et
            systèmes administratifs. L&apos;UAI s&apos;obtient auprès des services du rectorat de l&apos;académie où se
            situe le CFA.
          </p>
        </div>
        <p>
          En cas de questions, contactez le service RAMSESE de votre Rectorat en leur communiquant les informations
          nécessaires à l&apos;expertise de votre problématique (raison sociale, Siret, UAI, etc.).
        </p>
        {CONTACTS_RECTORAT}
      </Accordion>

      <Accordion label='Des établissements ont une nature "inconnue". Que cela signifie-t-il et que faire ?'>
        <p>
          Si un organisme a pour nature &quot;Inconnue&quot;, cela signifie que l&apos;offre de formation en
          apprentissage n&apos;est pas correctement ou mal référencée par le Carif-Oref. L&apos;organisme doit
          s&apos;adresser auprès de son{" "}
          <ExternalLink href="https://www.intercariforef.org/referencer-son-offre-de-formation">
            Carif-Oref régional
          </ExternalLink>{" "}
          pour référencer ses offres et obtenir un ID formation, que l&apos;on retrouve notamment dans le{" "}
          <ExternalLink href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements">
            Catalogue des offres de formations en apprentissage
          </ExternalLink>
          . Veuillez noter que la modification de la nature d&apos;un organisme impacte ses relations avec les autres
          organismes.
        </p>
        <p className="fr-mt-1w">
          En cas de questions, contactez votre Carif-Oref régional ou connectez-vous sur sa plateforme.
        </p>
        {CONTACTS_CARIF_OREF}
      </Accordion>

      <Accordion label='Des établissements ont un Siret "fermé". Que cela signifie-t-il et que faire ?'>
        <p>
          Cette information est tirée de la base INSEE. Un établissement est affiché &quot;Fermé&quot; suite à une
          cessation d&apos;activité ou un déménagement. Si un changement d&apos;adresse a été déclaré (via{" "}
          <ExternalLink href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</ExternalLink>), un nouveau
          Siret a été délivré par l&apos;INSEE. L&apos;ancien Siret est alors fermé.
        </p>
        <p className="fr-mt-1w">
          Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler le nouveau
          Siret à :
        </p>
        <ul>
          <li>au Carif-Oref régional,</li>
          <li>
            à la DREETS (Direction Régionale de l&apos;Économie, de l&apos;Emploi, du Travail et des Solidarités),
          </li>
          <li>au Rectorat de votre Académie (voir les contacts dans l&apos;onglet dédié à l&apos;UAI),</li>
          <li>à l&apos;OPCO (Opérateur de Compétences) concerné(s),</li>
          <li>
            au contact national ou régional, si le CFA appartient à un réseau (ex : Chambre de Commerce et
            d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc...),
          </li>
          <li>
            et le mettre à jour sur{" "}
            <ExternalLink href="https://info.monactiviteformation.emploi.gouv.fr/">Mon Activité Formation</ExternalLink>
            .
          </li>
        </ul>
      </Accordion>

      <Accordion label="Si des organismes de la liste ne doivent pas apparaître ou certains sont manquants ou si des erreurs apparaissent sur les formations, que faire ?">
        <p>
          Si des relations entre organismes ne devraient pas avoir lieu ou sont manquantes, vous devez vous rapprocher
          de votre Carif-Oref régional afin de modifier les informations collectées (par ex : suppression du formateur
          rattaché au responsable). Connectez-vous sur la plateforme dédiée propre à chaque Carif-Oref.
        </p>
        <p className="fr-mt-1w">
          Concernant les formations, chaque offre de chaque établissement devrait figurer dans le Catalogue des offres
          de formations en apprentissage. Si ce n&apos;est pas le cas, merci de signaler la situation par mail :{" "}
          <ExternalLink href="mailto:pole-apprentissage@intercariforef.org">
            pole-apprentissage@intercariforef.org
          </ExternalLink>{" "}
          avec les informations suivantes :
        </p>
        <ul>
          <li>SIRET ;</li>
          <li>RNCP et/ou le code diplôme ;</li>
          <li>
            la période d&apos;inscription telle que mentionnée dans le catalogue Carif-Oref (exprimée en AAAA-MM) ;
          </li>
          <li>le lieu de la formation (code commune INSEE ou à défaut code postal) ;</li>
          <li>mail de la personne signalant l&apos;erreur.</li>
        </ul>
        <p className="fr-mt-1w">
          Une investigation sera menée par le Réseau des Carif-Oref pour le traitement de cette anomalie. Il reviendra
          vers vous dès la résolution de ce dysfonctionnement via le mail que vous avez indiqué.
        </p>
        {CONTACTS_CARIF_OREF}
      </Accordion>

      <Accordion label="Si des établissements sont manquants, que faire ?">
        <p>
          Si un organisme, dont la gestion de ses formations en apprentissage est confiée à votre CFA, n’apparaît pas
          dans la liste :
        </p>
        <ul>
          <li>
            soit il n’est pas référencé sur le{" "}
            <ExternalLink href="https://referentiel.apprentissage.onisep.fr/">
              Référentiel UAI-SIRET des OFA-CFA
            </ExternalLink>
          </li>
          <li>
            soit ses formations déclarées auprès de son Carif-Oref régional ne sont pas référencées ou n’indiquent pas
            le bon établissement responsable sur le{" "}
            <ExternalLink href="https://catalogue-apprentissage.intercariforef.org/">
              Catalogue des offres de formations en apprentissage
            </ExternalLink>
          </li>
        </ul>
        <div className="fr-highlight fr-my-2w">
          <p className="fr-text--bold">Démarche :</p>
          <ul className="fr-mb-3w">
            <li>
              Si l’organisme en apprentissage est absent du Référentiel UAI-SIRET des OFA-CFA : il doit se référencer
              via son compte <ExternalLink href="https://info.monactiviteformation.emploi.gouv.fr/">MAF</ExternalLink>.
            </li>
            <li>
              Si l’organisme est absent du Catalogue des offres de formations en apprentissage : ses formations doivent
              être référencées sur la plateforme de son Carif Oref (voir document téléchargeable ci-dessous).
            </li>
            <li>
              Si l’organisme est présent sur le Catalogue des offres de formations en apprentissage : vérifiez que ses
              formations indiquent bien comme “Responsable” l’établissement gestionnaire des contrats sur votre{" "}
              <ExternalLink href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                plateforme Carif Oref
              </ExternalLink>
              .
            </li>
          </ul>
          <p className="fr-mb-2w">Ces démarches doivent s’effectuer en concertation avec l’organisme concerné.</p>
          {CONTACTS_CARIF_OREF}
        </div>
      </Accordion>
    </div>
  );
}

function FaqTeteDeReseau() {
  return (
    <div className="fr-accordions-group">
      <Accordion
        label="Il manque un ou plusieurs établissements, ou certains ne font plus partie de mon réseau. Comment mettre à jour la liste ?"
        defaultExpanded
      >
        <p>
          L&apos;onglet ”Mon réseau” affiche tous les établissements identifiés de votre réseau. Nous les mettons à jour
          manuellement et régulièrement sur le Tableau de bord.
        </p>
        <p>
          Si la liste des organismes de votre réseau ci-dessus est incomplète ou erronée ,{" "}
          <ExternalLink href={SUPPORT_PAGE_ACCUEIL}>contactez-nous</ExternalLink> en indiquant la liste des
          établissements à rattacher à votre réseau, et en précisant pour chacun sa raison sociale, UAI, SIRET,
          domiciliation.
        </p>
        <p>L&apos;idéal est de nous envoyer un tableau Excel complet de votre réseau avec ces informations.</p>
      </Accordion>

      <Accordion label="Si des établissements ont une UAI “non déterminée”, que cela signifie-t-il et que faire ?">
        <p>
          L’UAI (Unité Administrative Immatriculée) est un code attribué par le Ministère de l’Éducation nationale, dans
          le répertoire académique et ministériel sur les établissements du système éducatif (RAMSESE) aux
          établissements du système éducatif (écoles, collèges, lycées, CFA, établissements d’enseignement supérieur,
          public ou privé). Il est utilisé pour les identifier dans différentes bases de données et systèmes
          administratifs. L’UAI s’obtient auprès des services du rectorat de l’académie où se situe le CFA.
        </p>
        <p>
          Si l&apos;UAI est répertoriée comme « Non déterminée » alors que l’organisme en possède une, il doit la
          communiquer en écrivant à{" "}
          <ExternalLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</ExternalLink>{" "}
          avec la fiche descriptive UAI, pour mise à jour. L&apos;absence de ce numéro bloque l&apos;enregistrement des
          contrats d&apos;apprentissage.
        </p>
        <p>
          Si l’UAI est répertoriée comme « Non déterminée » alors que l’organisme en possède un, il doit la communiquer
          en écrivant à referentiel-uai-siret@onisep.fr avec la fiche UAI, pour mise à jour. L&apos;absence de ce numéro
          bloque l’enregistrement des contrats d’apprentissage.
        </p>
        <p>
          En cas de questions, contactez le service RAMSESE de votre Rectorat en leur communiquant les informations
          nécessaires à l’expertise de votre problématique (raison sociale, Siret, UAI, etc...).
        </p>
        {CONTACTS_RECTORAT}
      </Accordion>

      <Accordion label="Si des établissements ont une nature 'inconnue', que cela signifie-t-il et que faire ?">
        <p>
          Si un organisme a pour nature « Inconnue », cela signifie que l’offre de formation en apprentissage n&apos;est
          pas collectée ou mal référencée par le Carif-Oref. L’organisme doit s’adresser auprès de son{" "}
          <ExternalLink href="https://www.intercariforef.org/referencer-son-offre-de-formation">
            Carif-Oref régional
          </ExternalLink>{" "}
          pour référencer ses offres et obtenir un ID formation, que l’on retrouve notamment dans le{" "}
          <ExternalLink href="https://catalogue-apprentissage.intercariforef.org/">
            Catalogue des offres de formations en apprentissage
          </ExternalLink>
          . Veuillez noter que la modification de la nature d’un organisme impacte ses relations avec les autres
          organismes.
        </p>
        <p>En cas de questions, contactez votre Carif-Oref régional ou connectez-vous à votre espace.</p>
        {CONTACTS_CARIF_OREF}
      </Accordion>

      <Accordion label="Si des établissements ont un Siret 'fermé', que cela signifie-t-il et que faire ?">
        <p>
          Cette information est tirée de la base INSEE. Un établissement est affiché &quot;Fermé&quot; suite à une
          cessation d&apos;activité ou un déménagement. Si un changement d&apos;adresse a été déclaré (via{" "}
          <ExternalLink href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</ExternalLink>), un nouveau
          Siret a été délivré par l’INSEE. L&apos;ancien Siret est alors fermé.
        </p>
        <p>
          Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler le nouveau
          Siret :
        </p>
        <ul>
          <li>au Carif-Oref régional,</li>
          <li>
            à la DREETS (Direction Régionale de l&apos;Économie, de l&apos;Emploi, du Travail et des Solidarités),
          </li>
          <li>au Rectorat de votre Académie (voir les contacts dans l&apos;onglet dédié à l&apos;UAI),</li>
          <li>à l&apos;OPCO (Opérateur de Compétences) concerné(s),</li>
          <li>
            au contact national ou régional, si le CFA appartient à un réseau (ex : Chambre de Commerce et
            d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc.),
          </li>
          <li>
            et le mettre à jour sur{" "}
            <ExternalLink href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/">
              Mon Activité Formation
            </ExternalLink>
            .
          </li>
        </ul>
      </Accordion>
    </div>
  );
}

function FaqTerritoire() {
  return (
    <div className="fr-accordions-group">
      <Accordion label="Si des établissements dans la liste ne transmettent pas (ou plus), que faire ?" defaultExpanded>
        <p>
          Si des établissements n&apos;affichent pas d’effectifs transmis (ou ont arrêté la transmission), il faut les
          encourager à :
        </p>
        <ul>
          <li>se créer un compte sur le Tableau de bord de l&apos;apprentissage et transmettre les effectifs.</li>
          <li>mettre à jour leurs effectifs si la transmission s’est arrêtée.</li>
        </ul>
        <div className="fr-highlight fr-my-2w">
          <p>
            <b>Démarche :</b> Téléchargez la liste et contactez les CFA concernés pour leur demander de transmettre
            leurs effectifs. Notre équipe vous accompagne dans cette démarche sous la forme que vous souhaitez
            (emailing, webinaire, etc.).
          </p>
        </div>
      </Accordion>

      <Accordion label="Si des établissements ont une UAI 'non déterminée'. Que cela signifie-t-il et que faire ?">
        <p>
          Si l&apos;UAI est répertoriée comme « Non déterminée » alors que l’organisme en possède une, il doit la
          communiquer en écrivant à{" "}
          <ExternalLink href="mailto:referentiel-uai-siret@onisep.fr">referentiel-uai-siret@onisep.fr</ExternalLink>{" "}
          avec la fiche descriptive UAI, pour mise à jour. L&apos;absence de ce numéro bloque l&apos;enregistrement des
          contrats d&apos;apprentissage.
        </p>
        <div className="fr-highlight fr-my-2w">
          <p>
            <b>Démarche :</b> Téléchargez la liste et contactez les CFA concernés pour les encourager à transmettre leur
            UAI. Notre équipe vous accompagne dans cette démarche.
          </p>
        </div>
      </Accordion>

      <Accordion label="Si des établissements ont une nature 'inconnue', que cela signifie-t-il et que faire ?">
        <p>
          Si un organisme a pour nature « Inconnue », cela signifie que l’offre de formation en apprentissage n&apos;est
          pas collectée ou mal référencée par le Carif-Oref. L’organisme doit s’adresser auprès de son{" "}
          <ExternalLink href="https://www.intercariforef.org/referencer-son-offre-de-formation">
            Carif-Oref régional
          </ExternalLink>{" "}
          pour référencer ses offres et obtenir un ID formation, que l’on retrouve notamment dans le{" "}
          <ExternalLink href="https://catalogue-apprentissage.intercariforef.org/">
            Catalogue des offres de formations en apprentissage
          </ExternalLink>
          . Veuillez noter que la modification de la nature d’un organisme impacte ses relations avec les autres
          organismes.
        </p>
        <div className="fr-highlight fr-my-2w">
          <p>
            <b>Démarche :</b> Téléchargez la liste et contactez les CFA concernés pour les encourager à déclarer (ou
            mettre à jour) leur offre de formation. Notre équipe vous accompagne dans cette démarche.
          </p>
        </div>
      </Accordion>

      <Accordion label="Si des établissements ont un Siret 'fermé', que cela signifie-t-il et que faire ?">
        <p>
          Cette information est tirée de la base INSEE. Un établissement est affiché &quot;Fermé&quot; suite à une
          cessation d&apos;activité ou un déménagement. Si un changement d&apos;adresse a été déclaré (via{" "}
          <ExternalLink href="https://procedures.inpi.fr/?/">Guichet unique des entreprises</ExternalLink>), un nouveau
          Siret a été délivré par l’INSEE. L&apos;ancien Siret est alors fermé.
        </p>
        <p>
          Pour garantir la mise à jour correcte des informations administratives et légales, il faut signaler le nouveau
          Siret :
        </p>
        <ul>
          <li>au Carif-Oref régional,</li>
          <li>
            à la DREETS (Direction Régionale de l&apos;Économie, de l&apos;Emploi, du Travail et des Solidarités),
          </li>
          <li>au Rectorat de votre Académie (voir les contacts dans l&apos;onglet dédié à l&apos;UAI),</li>
          <li>à l&apos;OPCO (Opérateur de Compétences) concerné(s),</li>
          <li>
            au contact national ou régional, si le CFA appartient à un réseau (ex : Chambre de Commerce et
            d&apos;Industrie (CCI), Chambre de Métiers et de l&apos;Artisanat (CMA), MFR, etc.),
          </li>
          <li>
            et le mettre à jour sur{" "}
            <ExternalLink href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/">
              Mon Activité Formation
            </ExternalLink>
            .
          </li>
        </ul>
        <div className="fr-highlight fr-my-2w">
          <p>
            <b>Démarche :</b> Téléchargez la liste et contactez les CFA concernés pour leur demander de mettre à jour
            leur nouveau Siret si c’est le cas. Notre équipe vous accompagne dans cette démarche.
          </p>
        </div>
      </Accordion>
    </div>
  );
}

export function OrganismesFaq({ organisationType }: { organisationType?: IOrganisationType }) {
  if (organisationType === "ORGANISME_FORMATION") return <FaqOrganismeFormation />;
  if (organisationType === "TETE_DE_RESEAU") return <FaqTeteDeReseau />;
  return <FaqTerritoire />;
}
