import { ObjectId, WithId } from "mongodb";

import { addEffectifComputedFields } from "@/common/actions/effectifs.actions";
import { Effectif } from "@/common/model/@types/Effectif";
import { Organisme } from "@/common/model/@types/Organisme";
import { NewOrganisation } from "@/common/model/organisations.model";

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

const commonOrganismeAttributes: Omit<{ [key in keyof Organisme]: Organisme[key] }, "_id" | "siret" | "uai"> = {
  adresse: {
    departement: "56", // morbihan
    region: "53", // bretagne
    academie: "14", // rennes
    bassinEmploi: "5315", // rennes
  },
  reseaux: ["CCI"],
  erps: ["YMAG"],
  nature: "responsable_formateur",
  raison_sociale: "ADEN Formations (Caen)",
  fiabilisation_statut: "FIABLE",
  ferme: false,
  metiers: [],
  relatedFormations: [],
  created_at: new Date("2023-04-12T18:00:00.000Z"),
  updated_at: new Date("2023-04-12T18:00:00.000Z"),
  est_dans_le_referentiel: true,
  last_transmission_date: new Date("2023-04-15T18:00:00.000Z"),
};

export const organismes: WithId<Organisme>[] = [
  // owner
  {
    _id: new ObjectId(id(1)),
    uai: "0000000A",
    siret: "00000000000018",
    ...commonOrganismeAttributes,
    nature: "formateur",
  },
  {
    _id: new ObjectId(id(2)),
    uai: "0000000B",
    siret: "00000000000026",
    ...commonOrganismeAttributes,
    nature: "responsable_formateur",
    relatedFormations: generateRelatedFormations([{ uai: "0000000A", siret: "00000000000018" }]),
  },
  {
    _id: new ObjectId(id(3)),
    uai: "0000000C",
    siret: "00000000000034",
    ...commonOrganismeAttributes,
    nature: "responsable",
    relatedFormations: generateRelatedFormations([
      { uai: "0000000A", siret: "00000000000018" },
      { uai: "0000000B", siret: "00000000000026" },
    ]),
  },
  // other
  {
    _id: new ObjectId(id(10)),
    uai: "1111111B",
    siret: "11111111100006",
    ...commonOrganismeAttributes,
  },
];

export const userOrganisme = organismes[0];

export const commonEffectifsAttributes: Pick<Effectif, "organisme_id" | "_computed"> = {
  organisme_id: userOrganisme._id,

  _computed: addEffectifComputedFields(userOrganisme),
};

export interface ProfilPermission {
  label: string;
  organisation: NewOrganisation;
}

// liste exhaustive des profils à tester pour les permissions
const profilsOrganisation = [
  {
    label: "OFF lié",
    organisation: {
      type: "ORGANISME_FORMATION_FORMATEUR",
      uai: "0000000A",
      siret: "00000000000018",
    },
  },
  {
    label: "OFF non lié",
    organisation: {
      type: "ORGANISME_FORMATION_FORMATEUR",
      uai: "1111111B",
      siret: "11111111100006",
    },
  },
  {
    label: "OFRF lié",
    organisation: {
      type: "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
      uai: "0000000A",
      siret: "00000000000018",
    },
  },
  {
    label: "OFRF responsable",
    organisation: {
      type: "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
      uai: "0000000B",
      siret: "00000000000026",
    },
  },
  {
    label: "OFRF non lié",
    organisation: {
      type: "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
      uai: "1111111B",
      siret: "11111111100006",
    },
  },
  {
    label: "OFR lié",
    organisation: {
      type: "ORGANISME_FORMATION_RESPONSABLE",
      uai: "0000000A",
      siret: "00000000000018",
    },
  },
  {
    label: "OFR responsable",
    organisation: {
      type: "ORGANISME_FORMATION_RESPONSABLE",
      uai: "0000000C",
      siret: "00000000000034",
    },
  },
  {
    label: "OFR non lié",
    organisation: {
      type: "ORGANISME_FORMATION_RESPONSABLE",
      uai: "1111111B",
      siret: "11111111100006",
    },
  },
  {
    label: "Tête de réseau",
    organisation: {
      type: "TETE_DE_RESEAU",
      reseau: "CCI",
    },
  },
  {
    label: "Tête de réseau non liée",
    organisation: {
      type: "TETE_DE_RESEAU",
      reseau: "AGRI",
    },
  },
  {
    label: "DREETS même région",
    organisation: {
      type: "DREETS",
      code_region: "53",
    },
  },
  {
    label: "DREETS autre région",
    organisation: {
      type: "DREETS",
      code_region: "76",
    },
  },
  {
    label: "ACADEMIE même académie",
    organisation: {
      type: "ACADEMIE",
      code_academie: "14",
    },
  },
  {
    label: "ACADEMIE autre académie",
    organisation: {
      type: "ACADEMIE",
      code_academie: "16",
    },
  },
  {
    label: "DDETS même département",
    organisation: {
      type: "DDETS",
      code_departement: "56",
    },
  },
  {
    label: "DDETS autre département",
    organisation: {
      type: "DDETS",
      code_departement: "31",
    },
  },
  {
    label: "Opérateur public national",
    organisation: {
      type: "OPERATEUR_PUBLIC_NATIONAL",
      nom: "Ministère de la Justice",
    },
  },
  {
    label: "Administrateur",
    organisation: {
      type: "ADMINISTRATEUR",
    },
  },
] as const satisfies ReadonlyArray<ProfilPermission>;

type profilLabels = (typeof profilsOrganisation)[number]["label"];

export const profilsPermissionByLabel = profilsOrganisation.reduce(
  (acc, v) => ({ ...acc, [v.label]: v }),
  {} as { [key in profilLabels]: ProfilPermission }
);

export type PermissionsTestConfig<ExpectedResult = boolean> = { [key in profilLabels]: ExpectedResult };

type TestFunc<ExpectedResult> = (organisation: NewOrganisation, expectedResult: ExpectedResult) => Promise<any>;

/**
 * Utilitaire pour exécuter un test avec tous les profils d'organisation
 */
export function testPermissions<ExpectedResult>(
  permissionsConfig: PermissionsTestConfig<ExpectedResult>,
  testFunc: TestFunc<ExpectedResult>
) {
  Object.entries(permissionsConfig).forEach(([label, allowed]) => {
    const conf = profilsPermissionByLabel[label];
    it(`${conf.label} - ${allowed ? "ALLOWED" : "FORBIDDEN"}`, async () => {
      await testFunc(conf.organisation, allowed);
    });
  });
}

interface RelatedOrganisme {
  siret: string;
  uai: string;
}
export function generateRelatedFormations(
  relatedOrganismes: RelatedOrganisme[]
): Required<Organisme>["relatedFormations"] {
  return [
    {
      formation_id: new ObjectId(id(1)),
      annee_formation: -1,
      duree_formation_theorique: 2,
      organismes: relatedOrganismes.map((relatedOrganisme) => ({
        organisme_id: new ObjectId(id(1)),
        nature: "responsable", // pas utilisé
        uai: relatedOrganisme.uai,
        siret: relatedOrganisme.siret,
      })),
    },
  ];
}
