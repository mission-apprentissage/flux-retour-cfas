import { apiService } from "../../services/api.service";

const unlockAllCascade = {
  "employeur.denomination": { locked: false, reset: true },
  "employeur.naf": { locked: false, reset: true },
  "employeur.codeIdcc": { locked: false, reset: true },
  "employeur.codeIdcc_special": { locked: false, reset: true },
  "employeur.libelleIdcc": { locked: false, reset: true },
  "employeur.nombreDeSalaries": { locked: false, reset: true },
  "employeur.adresse.numero": { locked: false, reset: true },
  "employeur.adresse.repetitionVoie": { locked: false, reset: true },
  "employeur.adresse.voie": { locked: false, reset: true },
  "employeur.adresse.complement": { locked: false, reset: true },
  "employeur.adresse.codePostal": { locked: false, reset: true },
  "employeur.adresse.commune": { locked: false, reset: true },
  "employeur.adresse.departement": { locked: false, reset: true },
  "employeur.adresse.region": { locked: false, reset: true },
  "employeur.privePublic": { locked: false, reset: true, value: true },
};

export const employerSiretLogic = {
  deps: ["employeur.siret"],
  process: async ({ values, signal, dossier }) => {
    const siret = values.employeur.siret;
    const { messages, result } = await apiService.fetchSiret({
      siret,
      dossierId: dossier._id,
      signal,
    });

    const resultLength = Object.keys(result).length;
    if (resultLength === 0) return { error: messages.error };

    if (result.api_entreprise === "KO") {
      return {
        warning: `Le service de récupération des informations Siret est momentanément indisponible. Nous ne pouvons pas pre-remplir le formulaire.`,
        cascade: unlockAllCascade,
      };
    }

    if (result.ferme) {
      return { error: `Le Siret ${siret} est un établissement fermé.` };
    }

    if (result.secretSiret) {
      return {
        warning: `Votre siret est valide. En revanche, en raison de sa nature, nous ne pouvons pas récupérer les informations reliées.`,
        cascade: unlockAllCascade,
      };
    }

    return {
      cascade: {
        "employeur.denomination": {
          value: result.enseigne || result.entreprise_raison_sociale,
          locked: false,
        },
        "employeur.naf": {
          value: result.naf_code,
          locked: false,
          cascade: false,
        },
        "employeur.codeIdcc": {
          value: result.conventionCollective?.idcc ? `${result.conventionCollective?.idcc}` : undefined,
          locked: false,
        },
        "employeur.codeIdcc_special": {
          value: result.conventionCollective?.idcc ? `${result.conventionCollective?.idcc}` : undefined,
          locked: false,
        },
        "employeur.libelleIdcc": {
          value: result.conventionCollective?.titre || undefined,
        },
        "employeur.nombreDeSalaries": {
          value: result.entreprise_tranche_effectif_salarie?.de || undefined,
          locked: false,
        },
        "employeur.adresse.numero": {
          value: result.numero_voie || undefined,
          locked: false,
        },
        "employeur.adresse.repetitionVoie": {
          reset: true,
          locked: false,
        },
        "employeur.adresse.voie": {
          value:
            result.type_voie || result.nom_voie
              ? `${result.type_voie ? `${result.type_voie} ` : undefined}${result.nom_voie}`
              : undefined,
          locked: false,
        },
        "employeur.adresse.complement": {
          value: result.complement_adresse || undefined,
          locked: false,
        },
        "employeur.adresse.codePostal": {
          value: result.code_postal || undefined,
          locked: false,
          cascade: false,
        },
        "employeur.adresse.commune": {
          value: result.commune_implantation_nom || undefined,
          locked: false,
        },
        "employeur.adresse.departement": {
          value: result.num_departement || undefined,
          locked: false,
        },
        "employeur.adresse.region": {
          value: result.num_region || undefined,
          locked: true,
        },
        "employeur.privePublic": {
          value: result.public ?? true,
          locked: false,
        },
      },
    };
  },
};

export const employeurSiretControl = [employerSiretLogic];
