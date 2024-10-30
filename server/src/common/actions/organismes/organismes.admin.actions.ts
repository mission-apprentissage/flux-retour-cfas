import { ObjectId } from "bson";
import escapeStringRegexp from "escape-string-regexp";
import { OrganismeSupportInfo } from "shared/models";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import { IOrganisationOrganismeFormation } from "shared/models/data/organisations.model";
import { IUsersMigration } from "shared/models/data/usersMigration.model";

import { getCfdInfo } from "@/common/apis/apiAlternance/apiAlternance";
import { getEtablissement } from "@/common/apis/ApiEntreprise";
import logger from "@/common/logger";
import {
  effectifsDb,
  fiabilisationUaiSiretDb,
  formationsCatalogueDb,
  organisationsDb,
  organismesDb,
  organismesReferentielDb,
} from "@/common/model/collections";

import { getTransmissionRelatedToOrganismeByDate } from "../indicateurs/transmissions/transmission.action";

function getFormationEtablissment(formation: OffreFormation, siret: string) {
  if (formation.formateur.siret === siret) return formation.formateur;
  if (formation.gestionnaire.siret === siret) return formation.gestionnaire;
  return null;
}

function getOnisep(formationCatalogue: IFormationCatalogue): OffreFormation["onisep"] {
  if (
    !formationCatalogue.onisep_url ||
    !formationCatalogue.onisep_intitule ||
    !formationCatalogue.onisep_lien_site_onisepfr ||
    !formationCatalogue.onisep_discipline ||
    !formationCatalogue.onisep_domaine_sousdomaine
  ) {
    return null;
  }

  return {
    url: formationCatalogue.onisep_url,
    intitule: formationCatalogue.onisep_intitule,
    libelle_poursuite: formationCatalogue.onisep_intitule,
    lien_site_onisepfr: formationCatalogue.onisep_lien_site_onisepfr,
    discipline: formationCatalogue.onisep_discipline,
    domaine_sousdomaine: formationCatalogue.onisep_domaine_sousdomaine,
  };
}

function getSessions(formationCatalogue: IFormationCatalogue): OffreFormation["sessions"] {
  const sessions: OffreFormation["sessions"] = [];

  if (!formationCatalogue.date_debut || !formationCatalogue.date_fin) {
    return sessions;
  }

  for (let i = 0; i < formationCatalogue.date_debut.length; i++) {
    sessions.push({
      debut: formationCatalogue.date_debut[i],
      fin: formationCatalogue.date_fin[i],
    });
  }

  return sessions;
}

async function getRncps(formationCatalogue: IFormationCatalogue): Promise<OffreFormation["rncps"]> {
  const tco = await getCfdInfo(formationCatalogue.cfd);

  if (!tco) {
    if (!formationCatalogue.rncp_code) {
      return [];
    }

    return [
      {
        code: formationCatalogue.rncp_code,
        // Toujours présent lorsque le code est présent
        intitule: formationCatalogue.rncp_intitule ?? "",
        eligible_apprentissage: formationCatalogue.rncp_eligible_apprentissage ?? null,
        eligible_professionnalisation: null,
        date_fin_validite_enregistrement: formationCatalogue.rncp_details?.date_fin_validite_enregistrement ?? "",
        active_inactive: formationCatalogue.rncp_details?.active_inactive ?? "",
      },
    ];
  }

  return tco.rncps.map((r) => {
    return {
      code: r.code_rncp,
      intitule: r.intitule_diplome,
      eligible_apprentissage: r.eligible_apprentissage ?? null,
      eligible_professionnalisation: r.eligible_professionnalisation ?? null,
      date_fin_validite_enregistrement: r?.date_fin_validite_enregistrement?.toJSON() ?? "",
      active_inactive: r?.active_inactive ?? "",
    };
  });
}

