export const SIFA_FIELDS = [
  {
    label: "INE",
    value: "INE",
  },
  {
    label: "NUMERO_UAI",
    value: "NUMERO_UAI",
  },
  {
    label: "TYPE_CFA",
    value: "TYPE_CFA",
  },
  {
    label: "SIT_FORM",
    value: "SIT_FORM",
  },
  {
    label: "UAI_EPLE",
    value: "UAI_EPLE",
  },
  {
    label: "NAT_STR_JUR",
    value: "NAT_STR_JUR",
  },
  {
    label: "STATUT",
    value: "STATUT",
  },
  {
    label: "DIPLOME",
    value: "DIPLOME",
  },
  {
    label: "RNCP",
    value: "RNCP",
  },
  {
    label: "DUR_FORM_THEO",
    value: "DUR_FORM_THEO",
  },
  {
    label: "DUR_FORM_REELLE",
    value: "DUR_FORM_REELLE",
  },
  {
    label: "AN_FORM",
    value: "AN_FORM",
  },
  {
    label: "NOM",
    value: "NOM",
  },
  {
    label: "NOM2",
    value: "NOM2",
  },
  {
    label: "PRENOM1",
    value: "PRENOM1",
  },
  {
    label: "PRENOM2",
    value: "PRENOM2",
  },
  {
    label: "PRENOM3",
    value: "PRENOM3",
  },
  {
    label: "ADRESSE",
    value: "ADRESSE",
  },
  {
    label: "COD_POST",
    value: "COD_POST",
  },
  {
    label: "COM_RESID",
    value: "COM_RESID",
  },
  {
    label: "TEL_JEUNE",
    value: "TEL_JEUNE",
  },
  {
    label: "TEL_RESP1_PERSO",
    value: "TEL_RESP1_PERSO",
  },
  {
    label: "TEL_RESP1_PRO",
    value: "TEL_RESP1_PRO",
  },
  {
    label: "TEL_RESP2_PERSO",
    value: "TEL_RESP2_PERSO",
  },
  {
    label: "TEL_RESP2_PRO",
    value: "TEL_RESP2_PRO",
  },
  {
    label: "MAIL_JEUNE",
    value: "MAIL_JEUNE",
  },
  {
    label: "MAIL_RESP1",
    value: "MAIL_RESP1",
  },
  {
    label: "MAIL_RESP2",
    value: "MAIL_RESP2",
  },
  {
    label: "DATE_NAIS",
    value: "DATE_NAIS",
  },
  {
    label: "LIEU_NAIS",
    value: "LIEU_NAIS",
  },
  {
    label: "SEXE",
    value: "SEXE",
  },
  {
    label: "REGIME_SCO",
    value: "REGIME_SCO",
  },
  {
    label: "PCS",
    value: "PCS",
  },
  {
    label: "HANDI",
    value: "HANDI",
  },
  {
    label: "NATIO",
    value: "NATIO",
  },
  {
    label: "SIT_AV_APP",
    value: "SIT_AV_APP",
  },
  {
    label: "DIP_OBT",
    value: "DIP_OBT",
  },
  {
    label: "SIT_N_1",
    value: "SIT_N_1",
  },
  {
    label: "ETAB_N_1",
    value: "ETAB_N_1",
  },
  {
    label: "TYPE_EMP",
    value: "TYPE_EMP",
  },
  {
    label: "DATE_ENTREE_CFA",
    value: "DATE_ENTREE_CFA",
  },
  {
    label: "DATE_DEB_CONT",
    value: "DATE_DEB_CONT",
  },
  {
    label: "DATE_RUPT_CONT",
    value: "DATE_RUPT_CONT",
  },
  {
    label: "COM_ETAB",
    value: "COM_ETAB",
  },
  {
    label: "NAF_ETAB",
    value: "NAF_ETAB",
  },
  {
    label: "NBSAL_EMP",
    value: "NBSAL_EMP",
  },
  {
    label: "SIRET_EMP",
    value: "SIRET_EMP",
  },
];

// Detecter la durée de formation
export const formatAN_FORM = (year: number | undefined | null) => {
  if (year == null) return year;
  return `${year}A`;
};

/*
  Formattage de l'INE
  Si l'INE est vide, retourner une formule afin de ne pas générer de colonne vide
  dans le cas de SIFA
  Voir https://tableaudebord-apprentissage.atlassian.net/browse/TM-703
*/
export const formatINE = (ine: string | undefined | null) => {
  return wrapNumString(ine) ?? `=""`;
};

export const formatStringForSIFA = (str: string | undefined) => {
  if (typeof str !== "string" || str.length === 0) return undefined;

  const accentsMap = {
    A: /[\xc0-\xc6]/g,
    a: /[\xe0-\xe6]/g,
    E: /[\xc8-\xcb]/g,
    e: /[\xe8-\xeb]/g,
    I: /[\xcc-\xcf]/g,
    i: /[\xec-\xef]/g,
    O: /[\xd2-\xd8]/g,
    o: /[\xf2-\xf8]/g,
    U: /[\xd9-\xdc]/g,
    u: /[\xf9-\xfc]/g,
    N: /[\xd1]/g,
    n: /[\xf1]/g,
    C: /[\xc7]/g,
    c: /[\xe7]/g,
  };

  // Remplace chaque accent par son homologue non accentué
  for (const [replacement, regex] of Object.entries(accentsMap)) {
    str = str.replace(regex, replacement);
  }

  // Remplacez les traits d'union par des espaces et supprimez tous les caractères non alphanumériques (hors espaces)
  return str.replace(/-/g, " ").replace(/[^0-9a-zA-Z ]/g, "");
};

export const wrapNumString = (str: string | number | null | undefined) => {
  if (str === null || str === undefined) return str;
  return `="${str}"`;
};
