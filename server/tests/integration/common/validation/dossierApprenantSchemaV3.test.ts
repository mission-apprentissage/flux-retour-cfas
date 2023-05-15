import dossierApprenantSchemaV3, {
  DossierApprenantSchemaV3ZodType,
} from "@/common/validation/dossierApprenantSchemaV3";

const validInput: DossierApprenantSchemaV3ZodType = {
  source: "test",
  apprenant: {
    nom: "test",
    prenom: "test",
    date_de_naissance: new Date().toISOString(),
    statut: 1,
    date_metier_mise_a_jour_statut: new Date().toISOString(),
    id_erp: "test",
  },
  etablissement_responsable: {
    siret: "12345678912345",
  },
  etablissement_formateur: {
    siret: "12345678912345",
  },
  formation: {
    code_cfd: "50022141",
    code_rncp: "RNCP35316",
    periode: "2022-2023",
    annee_scolaire: "2022-2023",
    date_inscription: new Date().toISOString(),
    date_entree: new Date().toISOString(),
    date_fin: new Date().toISOString(),
  },
};

const expected = {
  source: "test",
  apprenant: {
    nom: "TEST",
    prenom: "test",
    date_de_naissance: expect.any(Date),
    statut: 1,
    date_metier_mise_a_jour_statut: expect.any(Date),
    id_erp: "test",
  },
  etablissement_responsable: {
    siret: "12345678912345",
  },
  etablissement_formateur: {
    siret: "12345678912345",
  },
  formation: {
    code_cfd: "50022141",
    code_rncp: "RNCP35316",
    periode: [2022, 2023],
    annee_scolaire: "2022-2023",
    date_inscription: expect.any(Date),
    date_entree: expect.any(Date),
    date_fin: expect.any(Date),
  },
};

const invalidInput = {
  source: null,
  apprenant: {
    nom: 1,
    prenom: 2,
    date_de_naissance: 3,
    statut: "?",
    date_metier_mise_a_jour_statut: "2002/02/02",
    id_erp: true,
    // V1 - OPTIONAL FIELDS
    ine: true,
    email: "test",
    telephone: "abc",
    code_commune_insee: "abc",
    // V3 - OPTIONAL FIELDS
    sexe: "homme",
    rqth: "non",
    date_rqth: "02/02/2002",
  },
  etablissement_responsable: {
    siret: "1",
    uai: "2",
    nom: "",
  },
  etablissement_formateur: {
    siret: "test",
    uai: "test",
    nom: true,
    code_commune_insee: "test",
  },
  formation: {
    libelle_court: "",
    libelle_long: "",
    periode: "1000-20000",
    annee_scolaire: "2100-2200",
    annee: 100,
    code_rncp: "test",
    code_cfd: "test",
    // V3 - REQUIRED FIELDS
    date_inscription: "20/02/07",
    date_entree: "07-02-20",
    date_fin: "2022-02",
    // V3 - OPTIONAL FIELDS
    obtention_diplome: "test",
    date_obtention_diplome: "test",
    date_exclusion: "test",
    cause_exclusion: 1,
    referent_handicap: {
      nom: 1,
      prenom: 2,
      email: "test",
    },
  },
  contrat: {
    date_debut: "test",
    date_fin: 2000,
    date_rupture: "test",
    // V3 - OPTIONAL FIELDS
    cause_rupture: 1,
  },
  employeur: {
    siret: true,
    code_commune_insee: true,
    code_naf: "test",
  },
};

describe("dossierApprenantSchemaV3.test", () => {
  it("returns required root fields with empty entry", () => {
    const output = dossierApprenantSchemaV3().strict().safeParse({});
    if (output.success) {
      throw new Error("should not be a success");
    }
    expect(output.error.issues.map((o) => o)).toMatchSnapshot();
  });

  it("returns required fields with empty entry", () => {
    const output = dossierApprenantSchemaV3()
      .strict()
      .safeParse({ apprenant: {}, etablissement_responsable: {}, etablissement_formateur: {}, formation: {} });
    if (output.success) {
      throw new Error("should not be a success");
    }
    expect(output.error.issues.map((o) => o)).toMatchSnapshot();
  });

  it("return all errors with a complete invalid entry", () => {
    const output = dossierApprenantSchemaV3().strict().safeParse(invalidInput);

    if (output.success) {
      throw new Error("should not be a success");
    }
    expect(output.error.issues.map((o) => o)).toMatchSnapshot();
  });

  it("accept a valid dossierApprenantV3", () => {
    const output = dossierApprenantSchemaV3().strict().safeParse(validInput);

    expect(output).toStrictEqual({ success: true, data: expected });
  });

  it("is idempotent", () => {
    const output = dossierApprenantSchemaV3().strict().safeParse(validInput);
    if (!output.success) {
      throw new Error("output is not success");
    }
    const output2 = dossierApprenantSchemaV3().strict().safeParse(output.data);
    expect(output2).toStrictEqual({ success: true, data: expected });
  });
});
