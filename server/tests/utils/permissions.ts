import { startOfDay, subMonths } from "date-fns";
import { ObjectId, WithId } from "mongodb";
import { STATUT_PRESENCE_REFERENTIEL } from "shared";
import { Effectif } from "shared/models/data/@types/Effectif";
import { NewOrganisation, Organisation } from "shared/models/data/organisations.model";
import { IOrganisme } from "shared/models/data/organismes.model";

import { addEffectifComputedFields } from "@/common/actions/effectifs.actions";

import { id } from "./testUtils";

/*
Quelques sirets générés à utiliser pour une meilleure lisibilité :
  00000000000018
  00000000000026
  00000000000034
  00000000000042
  00000000000059
  00000000000067
  00000000000075
  00000000000083
  00000000000091
  11111111100006
  11111111100014
  11111111100022
  11111111100030
  11111111100048
  11111111100055
  11111111100063
  11111111100071
  11111111100089
  11111111100097
*/

const created_at = new Date("2023-04-12T18:00:00.000Z");

const ofCible = {
  reseaux: { normal: "CCI", responsable: "COMP_DU_DEVOIR" },
  region: "53", // bretagne
  departement: "56", // morbihan
  academie: "14", // rennes
} as const;

// liste exhaustive des profils à tester pour les permissions
export const profilsPermissionByLabel = {
  "OF cible": {
    _id: new ObjectId(id(1)),
    type: "ORGANISME_FORMATION",
    uai: "0000000A",
    siret: "00000000000018",
    created_at,
  },
  "OF non lié": {
    _id: new ObjectId(id(2)),
    type: "ORGANISME_FORMATION",
    uai: "1111111B",
    siret: "11111111100006",
    created_at,
  },
  "OF formateur": {
    _id: new ObjectId(id(3)),
    type: "ORGANISME_FORMATION",
    uai: "0000000B",
    siret: "00000000000026",
    created_at,
  },
  "OF responsable": {
    _id: new ObjectId(id(4)),
    type: "ORGANISME_FORMATION",
    uai: "0000000C",
    siret: "00000000000034",
    created_at,
  },
  "Tête de réseau même réseau": {
    _id: new ObjectId(id(5)),
    type: "TETE_DE_RESEAU",
    reseau: ofCible.reseaux.normal,
    created_at,
  },
  "Tête de réseau Responsable": {
    _id: new ObjectId(id(6)),
    type: "TETE_DE_RESEAU",
    reseau: ofCible.reseaux.responsable,
    created_at,
  },
  "Tête de réseau autre réseau": {
    _id: new ObjectId(id(7)),
    type: "TETE_DE_RESEAU",
    reseau: "AGRI",
    created_at,
  },
  "DREETS même région": {
    _id: new ObjectId(id(8)),
    type: "DREETS",
    code_region: ofCible.region,
    created_at,
  },
  "DREETS autre région": {
    _id: new ObjectId(id(9)),
    type: "DREETS",
    code_region: "76",
    created_at,
  },
  "DRAAF même région": {
    _id: new ObjectId(id(10)),
    type: "DRAAF",
    code_region: ofCible.region,
    created_at,
  },
  "DRAAF autre région": {
    _id: new ObjectId(id(11)),
    type: "DRAAF",
    code_region: "76",
    created_at,
  },
  "Conseil Régional même région": {
    _id: new ObjectId(id(12)),
    type: "CONSEIL_REGIONAL",
    code_region: ofCible.region,
    created_at,
  },
  "Conseil Régional autre région": {
    _id: new ObjectId(id(13)),
    type: "CONSEIL_REGIONAL",
    code_region: "76",
    created_at,
  },
  "CARIF OREF régional même région": {
    _id: new ObjectId(id(14)),
    type: "CARIF_OREF_REGIONAL",
    code_region: ofCible.region,
    created_at,
  },
  "CARIF OREF régional autre région": {
    _id: new ObjectId(id(15)),
    type: "CARIF_OREF_REGIONAL",
    code_region: "76",
    created_at,
  },
  "DRAFPIC régional même région": {
    _id: new ObjectId(id(16)),
    type: "DRAFPIC",
    code_region: ofCible.region,
    created_at,
  },
  "DRAFPIC régional autre région": {
    _id: new ObjectId(id(17)),
    type: "DRAFPIC",
    code_region: "76",
    created_at,
  },
  "DDETS même département": {
    _id: new ObjectId(id(18)),
    type: "DDETS",
    code_departement: ofCible.departement,
    created_at,
  },
  "DDETS autre département": {
    _id: new ObjectId(id(19)),
    type: "DDETS",
    code_departement: "31",
    created_at,
  },
  "Académie même académie": {
    _id: new ObjectId(id(20)),
    type: "ACADEMIE",
    code_academie: ofCible.academie,
    created_at,
  },
  "Académie autre académie": {
    _id: new ObjectId(id(21)),
    type: "ACADEMIE",
    code_academie: "16",
    created_at,
  },
  "Opérateur public national": {
    _id: new ObjectId(id(22)),
    type: "OPERATEUR_PUBLIC_NATIONAL",
    nom: "Ministère de la Justice",
    created_at,
  },
  "CARIF OREF national": {
    _id: new ObjectId(id(23)),
    type: "CARIF_OREF_NATIONAL",
    created_at,
  },
  Administrateur: {
    _id: new ObjectId(id(24)),
    type: "ADMINISTRATEUR",
    created_at,
  },
} as const satisfies Record<string, WithId<Organisation>>;

