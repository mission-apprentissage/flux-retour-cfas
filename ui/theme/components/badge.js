const commonStatusBadgeStyle = {
  fontSize: "omega",
  fontWeight: 500,
  borderRadius: 20,
  px: 3,
  py: 1,
  textTransform: "none",
};

const Badge = {
  variants: {
    draft: {
      ...commonStatusBadgeStyle,
      bg: "#DEE5FD",
      color: "#161616",
      border: "none",
    },
    waitingSignature: {
      ...commonStatusBadgeStyle,
      bg: "#FCEEAC",
      color: "#161616",
      border: "none",
    },
    sign: {
      ...commonStatusBadgeStyle,
      bg: "greensoft.200",
      color: "success",
      pl: "15px",
      fontWeight: "500",
      pr: "15px",
    },
    refus: {
      ...commonStatusBadgeStyle,
      bg: "redmarianne",
      color: "white",
    },
    signaturesRefused: {
      ...commonStatusBadgeStyle,
      bg: "redmarianne",
      color: "white",
    },
    aTeletransmettre: {
      ...commonStatusBadgeStyle,
      bg: "#FBE769",
      color: "#161616",
      border: "none",
    },
    nonConforme: {
      ...commonStatusBadgeStyle,
      bg: "#FBDFDB",
      color: "#161616",
      border: "none",
    },
    published: {
      ...commonStatusBadgeStyle,
      bg: "#A9FB68",
      color: "#161616",
      border: "none",
    },
    termine: {
      ...commonStatusBadgeStyle,
      bg: "#E5E5E5",
      color: "#161616",
      border: "none",
    },
    notRelevant: {
      ...commonStatusBadgeStyle,
      bg: "#e3e8ea",
      color: "grey.800",
      border: "1px solid",
      borderColor: "#e3e8ea",
    },

    conforme: {
      ...commonStatusBadgeStyle,
      bg: "greenmedium.300",
      color: "grey.800",
      border: "1px solid",
      borderColor: "greenmedium.200",
    },

    notPublished: {
      ...commonStatusBadgeStyle,
      bg: "grey.300",
      color: "grey.800",
      border: "1px solid",
      borderColor: "grey.300",
    },
    toBePublished: {
      ...commonStatusBadgeStyle,
      bg: "orangemedium.300",
      color: "grey.800",
      border: "1px solid",
      borderColor: "orangemedium.300",
    },

    pending: {
      ...commonStatusBadgeStyle,
      bg: "greenmedium.200",
      color: "#a3b3b7",
      border: "1px solid",
      borderColor: "greenmedium.200",
    },
    reject: {
      ...commonStatusBadgeStyle,
      bg: "redmarianne",
      color: "white",
    },
    unknown: {
      ...commonStatusBadgeStyle,
      bg: "#D5DBEF",
      color: "grey.800",
      border: "1px solid",
      borderColor: "#D5DBEF",
    },
    year: {
      ...commonStatusBadgeStyle,
      bg: "greenmedium.300",
      color: "grey.800",
      pl: "15px",
      pr: "15px",
    },
    signed: {
      ...commonStatusBadgeStyle,
      bg: "#E3E3FD",
      color: "bluefrance",
    },
    save: {
      ...commonStatusBadgeStyle,
      bg: "#EEEEEE",
      color: "#161616",
      pl: "15px",
      pr: "15px",
      fontWeight: "500",
    },
  },
};

export { Badge };

// BROUILLON: "draft",  //  text: "Brouillon",

// DOSSIER_FINALISE_EN_ATTENTE_ACTION: "waitingSignature",//  text: "En cours de signature",
// EN_ATTENTE_DECLENCHEMENT_SIGNATURES: "waitingSignature",//  text: "En cours de signature",
// EN_ATTENTE_SIGNATURE: "waitingSignature",  //  text: "En attente de signature",
// EN_ATTENTE_SIGNATURES: "waitingSignature",// text: "En cours de signature",
// SIGNATURES_EN_COURS: "waitingSignature",  //text: "En cours de signature",

// SIGNE: "sign", //  text: "Signé",

// DOSSIER_TERMINE_AVEC_SIGNATURE: "aTeletransmettre", //   text: "À télétransmettre",
// DOSSIER_TERMINE_SANS_SIGNATURE: "aTeletransmettre", //   text: "À télétransmettre",

// TRANSMIS: "draft", //  text: "Transmis",

// EN_COURS_INSTRUCTION: "draft",  // text: "En cours d'instruction",

// INCOMPLET: "nonConforme", // text: "À modifier",

// DEPOSE: "published", //  text: "Validé",

// REFUSE: "nonConforme", // text: "Non déposable",

// ENGAGE: "draft",//  text: "Contrat en cours",

// ANNULE: "unknown", //  text: "Annulé",
// RUTPURE: "unknown", //  text: "Rupture",

// SOLDE: "termine",// text: "Terminé",
