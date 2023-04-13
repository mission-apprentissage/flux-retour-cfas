import { apiService } from "../../services/api.service";

const unlockAllCascade = {
  "apprenant.contrats[0].denomination": { locked: false, reset: true },
  "apprenant.contrats[0].naf": { locked: false, reset: true },
  "apprenant.contrats[0].nombre_de_salaries": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.numero": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.repetition_voie": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.voie": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.complement": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.code_postal": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.commune": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.departement": { locked: false, reset: true },
  "apprenant.contrats[0].adresse.region": { locked: false, reset: true },
};

export const employerSiretLogic = [
  {
    deps: ["apprenant.contrats[0].siret"],
    process: async ({ values, signal, organisme }: { values?: any; signal?: any; organisme?: any }) => {
      const siret = values.apprenant.contrats[0].siret;
      const { messages, result } = await apiService.fetchSiret({
        siret,
        organisme_id: organisme._id,
        signal,
      });

      const resultLength = Object.keys(result).length;
      if (resultLength === 0) return { error: messages.error };

      if (result.api_entreprise === "KO") {
        return {
          warning:
            "Le service de récupération des informations Siret est momentanément indisponible. Nous ne pouvons pas pre-remplir le formulaire.",
          cascade: unlockAllCascade,
        };
      }

      if (result.ferme) {
        return { error: `Le Siret ${siret} est un établissement fermé.` };
      }

      if (result.secretSiret) {
        return {
          warning:
            "Votre siret est valide. En revanche, en raison de sa nature, nous ne pouvons pas récupérer les informations reliées.",
          cascade: unlockAllCascade,
        };
      }

      return {
        cascade: {
          "apprenant.contrats[0].denomination": {
            value: result.enseigne || result.entreprise_raison_sociale,
            locked: false,
          },
          "apprenant.contrats[0].naf": {
            value: result.naf_code,
            locked: false,
            cascade: false,
          },
          "apprenant.contrats[0].nombre_de_salaries": {
            value: result.entreprise_tranche_effectif_salarie?.de || undefined,
            locked: false,
          },
          "apprenant.contrats[0].adresse.numero": {
            value: result.numero_voie || undefined,
            locked: false,
          },
          "apprenant.contrats[0].adresse.repetition_voie": {
            reset: true,
            locked: false,
          },
          "apprenant.contrats[0].adresse.voie": {
            value:
              result.type_voie || result.nom_voie
                ? `${result.type_voie ? `${result.type_voie} ` : undefined}${result.nom_voie}`
                : undefined,
            locked: false,
          },
          "apprenant.contrats[0].adresse.complement": {
            value: result.complement_adresse || undefined,
            locked: false,
          },
          "apprenant.contrats[0].adresse.code_postal": {
            value: result.code_postal || undefined,
            locked: false,
            cascade: false,
          },
          "apprenant.contrats[0].adresse.commune": {
            value: result.commune_implantation_nom || undefined,
            locked: false,
          },
          "apprenant.contrats[0].adresse.departement": {
            value: result.num_departement || undefined,
            locked: false,
          },
          "apprenant.contrats[0].adresse.region": {
            value: result.num_region || undefined,
            locked: true,
          },
        },
      };
    },
  },
  {
    deps: ["apprenant.nouveau_contrat"],
    process: async ({ values, organisme, effectifId }) => {
      try {
        const cerfa = await apiService.saveCerfa({
          organisme_id: organisme._id,
          effectifId,
          data: {
            nouveau_contrat: {
              siret: values.apprenant.contrats[0].siret,
              denomination: values.apprenant.contrats[0].denomination,
              naf: values.apprenant.contrats[0].naf,
              nombre_de_salaries: values.apprenant.contrats[0].nombre_de_salaries ?? 0,
              ...(values.apprenant.contrats[0].type_employeur
                ? { type_employeur: values.apprenant.contrats[0].type_employeur }
                : {}),
              date_debut: values.apprenant.contrats[0].date_debut,
              date_fin: values.apprenant.contrats[0].date_fin,
              ...(values.apprenant.contrats[0].date_rupture
                ? { date_rupture: values.apprenant.contrats[0].date_rupture }
                : {}),
              adresse: {
                numero: values.apprenant.contrats[0].adresse.numero,
                repetition_voie: values.apprenant.contrats[0].adresse.repetition_voie,
                voie: values.apprenant.contrats[0].adresse.voie,
                complement: values.apprenant.contrats[0].adresse.complement,
                code_postal: values.apprenant.contrats[0].adresse.code_postal,
                commune: values.apprenant.contrats[0].adresse.commune,
                departement: values.apprenant.contrats[0].adresse.departement,
                region: values.apprenant.contrats[0].adresse.region,
              },
            },
          },
          inputNames: [
            "apprenant.nouveau_contrat.siret",
            "apprenant.nouveau_contrat.denomination",
            "apprenant.nouveau_contrat.naf",
            "apprenant.nouveau_contrat.nombre_de_salaries",
            "apprenant.nouveau_contrat.type_employeur",
            "apprenant.nouveau_contrat.date_debut",
            "apprenant.nouveau_contrat.date_fin",
            "apprenant.nouveau_contrat.date_rupture",
            "apprenant.nouveau_contrat.adresse.numero",
            "apprenant.nouveau_contrat.adresse.repetition_voie",
            "apprenant.nouveau_contrat.adresse.voie",
            "apprenant.nouveau_contrat.adresse.complement",
            "apprenant.nouveau_contrat.adresse.code_postal",
            "apprenant.nouveau_contrat.adresse.commune",
            "apprenant.nouveau_contrat.adresse.departement",
            "apprenantnouveau_contrat.adresse.region",
          ],
        });
        console.log(cerfa);
        window.location.reload(); // TODO tmp
      } catch (e) {
        console.error(e);
      }

      return { error: "stop propagation" };
    },
  },
];

export const employeurSiretControl = employerSiretLogic;
