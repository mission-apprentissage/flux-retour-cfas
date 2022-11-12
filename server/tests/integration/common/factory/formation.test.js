import { strict as assert } from 'assert';
import { Formation } from '../../../../src/common/factory/formation';
import pick from 'lodash.pick';
import { addMonths } from 'date-fns';

describe("Factory Formation", () => {
  describe("create formation", () => {
    it("Vérifie la création d'une formation avec tous les champs", () => {
      const props = {
        cfd: "50033610",
        cfd_start_date: new Date(),
        cfd_end_date: addMonths(new Date(), 6),
        rncps: ["RNCP34670"],
        libelle: "TEST FORMATION",
        niveau: "3",
        niveau_libelle: "3 (CAP...)",
        metiers: ["Industrie Agroalimentaire"],
      };

      const createdCfaEntity = Formation.create(props);
      const initialPropsData = pick(createdCfaEntity, [
        "cfd",
        "cfd_start_date",
        "cfd_end_date",
        "rncps",
        "libelle",
        "niveau",
        "niveau_libelle",
        "metiers",
      ]);

      assert.deepEqual(initialPropsData, props);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
    });

    it("Vérifie la création d'une formation avec uniquement les champs obligatoires", () => {
      const props = {
        cfd: "50033610",
        cfd_start_date: null,
        cfd_end_date: null,
        libelle: null,
        niveau: null,
        niveau_libelle: null,
        metiers: null,
      };

      const createdCfaEntity = Formation.create(props);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
    });

    it("Vérifie la non création d'une formation sans cfd", () => {
      const props = {
        cfd_start_date: new Date(),
        cfd_end_date: addMonths(new Date(), 6),
        rncp: "RNCP34670",
        libelle: "TEST FORMATION",
        niveau: "3",
        niveau_libelle: "3 (CAP...)",
        metiers: ["Industrie Agroalimentaire"],
      };

      assert.throws(() => Formation.create(props));
    });

    it("Vérifie la non création d'une formation avec cfd invalide", () => {
      const props = {
        cfd: "AZ",
        cfd_start_date: new Date(),
        cfd_end_date: addMonths(new Date(), 6),
        rncp: "RNCP34670",
        libelle: "TEST FORMATION",
        niveau: "3",
        niveau_libelle: "3 (CAP...)",
        metiers: ["Industrie Agroalimentaire"],
      };

      assert.throws(() => Formation.create(props));
    });
  });
});