type ProfilLabel = keyof typeof profilsPermissionByLabel;

export type PermissionsTestConfig<ExpectedResult = boolean, ExcludedCases extends ProfilLabel = never> = {
  [key in Exclude<ProfilLabel, ExcludedCases>]: ExpectedResult;
};

export const commonOrganismeAttributes: Omit<{ [key in keyof IOrganisme]: IOrganisme[key] }, "_id" | "siret" | "uai"> =
  {
    adresse: {
      departement: ofCible.departement, // morbihan
      region: ofCible.region, // bretagne
      academie: ofCible.academie, // rennes
      bassinEmploi: "5315", // rennes
    },
    reseaux: [ofCible.reseaux.normal, ofCible.reseaux.responsable],
    erps: ["YMAG"],
    nature: "responsable_formateur",
    raison_sociale: "ADEN Formations (Caen)",
    fiabilisation_statut: "FIABLE",
    ferme: false,
    relatedFormations: [],
    organismesFormateurs: [],
    organismesResponsables: [],
    created_at,
    updated_at: created_at,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
    first_transmission_date: startOfDay(subMonths(new Date(), 3)),
    last_transmission_date: startOfDay(subMonths(new Date(), 1)),
  };

export const organismesByLabel = {
  "OF cible": {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(1)),
    uai: profilsPermissionByLabel["OF cible"].uai,
    siret: profilsPermissionByLabel["OF cible"].siret,
    organismesFormateurs: [
      {
        _id: new ObjectId(id(2)),
        responsabilitePartielle: false,
      },
    ] satisfies IOrganisme["organismesFormateurs"],
    organismesResponsables: [
      {
        _id: new ObjectId(id(3)),
        responsabilitePartielle: false,
      },
    ] satisfies IOrganisme["organismesResponsables"],
  },
  "OF formateur": {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(2)),
    uai: profilsPermissionByLabel["OF formateur"].uai,
    siret: profilsPermissionByLabel["OF formateur"].siret,
    organismesResponsables: [
      {
        _id: new ObjectId(id(1)),
        responsabilitePartielle: false,
      },
    ] satisfies IOrganisme["organismesResponsables"],
  },
  "OF responsable": {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(3)),
    uai: profilsPermissionByLabel["OF responsable"].uai,
    siret: profilsPermissionByLabel["OF responsable"].siret,
    organismesFormateurs: [
      {
        _id: new ObjectId(id(1)),
        responsabilitePartielle: false,
      },
    ] satisfies IOrganisme["organismesFormateurs"],
  },
  "OF non lié": {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(10)),
    uai: profilsPermissionByLabel["OF non lié"].uai,
    siret: profilsPermissionByLabel["OF non lié"].siret,
  },
} as const satisfies Record<string, WithId<IOrganisme>>;

export const organismeCibleId = organismesByLabel["OF cible"]._id.toString();

export const organismes: WithId<IOrganisme>[] = Object.values(organismesByLabel);

export const userOrganisme = organismesByLabel["OF cible"];

export const commonEffectifsAttributes: Pick<Effectif, "organisme_id" | "_computed"> = {
  organisme_id: userOrganisme._id,

  _computed: addEffectifComputedFields(userOrganisme),
};

type TestFunc<ExpectedResult> = (
  organisation: NewOrganisation,
  expectedResult: ExpectedResult,
  organisationLabel?: ProfilLabel
) => Promise<any>;

/**
 * Utilitaire pour exécuter un test avec tous les profils d'organisation
 */
export function testPermissions<ExpectedResult, ExcludedCases extends ProfilLabel = never>(
  permissionsConfig: PermissionsTestConfig<ExpectedResult, ExcludedCases>,
  testFunc: TestFunc<ExpectedResult>
) {
  Object.entries(permissionsConfig).forEach(([label, allowed]) => {
    const conf = profilsPermissionByLabel[label];
    it(`${label} - ${allowed ? "ALLOWED" : "FORBIDDEN"}`, async () => {
      await testFunc(conf, allowed as ExpectedResult, label as ProfilLabel);
    });
  });
}
