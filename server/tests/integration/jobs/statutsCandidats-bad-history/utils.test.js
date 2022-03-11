const assert = require("assert").strict;

const {
  identifyElementCausingWrongRupturantSequence,
} = require("../../../../src/jobs/statutsCandidats-bad-history/utils");

const { codesStatutsCandidats } = require("../../../../src/common/constants/statutsCandidatsConstants");

describe("bad-history-utils", () => {
  describe("identifyElementCausingWrongRupturantSequence", () => {
    it("should return null when passed argument has length 0", () => {
      assert.equal(identifyElementCausingWrongRupturantSequence([]), null);
    });

    it("should return null when passed argument has length 1", () => {
      assert.equal(identifyElementCausingWrongRupturantSequence([{}]), null);
    });

    it("should return null when passed argument has no rupturant sequence", () => {
      const okSequence = [
        { date_statut: new Date("2020-09-01"), valeur_statut: codesStatutsCandidats.inscrit },
        { date_statut: new Date("2020-09-15"), valeur_statut: codesStatutsCandidats.apprenti },
      ];
      assert.equal(identifyElementCausingWrongRupturantSequence(okSequence), null);
    });

    it("should return null when passed argument has rupturant sequence with no problem", () => {
      const okSequence = [
        { date_statut: new Date("2020-09-01"), valeur_statut: codesStatutsCandidats.inscrit },
        { date_statut: new Date("2020-09-15"), valeur_statut: codesStatutsCandidats.apprenti },
        { date_statut: new Date("2020-09-30"), valeur_statut: codesStatutsCandidats.inscrit },
      ];
      assert.equal(identifyElementCausingWrongRupturantSequence(okSequence), null);
    });

    it("should return problematic element when passed argument has rupturant sequence with antidated inscrit statut", () => {
      const problematicElement = { date_statut: new Date("2020-10-01"), valeur_statut: codesStatutsCandidats.inscrit };
      const problematicSequence = [
        problematicElement,
        { date_statut: new Date("2020-09-15"), valeur_statut: codesStatutsCandidats.apprenti },
      ];
      assert.equal(identifyElementCausingWrongRupturantSequence(problematicSequence), problematicElement);
    });

    it("should return problematic element when passed argument has rupturant sequence with antidated inscrit statut (more complex)", () => {
      const problematicElement = { date_statut: new Date("2020-10-01"), valeur_statut: codesStatutsCandidats.inscrit };
      const problematicSequence = [
        { date_statut: new Date("2020-09-01"), valeur_statut: codesStatutsCandidats.inscrit },
        { date_statut: new Date("2020-09-10"), valeur_statut: codesStatutsCandidats.apprenti },
        problematicElement,
        { date_statut: new Date("2020-09-20"), valeur_statut: codesStatutsCandidats.apprenti },
      ];
      assert.equal(identifyElementCausingWrongRupturantSequence(problematicSequence), problematicElement);
    });

    it("should return problematic element when passed argument has rupturant sequence with antidated inscrit statut (even more complex)", () => {
      const problematicElement = {
        valeur_statut: codesStatutsCandidats.inscrit,
        date_statut: new Date("2021-09-05T22:00:00.000Z"),
      };
      const problematicSequence = [
        {
          valeur_statut: codesStatutsCandidats.inscrit,
          date_statut: new Date("2021-07-18T22:00:00.000Z"),
        },
        {
          valeur_statut: codesStatutsCandidats.apprenti,
          date_statut: new Date("2021-08-31T22:00:00.000Z"),
        },
        problematicElement,
        {
          valeur_statut: codesStatutsCandidats.apprenti,
          date_statut: new Date("2021-08-31T22:00:00.000Z"),
        },
        {
          valeur_statut: codesStatutsCandidats.abandon,
          date_statut: new Date("2021-09-09T22:00:00.000Z"),
        },
      ];
      assert.equal(identifyElementCausingWrongRupturantSequence(problematicSequence), problematicElement);
    });

    it("should return null element when passed argument has rupturant sequence with invalid date", () => {
      const okSequence = [
        {
          valeur_statut: codesStatutsCandidats.apprenti,
          date_statut: new Date("1899-12-30T00:00:00.000Z"),
        },
        {
          valeur_statut: 2,
          date_statut: new Date("2020-12-18T22:27:42.014Z"),
        },
        {
          valeur_statut: codesStatutsCandidats.apprenti,
          date_statut: new Date("2021-07-12T17:10:35.114Z"),
        },
        {
          valeur_statut: 2,
          date_statut: new Date("2021-07-11T22:00:00.000Z"),
        },
      ];
      assert.equal(identifyElementCausingWrongRupturantSequence(okSequence), null);
    });
  });
});
