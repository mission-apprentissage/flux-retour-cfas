import { Link } from "@chakra-ui/react";

const headerTooltips = {
  Ligne: (
    <>
      Référez-vous à la ligne indiquée où se trouve(nt) le(s) erreur(s) et corrigez dans votre fichier Excel avant de
      téléverser à nouveau.
    </>
  ),

  etablissement_responsable_uai: (
    <>
      Il s’agit de l’établissement <b>signataire du contrat d’apprentissage de l’apprenant</b>, responsable de la
      gestion de la formation (données SIRET et UAI obligatoires).
    </>
  ),
  etablissement_formateur_uai: (
    <>
      Il s’agit de l’établissement qui <b>accueille physiquement et forme</b> l’apprenant. Il ne correspond pas
      nécessairement à l’établissement responsable de la gestion de la formation. Mais si c’est le cas, indiquer le même
      UAI que pour l’établissement responsable (données SIRET et UAI obligatoires).
    </>
  ),
  etablissement_lieu_de_formation_uai: (
    <>
      Le <b>lieu de formation</b> est un espace aménagé spécialement pour y mener des ateliers pratiques, avec du
      matériel dédié à la manipulation (ex : atelier de carrosserie). Cet espace peut faire partie de l’établissement
      responsable de la gestion de la formation et ne pas posséder d’UAI propre (auquel cas, indiquer le même UAI et
      SIRET), mais cela n’est pas toujours le cas (données SIRET et UAI obligatoires).
    </>
  ),
  nom_apprenant: (
    <>Pour le nom et prénom de l’apprenant, les caractères spéciaux sont acceptés (données obligatoires).</>
  ),
  statut_apprenant: (
    <>
      Statut actuel de l’apprenant : indiquer 0 pour abandon, 2 pour un inscrit sans contrat, 3 pour un apprenti en
      contrat (donnée obligatoire).
    </>
  ),
  date_metier_mise_a_jour_statut: (
    <>
      Date à laquelle le statut de l’apprenant a été saisi dans votre outil de gestion. Si vous ne connaissez pas la
      date, indiquez la date du jour (donnée obligatoire).
    </>
  ),
  date_de_naissance_apprenant: (
    <>
      L’âge correspondant à la date de naissance de l’apprenant doit être inférieure ou égale à 15 ans (donnée
      obligatoire).
    </>
  ),
  sexe_apprenant: <>Différentes valeurs acceptées : 1, 2 ou H, F ou M, F (donnée obligatoire).</>,
  adresse_apprenant: (
    <>
      Adresse principale actuelle de l’apprenant (donnée obligatoire). Indiquer : le N° de la voie (éventuellement
      l’indice de répétition) la nature de la voie (Route, avenue, rue, Impasse…) le complément (Résidence, Immeuble,
      étage, porte) le libellé de la voie
    </>
  ),
  code_postal_apprenant: <>Code postal du lieu d’habitation de l’apprenant (donnée obligatoire).</>,
  ine_apprenant: (
    <>
      Identifiant National Élève, inscrit dans le «&nbsp;répertoire national des identifiants élèves, étudiants et
      apprentis&nbsp;» (donnée facultative). Il est composé de 11 caractères (soit 10 chiffres et 1 lettre soit 9
      chiffres et 2 lettres).
    </>
  ),
  nir_apprenant: (
    <>13 chiffres. Le NIR est aussi appelé «&nbsp;numéro de sécurité sociale&nbsp;» (donnée facultative).</>
  ),
  tel_apprenant: (
    <>
      Numéro de téléphone portable ou fixe de l’apprenant. Formats acceptés : 0612345678 ou (+)33612345678 (donnée
      facultative).
    </>
  ),
  rqth_apprenant: (
    <>Reconnaissance de la Qualité de Travailleur Handicapé : indiquer Oui / Non ou Vrai / Faux (donnée facultative).</>
  ),
  date_rqth_apprenant: (
    <>Date de la Reconnaissance de la Qualité de Travailleur Handicapé de l’apprenant (donnée facultative).</>
  ),
  responsable_apprenant_mail1: (
    <>
      Courriel d’un parent ou un responsable / tuteur légal. Attention : il ne s’agit pas ici du maître d’apprentissage
      (donnée facultative).
    </>
  ),
  derniere_situation: (
    <>
      Situation ou classe fréquentée l’année dernière (N-1). Pour plus d’aide, se référer à la nomenclature de la notice
      d’instruction SIFA disponible sur votre onglet “Mon enquête SIFA” (donnée facultative).
    </>
  ),
  dernier_organisme_uai: (
    <>
      L’établissement fréquenté l’année dernière par l’apprenant. Elle peut être renseignée : soit par le numéro UAI de
      l’établissement fréquenté l’année dernière (N-1); soit par le numéro du département de scolarisation de l’année
      dernière (N-1). (donnée facultative).
    </>
  ),
  annee_scolaire: (
    <>
      Il s’agit de l’année scolaire sur laquelle est positionnée l’apprenant (donnée obligatoire). Il est accepté
      uniquement les années scolaires ou calendaires sur une année, soit par exemples&nbsp;:
      <ul>
        <li>2022-2023</li>
        <li>2023-2024</li>
        <li>2022-2022</li>
        <li>2023-2023</li>
      </ul>
      Exemples d’années scolaires non valides&nbsp;:
      <ul>
        <li>2022-2024</li>
        <li>2022-2025</li>
        <li>2022-2026</li>
      </ul>
    </>
  ),
  annee_formation: (
    <>
      Indiquer au choix 1, 2, 3, 4, 5, 6. Il s’agit de la situation dans la formation : elle est censée refléter le
      niveau auquel est inscrit l’apprenti par rapport à la <i>durée théorique</i>. Pour un CAP, 2 signifie “CAP 2ème
      année” quelle que soit la durée réelle de la formation. Pour un BAC PRO, 1 signifie “seconde pro”, 2 signifie
      “première pro”, 3 signifie “terminale pro”. Pour un BTS, 1 signifie “BTS 1e année”, 2 signifie “BTS 2e année”.
      Pour un master, 1 signifie “M1”, 2 signifie “M2”. Dans le cas des CAP avec une durée théorique=24 mois mais avec
      une durée réelle=12 mois, les apprentis sont donc à déclarer en 2 et non en 1. Dans le cas des Bac Pro avec des
      cursus en <i>durée réelle</i>
      en 24 mois où les apprentis font 1ère–terminale, ils sont donc renseignés en 2 et en 3 l’année suivante (donnée
      obligatoire).
    </>
  ),
  formation_rncp: (
    <>
      Code RNCP (Répertoire National des Certifications Professionnelles) de la formation suivie par l’apprenant (donnée
      obligatoire).
    </>
  ),
  formation_cfd: (
    <>
      Vous pouvez trouver le Code Diplôme de la formation sur le{" "}
      <Link
        href={"https://formulaire.defenseurdesdroits.fr/"}
        display="inline"
        textDecoration={"underline"}
        color="white"
        isExternal
      >
        Catalogue de l’apprentissage
      </Link>
      , en indiquant le SIRET de votre établissement (donnée obligatoire).
    </>
  ),
  date_inscription_formation: (
    <>
      Date à laquelle le jeune s’est <b>inscrit</b> sur sa formation, avec ou sans contrat (donnée obligatoire).
    </>
  ),
  date_entree_formation: (
    <>
      Date à laquelle le jeune a <b>démarré</b> sa formation, avec ou sans contrat (donnée obligatoire).
    </>
  ),
  date_fin_formation: (
    <>
      Date <b>prévisionnelle</b> à laquelle le jeune aura terminé sa formation. Les dates de début et de fin
      correspondent à celles de votre calendrier de formation (donnée obligatoire).
    </>
  ),
  // Even if legacy, this field can still be used, so we have to keep it.
  duree_theorique_formation: (
    <>
      Durée théorique de la formation, de la date d’inscription au diplôme, exprimée en <b>années</b> (donnée
      obligatoire). La durée théorique est censée être fixe et dépend du diplôme : 2 ans pour un CAP, pour un BTS et 3
      ans pour un BAC PRO… Concernant le BAC PRO et les diplômes d’ingénieurs, la durée théorique de la formation est de
      3 ans. Concernant le CAP, le BTS, le Master (M1 et M2) et les BP, la durée théorique de la formation est de 2 ans.
      Concernant les Licences PRO et les Mentions Complémentaires, la durée théorique de la formation est de 1 an.
      Concernant les formations dans lesquelles seule la 1ère ou dernière année se prépare par le biais de
      l’apprentissage, on prendra en compte la durée théorique de la formation y compris les années non préparées sous
      le statut apprenti.
    </>
  ),
  duree_theorique_formation_mois: (
    <>
      Durée théorique de la formation, de la date d’inscription au diplôme, exprimée en <b>mois</b> (donnée
      obligatoire). La durée théorique est censée être fixe et dépend du diplôme : 24 mois pour un CAP, pour un BTS et
      36 mois pour un BAC PRO… Concernant le BAC PRO et les diplômes d’ingénieurs, la durée théorique de la formation
      est de 36 mois. Concernant le CAP, le BTS, le Master (M1 et M2) et les BP, la durée théorique de la formation est
      de 24 mois. Concernant les Licences PRO et les Mentions Complémentaires, la durée théorique de la formation est de
      12 mois. Concernant les formations dans lesquelles seule la 1ère ou dernière année se prépare par le biais de
      l’apprentissage, on prendra en compte la durée théorique de la formation y compris les années non préparées sous
      le statut apprenti.
    </>
  ),
  libelle_court_formation: (
    <>Libellé court de la formation suivie par l’apprenant. Exemple : CAP Pâtissier (donnée facultative)</>
  ),
  obtention_diplome_formation: (
    <>
      Indiquer par Oui ou Non (ou Vrai / Faux) si l’apprenant a obtenu son diplôme (ou non) à l’issue de la formation
      (donnée facultative).
    </>
  ),
  date_obtention_diplome_formation: <>À remplir uniquement si le diplôme a été obtenu (donnée facultative).</>,
  date_exclusion_formation: <>Date d’exclusion de la formation (donnée facultative).</>,
  cause_exclusion_formation: (
    <>
      Indiquer succinctement une cause d’exclusion de la formation. Exemple : absences répétées et injustifiées (donnée
      facultative).
    </>
  ),
  formation_presentielle: (
    <>
      Permet d’identifier les formations qui sont enseignées à 100% à distance. Si formation à distance : indiquer
      “faux” Si formation en présentiel : indiquer “vrai” Si hybride présentiel/distance : indiquer “vrai” (donnée
      facultative).
    </>
  ),
  nom_referent_handicap_formation: (
    <>
      Indiquer le nom et prénom de la personne de votre établissement affectée à cette formation, si il y en a une
      (donnée facultative).
    </>
  ),
  contrat_date_debut: <>Date de début du premier contrat (donnée obligatoire si contrat d&apos;apprentissage signé).</>,
  contrat_date_fin: <>Date de fin du premier contrat (donnée obligatoire si contrat d&apos;apprentissage signé).</>,
  siret_employeur: (
    <>
      Donnée obligatoire seulement si il y a eu un contrat signé entre un apprenti et un employeur. Format
      attendu&nbsp;: 14 chiffres
    </>
  ),
  contrat_date_rupture: (
    <>Date de rupture du premier contrat. Donnée obligatoire seulement si il y a eu rupture du contrat.</>
  ),
  cause_rupture_contrat: (
    <>
      Décrire succinctement le motif de rupture du contrat. Quelques exemples : «&nbsp;démission&nbsp;»
      «&nbsp;résiliation&nbsp;» «&nbsp;force majeure&nbsp;» «&nbsp;obtention du diplôme&nbsp;» «&nbsp;inaptitude
      constatée par la médecine du travail&nbsp;» (donnée facultative).
    </>
  ),
};

export default headerTooltips;
