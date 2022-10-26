export const donneesApprenantsFields = {
  cfd: {
    label: `la colonne "CFD"`,
    format: "11111111A",
    tooltip: {
      title: "Code formation diplôme",
      text: "11111111A \n8 chiffres 1 lettre \nexemple 51021202A",
    },
  },
  annee_scolaire: {
    label: `la colonne "Année scolaire"`,
    format: "20XX-20XX",
    tooltip: {
      title: "Année scolaire",
      text: "Il s’agit de l’année en cours de l'apprenti dans votre organisme de formation. Le format attendu est 20XX-20XX",
    },
  },
  annee_formation: {
    label: `la colonne "Année formation"`,
    format: "1, 2 ou 3",
    tooltip: {
      title: "Année de formation",
      text: "Il s’agit de l’année du niveau dans le cursus de formation. Le format attendu est un chiffre : 1, 2, 3.",
    },
  },
  nom_apprenant: {
    label: `la colonne "Nom de l'apprenant"`,
    format: "Au moins 1 lettre, espace/tiret/accent possibles - pas de chiffre",
    tooltip: {
      title: "Nom de l’apprenant",
      text: "Champ obligatoire pour identifier un apprenant unique. Les données personnelles ne sont pas exposées dans le tableau de bord de l’apprentissage.",
    },
  },
  prenom_apprenant: {
    label: `la colonne "Prénom de l'apprenant"`,
    format: "Au moins 1 lettre, espace/tiret/accent possibles - pas de chiffre",
    tooltip: {
      title: "Prénom de l’apprenant",
      text: "Champ obligatoire pour identifier un apprenant unique. Les données personnelles ne sont pas exposées dans le tableau de bord de l’apprentissage.",
    },
  },
  date_de_naissance_apprenant: {
    label: `la colonne "Date de naissance de l'apprenant"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Date de naissance",
      text: "Le format attendu est JJ/MM/AAAA et correspond à la norme ISO 8601.\nExemple : 30/04/2003",
    },
  },
  code_rncp: {
    label: `la colonne "Code RNCP"`,
    format: "RNCPXXXXX",
    tooltip: {
      title: "Code RNCP",
      text: "Code du Répertoire National des Certifications Professionnelles.\nFormat attendu : RNCPXXXXX",
    },
  },
  telephone_apprenant: {
    label: `la colonne "Numéro de téléphone de l'apprenant"`,
    format: "10 chiffres commençant par 1 zéro",
    tooltip: { title: "Numéro de téléphone", text: "10 chiffres commençant par 1 zéro et séparé par des /" },
  },
  email_apprenant: {
    label: `la colonne "Email de l'apprenant"`,
    format: "courriel texte@texte.texte",
    tooltip: { title: "Email de l’apprenant", text: "Exemple : nom.prenom@email.com" },
  },
  ine_apprenant: {
    label: `la colonne "INE de l'apprenant"`,
    format: "10 chiffres et 1 lettre ou 9 chiffres et 2 lettres (les lettres ne sont pas à la fin)",
    tooltip: {
      title: "Numéro INE de l'apprenant",
      text: "10 chiffres et 1 lettre ou 9 chiffres et 2 lettres (les lettres ne sont pas à la fin) \nExemple 2134567A652",
    },
  },
  code_commune_insee_apprenant: {
    label: `la colonne "Code commune insee de l'apprenant"`,
    format:
      "5 chiffres : les 2 premiers sont le numéro du département à laquelle la ville est rattachée et les 3 autres sont un code donné à la commune.",
    tooltip: {
      title: "Code Commune INSEE",
      text: "5 chiffres : les 2 premiers sont le numéro du département à laquelle la ville est rattachée et les 3 autres sont un code donné à la commune",
    },
  },
  date_inscription: {
    label: `la colonne "Date d'inscription en formation"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Date d’inscription ou de positionnement en formation",
      text: "Soit l’apprenant n'a pas encore eu de contrat ; soit il n'a plus de contrat mais est toujours en formation.\nExemple : 10/09/2022",
    },
  },
  date_fin_formation: {
    label: `la colonne "Date de fin de formation"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Date de fin prévue de la formation",
      text: "",
    },
  },
  date_debut_contrat: {
    label: `la colonne "Date de début contrat"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Date de début de contrat en cours",
      text: "À remplir obligatoirement si un contrat d’apprentissage est signé. Nous gérerons bientôt plusieurs contrats successifs, mais pour le moment veuillez renseigner le dernier contrat en date.\nExemple : 10/09/2022",
    },
  },
  date_fin_contrat: {
    label: `la colonne "Date de fin de contrat"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Date de fin de contrat prévue du contrat en cours",
      text: "A remplir obligatoirement si un contrat d'apprentissage est signé.\nExemple : 10/09/2022",
    },
  },
  date_rupture_contrat: {
    label: `la colonne "Date de rupture de contrat"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Date de rupture de contrat ",
      text: "À remplir obligatoirement dès qu’il y a une rupture de contrat.\nExemple : 26/06/2022",
    },
  },
  date_sortie_formation: {
    label: `la colonne "Date de sortie de formation"`,
    format: "JJ/MM/AAAA",
    tooltip: {
      title: "Sortie de la formation",
      text: "Il s’agit de l’arrêt du contrat et de cette formation en apprentissage. À remplir obligatoirement dès qu’il y a une sortie définitive.\nExemple : 26/06/2022",
    },
  },
  dates_inscription_contrat_sortie_formation: {
    label: `les colonnes "Date d'inscription", "Date de contrat" ou "Date de sortie",`,
    format: "",
    tooltip: "",
  },
};