async function buildOffreDeFormation(formationCatalogue: IFormationCatalogue): Promise<OffreFormation> {
  return {
    id_catalogue: formationCatalogue.id_formation,
    cle_ministere_educatif: formationCatalogue.cle_ministere_educatif,

    cfd: {
      code: formationCatalogue.cfd,
      outdated: formationCatalogue.cfd_outdated,
      date_fermeture: formationCatalogue.cfd_date_fermeture ?? null,
    },

    niveau: {
      libelle: formationCatalogue.niveau,
      entree_obligatoire: formationCatalogue.niveau_entree_obligatoire,
    },

    duree: {
      theorique: formationCatalogue.duree,
      incoherente: formationCatalogue.duree_incoherente,
    },

    annee: {
      num: formationCatalogue.annee,
      incoherente: formationCatalogue.annee_incoherente,
    },

    intitule_long: formationCatalogue.intitule_long,
    intitule_court: formationCatalogue.intitule_court,

    nature: {
      libelle: formationCatalogue.diplome,
      code: formationCatalogue.niveau_formation_diplome,
    },

    onisep: getOnisep(formationCatalogue),

    rncps: await getRncps(formationCatalogue),

    lieu_formation: {
      adresse: {
        code_postal: formationCatalogue.code_postal,
        code_commune_insee: formationCatalogue.code_commune_insee,
        num_departement: formationCatalogue.num_departement,
        region: formationCatalogue.region,
        localite: formationCatalogue.localite,
        adresse: formationCatalogue.lieu_formation_adresse,
        nom_academie: formationCatalogue.nom_academie,
        num_academie: formationCatalogue.num_academie,
      },
      siret: formationCatalogue.lieu_formation_siret ?? null,
    },

    entierement_a_distance: formationCatalogue.entierement_a_distance,

    sessions: getSessions(formationCatalogue),

    gestionnaire: {
      id_catalogue: formationCatalogue.etablissement_gestionnaire_id ?? null,
      siret: formationCatalogue.etablissement_gestionnaire_siret,
      uai: formationCatalogue.etablissement_gestionnaire_uai,
      enseigne: formationCatalogue.etablissement_gestionnaire_enseigne || null,
      habilite_rncp: formationCatalogue.etablissement_gestionnaire_habilite_rncp ?? null,
      certifie_qualite: formationCatalogue.etablissement_gestionnaire_certifie_qualite ?? null,
      adresse: {
        code_postal: formationCatalogue.etablissement_gestionnaire_code_postal ?? null,
        code_commune_insee: formationCatalogue.etablissement_gestionnaire_code_commune_insee ?? null,
        num_departement: formationCatalogue.etablissement_gestionnaire_num_departement ?? null,
        region: formationCatalogue.etablissement_gestionnaire_region ?? null,
        localite: formationCatalogue.etablissement_gestionnaire_localite ?? null,
        adresse: formationCatalogue.etablissement_gestionnaire_adresse ?? null,
        nom_academie: formationCatalogue.etablissement_gestionnaire_nom_academie ?? null,
        num_academie: formationCatalogue.etablissement_gestionnaire_num_academie ?? null,
      },
      raison_sociale: formationCatalogue.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      date_creation: formationCatalogue.etablissement_gestionnaire_date_creation ?? null,
      reference: formationCatalogue.etablissement_reference === "gestionnaire",
    },
    formateur: {
      id_catalogue: formationCatalogue.etablissement_formateur_id ?? null,
      siret: formationCatalogue.etablissement_formateur_siret,
      uai: formationCatalogue.etablissement_formateur_uai,
      enseigne: formationCatalogue.etablissement_formateur_enseigne || null,
      habilite_rncp: formationCatalogue.etablissement_formateur_habilite_rncp ?? null,
      certifie_qualite: formationCatalogue.etablissement_formateur_certifie_qualite ?? null,
      adresse: {
        code_postal: formationCatalogue.etablissement_gestionnaire_code_postal ?? null,
        code_commune_insee: formationCatalogue.etablissement_gestionnaire_code_commune_insee ?? null,
        num_departement: formationCatalogue.etablissement_gestionnaire_num_departement ?? null,
        region: formationCatalogue.etablissement_gestionnaire_region ?? null,
        localite: formationCatalogue.etablissement_gestionnaire_localite ?? null,
        adresse: formationCatalogue.etablissement_gestionnaire_adresse ?? null,
        nom_academie: formationCatalogue.etablissement_gestionnaire_nom_academie ?? null,
        num_academie: formationCatalogue.etablissement_gestionnaire_num_academie ?? null,
      },
      raison_sociale: formationCatalogue.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      date_creation: formationCatalogue.etablissement_gestionnaire_date_creation ?? null,
      reference: formationCatalogue.etablissement_reference === "formateur",
    },
  };
}

async function getOffreFormations(siret: string): Promise<OffreFormation[]> {
  const formationsCatalogue = await formationsCatalogueDb()
    .find({
      $or: [
        { etablissement_formateur_siret: siret },
        { etablissement_gestionnaire_siret: siret },
        { lieu_formation_siret: siret },
      ],
    })
    .toArray();
  return Promise.all(formationsCatalogue.map(buildOffreDeFormation));
}

