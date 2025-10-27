import { ObjectId } from "mongodb";
import { describe, it, expect } from "vitest";

import { personV2Db } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { ingestPersonV2, type IIngestPersonV2Params } from "./person.ingestion";

useMongo();

describe("ingestionPersonV2", () => {
  it("doit créer la personne si celle-ci n'existe pas", async () => {
    const dossier = {
      nom_apprenant: "DOE",
      prenom_apprenant: "John",
      date_de_naissance_apprenant: new Date("1990-01-01"),
    } as const satisfies IIngestPersonV2Params;

    const result = await ingestPersonV2(dossier);

    expect(result).toEqual({
      _id: expect.any(ObjectId),
      identifiant: {
        nom: dossier.nom_apprenant,
        prenom: dossier.prenom_apprenant,
        date_de_naissance: dossier.date_de_naissance_apprenant,
      },
      parcours: { en_cours: null, chronologie: [] },
    });

    expect(await personV2Db().find({}).toArray()).toEqual([result]);
  });

  it("doit retourner la personne si celle-ci existe", async () => {
    const dossier = {
      nom_apprenant: "DOE",
      prenom_apprenant: "John",
      date_de_naissance_apprenant: new Date("1990-01-01"),
    } as const satisfies IIngestPersonV2Params;

    const existingPerson = {
      _id: new ObjectId(),
      identifiant: {
        nom: dossier.nom_apprenant,
        prenom: dossier.prenom_apprenant,
        date_de_naissance: dossier.date_de_naissance_apprenant,
      },
    };

    await personV2Db().insertOne(existingPerson);

    const result = await ingestPersonV2(dossier);

    expect(result).toEqual(existingPerson);

    expect(await personV2Db().find({}).toArray()).toEqual([existingPerson]);
  });

  it("doit utiliser la clé d'unicité (nom + prenom + date_naissance)", async () => {
    const dossier = {
      nom_apprenant: "DOE",
      prenom_apprenant: "John",
      date_de_naissance_apprenant: new Date("1990-01-01"),
    } as const satisfies IIngestPersonV2Params;

    const existingPersons = [
      {
        _id: new ObjectId(),
        identifiant: {
          nom: "DUPONT",
          prenom: dossier.prenom_apprenant,
          date_de_naissance: dossier.date_de_naissance_apprenant,
        },
      },
      {
        _id: new ObjectId(),
        identifiant: {
          nom: dossier.nom_apprenant,
          prenom: "Jean",
          date_de_naissance: dossier.date_de_naissance_apprenant,
        },
      },
      {
        _id: new ObjectId(),
        identifiant: {
          nom: dossier.nom_apprenant,
          prenom: dossier.prenom_apprenant,
          date_de_naissance: new Date("1990-01-02"),
        },
      },
    ];

    await personV2Db().insertMany(existingPersons);

    const result = await ingestPersonV2(dossier);

    expect({
      _id: expect.any(ObjectId),
      identifiant: {
        nom: dossier.nom_apprenant,
        prenom: dossier.prenom_apprenant,
        date_de_naissance: dossier.date_de_naissance_apprenant,
      },
      parcours: { en_cours: null, chronologie: [] },
    }).toEqual(result);

    expect(await personV2Db().countDocuments()).toBe(existingPersons.length + 1);
  });

  it.each([["Dupont"], ["  DuPont "], ["  DuPont "], ["\u0064UPONT"]])(
    "doit normaliser les noms",
    async (nom_apprenant) => {
      const existingPerson = {
        _id: new ObjectId(),
        identifiant: {
          nom: "DUPONT",
          prenom: "Jean",
          date_de_naissance: new Date("1990-01-01"),
        },
      };

      const dossier = {
        nom_apprenant,
        prenom_apprenant: existingPerson.identifiant.prenom,
        date_de_naissance_apprenant: existingPerson.identifiant.date_de_naissance,
      };

      await personV2Db().insertOne(existingPerson);

      const result = await ingestPersonV2(dossier);

      expect(result).toEqual(existingPerson);
    }
  );

  it.each([["JEAN"], ["  JEan "], ["  \u006aean "]])("doit normaliser les prenoms", async (prenom_apprenant) => {
    const existingPerson = {
      _id: new ObjectId(),
      identifiant: {
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: new Date("1990-01-01"),
      },
    };

    const dossier = {
      nom_apprenant: existingPerson.identifiant.nom,
      prenom_apprenant,
      date_de_naissance_apprenant: existingPerson.identifiant.date_de_naissance,
    };

    await personV2Db().insertOne(existingPerson);

    const result = await ingestPersonV2(dossier);

    expect(result).toEqual(existingPerson);
  });
});
