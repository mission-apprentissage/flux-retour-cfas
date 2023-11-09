import { InfoSiret } from "@/common/types/infoSiret";
import { apiService } from "@/modules/mon-espace/effectifs/engine/services/api.service";

const unlockAllCascade = {
  "contrats[0].denomination": { locked: false, reset: true },
  "contrats[0].naf": { locked: false, reset: true },
  "contrats[0].nombre_de_salaries": { locked: false, reset: true },
  "contrats[0].adresse.numero": { locked: false, reset: true },
  "contrats[0].adresse.repetition_voie": { locked: false, reset: true },
  "contrats[0].adresse.voie": { locked: false, reset: true },
  "contrats[0].adresse.complement": { locked: false, reset: true },
  "contrats[0].adresse.code_postal": { locked: false, reset: true },
  "contrats[0].adresse.commune": { locked: false, reset: true },
  "contrats[0].adresse.departement": { locked: false, reset: true },
  "contrats[0].adresse.region": { locked: false, reset: true },
};

export const employerSiretLogic = [
  {
    deps: ["contrats[0].siret"],
    process: async ({ values, signal }: { values?: any; signal?: any }) => {
      const siret = values.contrats[0].siret;
      const { messages, result, error }: InfoSiret = await apiService.fetchSiret({
        siret,
        signal,
      });

      if (error) return { error };

      if (!result || Object.keys(result).length === 0) return { error: messages?.api_entreprise_info };

      if (messages?.api_entreprise_status === "KO") {
        return {
          warning:
            "Le service de récupération des informations Siret est momentanément indisponible. Nous ne pouvons pas pre-remplir le formulaire.",
          cascade: unlockAllCascade,
        };
      }

      if (result?.ferme) {
        return { error: `Le Siret ${siret} est un établissement fermé.` };
      }

      if (result?.secretSiret) {
        return {
          warning:
            "Votre siret est valide. En revanche, en raison de sa nature, nous ne pouvons pas récupérer les informations reliées.",
          cascade: unlockAllCascade,
        };
      }

      return {
        cascade: {
          "contrats[0].denomination": {
            value: result?.enseigne || result?.raison_sociale,
            locked: false,
          },
          "contrats[0].naf": {
            value: result?.naf_code,
            locked: false,
            cascade: false,
          },
          "contrats[0].nombre_de_salaries": {
            value: result?.tranche_effectif_salarie_etablissement?.de || undefined,
            locked: false,
          },
          "contrats[0].adresse.numero": {
            value: result?.numero_voie || undefined,
            locked: false,
          },
          "contrats[0].adresse.repetition_voie": {
            reset: true,
            locked: false,
          },
          "contrats[0].adresse.voie": {
            value:
              result?.type_voie || result?.nom_voie
                ? `${result.type_voie ? `${result.type_voie} ` : undefined}${result.nom_voie}`
                : undefined,
            locked: false,
          },
          "contrats[0].adresse.complement": {
            value: result?.complement_adresse || undefined,
            locked: false,
          },
          "contrats[0].adresse.code_postal": {
            value: result?.code_postal || undefined,
            locked: false,
            cascade: false,
          },
          "contrats[0].adresse.commune": {
            value: result?.commune_implantation_nom || undefined,
            locked: false,
          },
          "contrats[0].adresse.departement": {
            value: result?.num_departement || undefined,
            locked: false,
          },
          "contrats[0].adresse.region": {
            value: result?.num_region || undefined,
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
        await apiService.saveEffectifForm({
          organisme_id: organisme._id,
          effectifId,
          data: {
            nouveau_contrat: {
              siret: values.contrats[0].siret,
              denomination: values.contrats[0].denomination,
              naf: values.contrats[0].naf,
              nombre_de_salaries: values.contrats[0].nombre_de_salaries ?? 0,
              ...(values.contrats[0].type_employeur ? { type_employeur: values.contrats[0].type_employeur } : {}),
              date_debut: values.contrats[0].date_debut,
              date_fin: values.contrats[0].date_fin,
              ...(values.contrats[0].date_rupture ? { date_rupture: values.contrats[0].date_rupture } : {}),
              adresse: {
                numero: values.contrats[0].adresse.numero,
                repetition_voie: values.contrats[0].adresse.repetition_voie,
                voie: values.contrats[0].adresse.voie,
                complement: values.contrats[0].adresse.complement,
                code_postal: values.contrats[0].adresse.code_postal,
                commune: values.contrats[0].adresse.commune,
                departement: values.contrats[0].adresse.departement,
                region: values.contrats[0].adresse.region,
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
            "apprenant.nouveau_contrat.adresse.region",
          ],
        });
        window.location.reload(); // TODO tmp
      } catch (e) {
        console.error(e);
      }

      return { error: "stop propagation" };
    },
  },
];

export const employeurSiretControl = employerSiretLogic;