async function findOrganismesSupportInfoBySiret(siret: string): Promise<OrganismeSupportInfo[]> {
  const [apiEntreprise, tdb, referentiel, formations, fiabilisation, organisations] = await Promise.all([
    // Silent Error: c'est du support
    getEtablissement(siret).catch((err) => {
      logger.error(err);
      return null;
    }),
    organismesDb().find({ siret }).toArray(),
    organismesReferentielDb().find({ siret }).toArray(),
    getOffreFormations(siret),
    fiabilisationUaiSiretDb().find({ siret }).toArray(),
    organisationsDb()
      .aggregate<IOrganisationOrganismeFormation & { users: IUsersMigration[] }>([
        { $match: { type: "ORGANISME_FORMATION", siret } },
        {
          $lookup: {
            from: "usersMigration",
            localField: "_id",
            foreignField: "organisation_id",
            as: "users",
          },
        },
        {
          $match: {
            "users.0": { $exists: true },
          },
        },
      ])
      .toArray(),
  ]);

  const tdbByUai = new Map(tdb.map((o) => [o.uai ?? null, o]));
  const referentielByUai = new Map(referentiel.map((o) => [o.uai ?? null, o]));
  const fiabilisationByUai = new Map(fiabilisation.map((o) => [o.uai ?? null, o]));
  const organisationByUai = new Map(organisations.map((o) => [o.uai ?? null, o]));

  const formationsByUai = new Map();

  for (const formation of formations) {
    const etablissement = getFormationEtablissment(formation, siret);
    if (etablissement) {
      const list = formationsByUai.get(etablissement.uai) ?? [];
      list.push(formation);
      formationsByUai.set(etablissement.uai, list);
    }
  }

  const uais = new Set([
    ...tdbByUai.keys(),
    ...referentielByUai.keys(),
    ...fiabilisationByUai.keys(),
    ...formationsByUai.keys(),
  ]);

  if (apiEntreprise && uais.size === 0) {
    uais.add(null);
  }

  const organismes: OrganismeSupportInfo[] = [];
  for (const uai of uais) {
    const tdbOrganisme = tdbByUai.get(uai);
    const referentielOrganisme = referentielByUai.get(uai);

    const etat = new Set<"fermé" | "actif" | "inconnu">();
    if (tdbOrganisme) {
      etat.add(tdbOrganisme.ferme ? "fermé" : "actif");
    }
    if (referentielOrganisme) {
      etat.add(referentielOrganisme.etat_administratif ?? "inconnu");
    }
    if (apiEntreprise) {
      etat.add(apiEntreprise.etat_administratif === "A" ? "actif" : "fermé");
    }
    if (etat.size === 0) {
      etat.add("inconnu");
    }

    const formations = formationsByUai.get(uai) ?? [];

    const effectifs =
      tdbOrganisme == null
        ? []
        : await effectifsDb()
            .find({
              organisme_id: {
                $in: [tdbOrganisme._id, ...(tdbOrganisme.organismesFormateurs?.map((f) => f._id as ObjectId) ?? [])],
              },
            })
            .toArray();

    const transmissions = tdbOrganisme == null ? [] : await getTransmissionRelatedToOrganismeByDate(tdbOrganisme._id);

    organismes.push({
      uai,
      siret,
      nom:
        tdbOrganisme?.nom ??
        apiEntreprise?.enseigne ??
        apiEntreprise?.unite_legale?.personne_morale_attributs?.raison_sociale ??
        "Organisme inconnu",
      tdb: tdbByUai.get(uai) ?? null,
      referentiel: referentielByUai.get(uai) ?? null,
      fiabilisation: fiabilisationByUai.get(uai) ?? null,
      formations,
      apiEntreprise: apiEntreprise,
      organisation: organisationByUai.get(uai) ?? null,
      etat: Array.from(etat),
      effectifs: effectifs.length,
      transmissions,
    });
  }

  return organismes;
}

export async function searchOrganismesSupportInfoBySiret(search: string): Promise<OrganismeSupportInfo[]> {
  if (/^[0-9]{14}$/.test(search)) {
    return findOrganismesSupportInfoBySiret(search);
  }

  const sirets = await organismesDb()
    .find(
      {
        $or: [
          { uai: { $regex: escapeStringRegexp(search), $options: "i" } },
          { siret: { $regex: escapeStringRegexp(search), $options: "i" } },
          { nom: { $regex: escapeStringRegexp(search), $options: "i" } },
          { enseigne: { $regex: escapeStringRegexp(search), $options: "i" } },
          { raison_sociale: { $regex: escapeStringRegexp(search), $options: "i" } },
        ],
      },
      {
        projection: { siret: 1 },
      }
    )
    .toArray();

  const uniqueSirets = Array.from(new Set(sirets.map((s) => s.siret)));

  const results = await Promise.all(uniqueSirets.map(findOrganismesSupportInfoBySiret));

  return results.flat();
}
