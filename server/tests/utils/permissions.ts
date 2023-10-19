import { startOfDay, subMonths } from "date-fns";
import { ObjectId, WithId } from "mongodb";

import { addEffectifComputedFields } from "@/common/actions/effectifs.actions";
import { STATUT_PRESENCE_REFERENTIEL } from "@/common/constants/organisme";
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

export const commonOrganismeAttributes: Omit<{ [key in keyof Organisme]: Organisme[key] }, "_id" | "siret" | "uai"> = {
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
  organismesFormateurs: [],
  organismesResponsables: [],
  created_at: new Date("2023-04-12T18:00:00.000Z"),
  updated_at: new Date("2023-04-12T18:00:00.000Z"),
  est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
  last_transmission_date: startOfDay(subMonths(new Date(), 1)),
};

export const organismes: WithId<Organisme>[] = [
  // owner
  {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(1)),
    uai: "0000000A",
    siret: "00000000000018",
    organismesFormateurs: [
      {
        _id: new ObjectId(id(2)),
      },
    ],
    organismesResponsables: [
      {
        _id: new ObjectId(id(3)),
      },
    ],
  },
  {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(2)),
    uai: "0000000B",
    siret: "00000000000026",
    organismesResponsables: [
      {
        _id: new ObjectId(id(1)),
      },
    ],
  },
  {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(3)),
    uai: "0000000C",
    siret: "00000000000034",
    organismesFormateurs: [
      {
        _id: new ObjectId(id(1)),
      },
    ],
  },
  // other
  {
    ...commonOrganismeAttributes,
    _id: new ObjectId(id(10)),
    uai: "1111111B",
    siret: "11111111100006",
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
    label: "OF cible",
    organisation: {
      type: "ORGANISME_FORMATION",
      uai: "0000000A",
      siret: "00000000000018",
    },
  },
  {
    label: "OF non lié",
    organisation: {
      type: "ORGANISME_FORMATION",
      uai: "1111111B",
      siret: "11111111100006",
    },
  },
  {
    label: "OF formateur",
    organisation: {
      type: "ORGANISME_FORMATION",
      uai: "0000000B",
      siret: "00000000000026",
    },
  },
  {
    label: "OF responsable",
    organisation: {
      type: "ORGANISME_FORMATION",
      uai: "0000000C",
      siret: "00000000000034",
    },
  },
  {
    label: "Tête de réseau même réseau",
    organisation: {
      type: "TETE_DE_RESEAU",
      reseau: "CCI",
    },
  },
  {
    label: "Tête de réseau autre réseau",
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
    label: "DRAAF même région",
    organisation: {
      type: "DRAAF",
      code_region: "53",
    },
  },
  {
    label: "DRAAF autre région",
    organisation: {
      type: "DRAAF",
      code_region: "76",
    },
  },
  {
    label: "Conseil Régional même région",
    organisation: {
      type: "CONSEIL_REGIONAL",
      code_region: "53",
    },
  },
  {
    label: "Conseil Régional autre région",
    organisation: {
      type: "CONSEIL_REGIONAL",
      code_region: "76",
    },
  },
  {
    label: "CARIF OREF régional même région",
    organisation: {
      type: "CARIF_OREF_REGIONAL",
      code_region: "53",
    },
  },
  {
    label: "CARIF OREF régional autre région",
    organisation: {
      type: "CARIF_OREF_REGIONAL",
      code_region: "76",
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
    label: "Académie même académie",
    organisation: {
      type: "ACADEMIE",
      code_academie: "14",
    },
  },
  {
    label: "Académie autre académie",
    organisation: {
      type: "ACADEMIE",
      code_academie: "16",
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
    label: "CARIF OREF national",
    organisation: {
      type: "CARIF_OREF_NATIONAL",
    },
  },
  {
    label: "Administrateur",
    organisation: {
      type: "ADMINISTRATEUR",
    },
  },
] as const satisfies ReadonlyArray<ProfilPermission>;

type ProfilLabel = (typeof profilsOrganisation)[number]["label"];

export const profilsPermissionByLabel = profilsOrganisation.reduce(
  (acc, v) => ({ ...acc, [v.label]: v }),
  {} as { [key in ProfilLabel]: ProfilPermission }
);

export type PermissionsTestConfig<ExpectedResult = boolean> = { [key in ProfilLabel]: ExpectedResult };

type TestFunc<ExpectedResult> = (
  organisation: NewOrganisation,
  expectedResult: ExpectedResult,
  organisationLabel?: ProfilLabel
) => Promise<any>;

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
      await testFunc(conf.organisation, allowed, conf.label);
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
