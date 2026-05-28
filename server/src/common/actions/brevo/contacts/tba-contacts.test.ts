import { ObjectId } from "bson";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  connexionInvitationsDb,
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import {
  buildOrganisme,
  buildOrgaMl,
  buildOrgaOf,
  buildRupturant,
  buildUser,
  NOW,
  resetFixtureCounters,
} from "./fixtures";
import { tbaContactsContactList } from "./tba-contacts";

useMongo();

const buildEffectif = (
  organismeId: ObjectId,
  statut: "APPRENTI" | "RUPTURANT",
  override: Record<string, any> = {}
) => ({
  _id: new ObjectId(),
  organisme_id: organismeId,
  annee_scolaire: "2025-2026",
  source: "ERP",
  apprenant: { nom: "X", prenom: "Y", date_de_naissance: new Date("2005-01-01") },
  formation: { libelle_long: "BTS" },
  _computed: { statut: { en_cours: statut } },
  created_at: NOW,
  updated_at: NOW,
  ...override,
});

const buildMlStatsDoc = (
  mlId: ObjectId,
  stats: { total: number; a_traiter: number; traite: number },
  override: Record<string, any> = {}
) => ({
  _id: new ObjectId(),
  mission_locale_id: mlId,
  computed_day: NOW,
  stats: {
    total: stats.total,
    a_traiter: stats.a_traiter,
    traite: stats.traite,
    rdv_pris: 0,
    rdv_pris_decouverts: 0,
    nouveau_projet: 0,
    deja_accompagne: 0,
    contacte_sans_retour: 0,
    injoignables: 0,
    coordonnees_incorrectes: 0,
    autre: 0,
    cherche_contrat: 0,
    reorientation: 0,
    ne_veut_pas_accompagnement: 0,
    ne_souhaite_pas_etre_recontacte: 0,
    autre_avec_contact: 0,
    deja_connu: 0,
    mineur: 0,
    mineur_a_traiter: 0,
    mineur_traite: 0,
    mineur_rdv_pris: 0,
    mineur_nouveau_projet: 0,
    mineur_deja_accompagne: 0,
    mineur_contacte_sans_retour: 0,
    mineur_injoignables: 0,
    mineur_coordonnees_incorrectes: 0,
    mineur_autre: 0,
    mineur_cherche_contrat: 0,
    mineur_reorientation: 0,
    mineur_ne_veut_pas_accompagnement: 0,
    mineur_ne_souhaite_pas_etre_recontacte: 0,
    mineur_autre_avec_contact: 0,
    rqth: 0,
    rqth_a_traiter: 0,
    rqth_traite: 0,
    rqth_rdv_pris: 0,
    rqth_nouveau_projet: 0,
    rqth_deja_accompagne: 0,
    rqth_contacte_sans_retour: 0,
    rqth_injoignables: 0,
    rqth_coordonnees_incorrectes: 0,
    rqth_autre: 0,
    rqth_cherche_contrat: 0,
    rqth_reorientation: 0,
    rqth_ne_veut_pas_accompagnement: 0,
    rqth_ne_souhaite_pas_etre_recontacte: 0,
    rqth_autre_avec_contact: 0,
    abandon: 0,
  },
  created_at: NOW,
  ...override,
});

describe("tbaContactsContactList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    resetFixtureCounters();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("fetchContacts - happy path CFA", () => {
    it("retourne un user CFA nominal avec tous ses attributs Brevo + compteurs", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf, {
        mode_de_transmission: "API",
        erps: ["ypareo"],
        api_key: "key-abc",
        last_transmission_date: new Date("2026-04-01T00:00:00.000Z"),
        organismesFormateurs: [
          { siret: "11111111111111", uai: "0111111A" },
          { siret: "22222222222222", uai: "0222222B" },
          { siret: "33333333333333", uai: "0333333C" },
        ],
      });
      const user = buildUser(orgaOf, { email: "alice@example.com" });

      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(user as any);
      await effectifsDb().insertMany(
        [
          buildEffectif(organisme._id, "APPRENTI") as any,
          buildEffectif(organisme._id, "APPRENTI") as any,
          buildEffectif(organisme._id, "RUPTURANT") as any,
        ],
        { bypassDocumentValidation: true }
      );

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      const lienConnexion = contacts[0].attributes.LIEN_CONNEXION_PERSONNALISE as string;
      expect(lienConnexion).toMatch(/^http:\/\/localhost:3000\/auth\/connexion\?invitationToken=[a-f0-9]+/);
      expect(lienConnexion).toContain("utm_source=brevo");
      expect(lienConnexion).toContain("utm_medium=email");

      expect(contacts[0]).toMatchObject({
        email: "alice@example.com",
        attributes: {
          CIVILITE: "Mme",
          NOM: "Dupont",
          PRENOM: "Alice",
          FONCTION: "Conseillère",
          TELEPHONE: "33123456789",
          SOURCE_EMAIL: "users_tba",
          STATUT_COMPTE_USER: "CONFIRMED",
          ORGANISATION: "Mon CFA",
          TYPE_ORGANISATION: "ORGANISME_FORMATION",
          CFA_RESEAUX: "CMA",
          REGION: "Île-de-France",
          DEPARTEMENT_NOM: "Paris",
          DEPARTEMENT_NUM: "75",
          ENSEIGNE: "Mon CFA",
          RAISON_SOCIALE: "Mon CFA SARL",
          SIRET: orgaOf.siret,
          UAI: orgaOf.uai,
          UAI_SIRET: `${orgaOf.uai}_${orgaOf.siret}`,
          STATUT_SIRET: "ouvert",
          ORGANISME_ID: String(organisme._id),
          URL_TBA: `http://localhost:3000/organismes/${String(organisme._id)}`,
          STATUT_FIABILISATION: "FIABLE",
          CFA_NATURE: null,
          CFA_NB_FORMATEURS: 3,
          CFA_ERP_OU_DECA: "erp",
          CFA_ERP: "ypareo",
          CFA_STATUT_CLE_API: "oui",
          CFA_NB_ERREURS_TRANSMISSION: null,
          CFA_NB_APPRENANTS_ERP: 2,
          CFA_NB_APPRENANTS_DECA: 0,
          CFA_NB_RUPTURANTS_ERP: 1,
          CFA_NB_RUPTURANTS_DECA: 0,
          // organisme sans `nature` → ne passe pas les checks d'éligibilité V2
          CFA_STATUT_V2: "exclu",
          ML_NB_RUPTURANTS_TOTAL: null,
          ML_NB_RUPTURANTS_A_TRAITER: null,
          ML_NB_RUPTURANTS_TRAITES: null,
          ML_POURCENTAGE_RUPTURANTS_TRAITES: null,
        },
      });

      // CFA_ERP_CLIENT volontairement ABSENT du payload (préserve la valeur Brevo manuelle).
      expect("CFA_ERP_CLIENT" in contacts[0].attributes).toBe(false);
    });
  });

  describe("fetchContacts - happy path ML", () => {
    it("retourne un user Mission Locale avec stats ML, cfa_* à null", async () => {
      const orgaMl = buildOrgaMl("ML PARIS");
      const user = buildUser(orgaMl, { email: "bob@ml.fr" });

      await organisationsDb().insertOne(orgaMl as any);
      await usersMigrationDb().insertOne(user as any);
      await missionLocaleStatsDb().insertOne(
        buildMlStatsDoc(orgaMl._id, { total: 50, a_traiter: 10, traite: 40 }) as any,
        { bypassDocumentValidation: true }
      );

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        email: "bob@ml.fr",
        attributes: {
          NOM: "Dupont",
          PRENOM: "Alice",
          ORGANISATION: "ML PARIS",
          TYPE_ORGANISATION: "MISSION_LOCALE",
          SIRET: null,
          UAI: null,
          STATUT_SIRET: "inconnu",
          ORGANISME_ID: null,
          URL_TBA: null,
          CFA_NATURE: null,
          CFA_NB_FORMATEURS: null,
          CFA_ERP: null,
          CFA_STATUT_CLE_API: null,
          CFA_NB_APPRENANTS_ERP: null,
          CFA_NB_APPRENANTS_DECA: null,
          CFA_NB_RUPTURANTS_ERP: null,
          CFA_NB_RUPTURANTS_DECA: null,
          STATUT_FIABILISATION: null,
          ML_NB_RUPTURANTS_TOTAL: 50,
          ML_NB_RUPTURANTS_A_TRAITER: 10,
          ML_NB_RUPTURANTS_TRAITES: 40,
          ML_POURCENTAGE_RUPTURANTS_TRAITES: 80,
        },
      });
      expect("CFA_ERP_CLIENT" in contacts[0].attributes).toBe(false);
    });

    it("retourne 0 pour total/a_traiter/traite quand pas de doc missionLocaleStats", async () => {
      const orgaMl = buildOrgaMl("ML SOLO");
      await organisationsDb().insertOne(orgaMl as any);
      await usersMigrationDb().insertOne(buildUser(orgaMl) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.ML_NB_RUPTURANTS_TOTAL).toBe(0);
      expect(contacts[0].attributes.ML_NB_RUPTURANTS_A_TRAITER).toBe(0);
      expect(contacts[0].attributes.ML_NB_RUPTURANTS_TRAITES).toBe(0);
      expect(contacts[0].attributes.ML_POURCENTAGE_RUPTURANTS_TRAITES).toBe(0);
    });

    it("prend toujours le snapshot le plus récent quand plusieurs computed_day existent pour la même ML", async () => {
      const orgaMl = buildOrgaMl("ML STALE");
      await organisationsDb().insertOne(orgaMl as any);
      await usersMigrationDb().insertOne(buildUser(orgaMl) as any);

      const yesterday = new Date(NOW.getTime() - 24 * 3600 * 1000);
      await missionLocaleStatsDb().insertMany(
        [
          buildMlStatsDoc(orgaMl._id, { total: 100, a_traiter: 100, traite: 0 }, { computed_day: yesterday }) as any,
          buildMlStatsDoc(orgaMl._id, { total: 100, a_traiter: 20, traite: 80 }) as any,
        ],
        { bypassDocumentValidation: true }
      );

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts[0].attributes.ML_NB_RUPTURANTS_A_TRAITER).toBe(20);
      expect(contacts[0].attributes.ML_NB_RUPTURANTS_TRAITES).toBe(80);
    });
  });

  describe("fetchContacts - exclusions", () => {
    it("exclut un user désinscrit (unsubscribe: true)", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf, { unsubscribe: true }) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toEqual([]);
    });

    it("exclut un user non CONFIRMED", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf, { account_status: "PENDING_EMAIL_VALIDATION" }) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toEqual([]);
    });

    it("exclut un user ADMINISTRATEUR (compte interne TBA)", async () => {
      const orgaAdmin = {
        _id: new ObjectId(),
        type: "ADMINISTRATEUR",
        created_at: NOW,
      };
      await organisationsDb().insertOne(orgaAdmin as any);
      await usersMigrationDb().insertOne(buildUser(orgaAdmin) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toEqual([]);
    });
  });

  describe("fetchContacts - attributs partagés", () => {
    it("STATUT_SIRET='fermé' quand organisme.ferme=true", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf, { ferme: true });
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.STATUT_SIRET).toBe("fermé");
    });

    it("STATUT_SIRET='inconnu' quand la typologie d'organisation n'a pas de SIRET", async () => {
      const orgaArml = {
        _id: new ObjectId(),
        type: "ARML",
        nom: "ARML Île-de-France",
        region_list: ["11"],
        created_at: NOW,
      };
      await organisationsDb().insertOne(orgaArml as any);
      await usersMigrationDb().insertOne(buildUser(orgaArml) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.STATUT_SIRET).toBe("inconnu");
      expect(contacts[0].attributes.SIRET).toBeNull();
      expect(contacts[0].attributes.TYPE_ORGANISATION).toBe("ARML");
    });

    it("DEPARTEMENT_NOM dérive le libellé depuis le code (75 → Paris)", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf, {
        adresse: { region: "11", departement: "75", academie: "01", commune: "Paris" },
      });
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.REGION).toBe("Île-de-France");
      expect(contacts[0].attributes.DEPARTEMENT_NUM).toBe("75");
      expect(contacts[0].attributes.DEPARTEMENT_NOM).toBe("Paris");
      expect(contacts[0].attributes.ACADEMIE).toBe("Paris");
    });

    it("ML_DATE_ACTIVATION_ML remonté côté OF aussi (date d'activation collab CFA)", async () => {
      const activatedAt = new Date("2026-01-15T10:00:00.000Z");
      const orgaOf = buildOrgaOf({ ml_beta_activated_at: activatedAt });
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.ML_DATE_ACTIVATION_ML).toEqual(activatedAt);
    });
  });

  describe("fetchContacts - compteurs CFA APPRENANTS / RUPTURANTS", () => {
    it("compte les apprenants et rupturants ERP et DECA séparément", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);

      await effectifsDb().insertMany(
        [
          buildEffectif(organisme._id, "APPRENTI") as any,
          buildEffectif(organisme._id, "APPRENTI") as any,
          buildEffectif(organisme._id, "APPRENTI") as any,
          buildEffectif(organisme._id, "RUPTURANT") as any,
          buildEffectif(organisme._id, "RUPTURANT") as any,
        ],
        { bypassDocumentValidation: true }
      );
      await effectifsDECADb().insertMany(
        [
          buildEffectif(organisme._id, "APPRENTI") as any,
          buildEffectif(organisme._id, "RUPTURANT") as any,
          buildEffectif(organisme._id, "RUPTURANT") as any,
          buildEffectif(organisme._id, "RUPTURANT") as any,
        ],
        { bypassDocumentValidation: true }
      );

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.CFA_NB_APPRENANTS_ERP).toBe(3);
      expect(contacts[0].attributes.CFA_NB_APPRENANTS_DECA).toBe(1);
      expect(contacts[0].attributes.CFA_NB_RUPTURANTS_ERP).toBe(2);
      expect(contacts[0].attributes.CFA_NB_RUPTURANTS_DECA).toBe(3);
    });

    it("CFA_ERP_OU_DECA='deca' quand pas de mode_de_transmission API mais effectifs DECA présents", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);
      await effectifsDECADb().insertMany([buildEffectif(organisme._id, "APPRENTI") as any], {
        bypassDocumentValidation: true,
      });

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts[0].attributes.CFA_ERP_OU_DECA).toBe("deca");
    });
  });

  describe("fetchContacts - extension campagne CFA (NB_JEUNES_EN_RUPTURE, LISTE_MISSIONS_LOCALES)", () => {
    it("retourne 0 / 0 / '' quand l'organisme n'a aucun rupturant suivi par une ML", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.NB_JEUNES_EN_RUPTURE).toBe(0);
      expect(contacts[0].attributes.NB_MISSIONS_LOCALES_PARTENAIRES).toBe(0);
      expect(contacts[0].attributes.LISTE_MISSIONS_LOCALES).toBe("");
    });

    it("compte les jeunes en rupture par ML et formate la liste avec 'et N autres'", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      const mlA = buildOrgaMl("ML A");
      const mlB = buildOrgaMl("ML B");
      const mlC = buildOrgaMl("ML C");

      await organisationsDb().insertMany([orgaOf as any, mlA as any, mlB as any, mlC as any]);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);
      // ML A : 3 rupturants, ML B : 2, ML C : 1 → "ML A, ML B et 1 autre"
      await missionLocaleEffectifsDb().insertMany(
        [
          buildRupturant(organisme._id, mlA._id) as any,
          buildRupturant(organisme._id, mlA._id) as any,
          buildRupturant(organisme._id, mlA._id) as any,
          buildRupturant(organisme._id, mlB._id) as any,
          buildRupturant(organisme._id, mlB._id) as any,
          buildRupturant(organisme._id, mlC._id) as any,
        ],
        { bypassDocumentValidation: true }
      );

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.NB_JEUNES_EN_RUPTURE).toBe(6);
      expect(contacts[0].attributes.NB_MISSIONS_LOCALES_PARTENAIRES).toBe(3);
      expect(contacts[0].attributes.LISTE_MISSIONS_LOCALES).toBe("ML A, ML B et 1 autre");
    });

    it("formate '2 ML' sans suffixe", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      const mlA = buildOrgaMl("ML A");
      const mlB = buildOrgaMl("ML B");

      await organisationsDb().insertMany([orgaOf as any, mlA as any, mlB as any]);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);
      await missionLocaleEffectifsDb().insertMany(
        [
          buildRupturant(organisme._id, mlA._id) as any,
          buildRupturant(organisme._id, mlA._id) as any,
          buildRupturant(organisme._id, mlB._id) as any,
        ],
        { bypassDocumentValidation: true }
      );

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts[0].attributes.NB_JEUNES_EN_RUPTURE).toBe(3);
      expect(contacts[0].attributes.NB_MISSIONS_LOCALES_PARTENAIRES).toBe(2);
      expect(contacts[0].attributes.LISTE_MISSIONS_LOCALES).toBe("ML A, ML B");
    });

    it("les champs d'extension sont null côté ML (réservés aux OF)", async () => {
      const orgaMl = buildOrgaMl("ML PARIS");
      await organisationsDb().insertOne(orgaMl as any);
      await usersMigrationDb().insertOne(buildUser(orgaMl) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.NB_JEUNES_EN_RUPTURE).toBeNull();
      expect(contacts[0].attributes.NB_MISSIONS_LOCALES_PARTENAIRES).toBeNull();
      expect(contacts[0].attributes.LISTE_MISSIONS_LOCALES).toBeNull();
    });
  });

  describe("fetchContacts - CFA_STATUT_V2 (éligibilité activation V2)", () => {
    it("'oui' quand l'organisme est déjà actif V2 (is_allowed_deca=true)", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf, { is_allowed_deca: true });
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.CFA_STATUT_V2).toBe("oui");
    });

    it("'activable' quand l'organisme passe les 5 checks d'éligibilité mais pas encore actif", async () => {
      const orgaOf = buildOrgaOf();
      // nature ∈ NATURES_ELIGIBLES + ferme false (défaut) + siret/uai (défaut) +
      // pas de formationsCatalogue (rien inséré) + effectifs présents ↓
      const organisme = buildOrganisme(orgaOf, { nature: "responsable_formateur" });
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);
      await effectifsDb().insertMany([buildEffectif(organisme._id, "APPRENTI") as any], {
        bypassDocumentValidation: true,
      });

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.CFA_STATUT_V2).toBe("activable");
    });

    it("'exclu' quand l'organisme est fermé (ferme=true)", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf, { nature: "responsable_formateur", ferme: true });
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf) as any);
      await effectifsDb().insertMany([buildEffectif(organisme._id, "APPRENTI") as any], {
        bypassDocumentValidation: true,
      });

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.CFA_STATUT_V2).toBe("exclu");
    });

    it("null côté ML (réservé aux OF)", async () => {
      const orgaMl = buildOrgaMl("ML PARIS");
      await organisationsDb().insertOne(orgaMl as any);
      await usersMigrationDb().insertOne(buildUser(orgaMl) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].attributes.CFA_STATUT_V2).toBeNull();
    });
  });

  describe("fetchContacts - effet de bord sur connexionInvitations", () => {
    it("sync réelle : crée une invitation de connexion par user en DB, source=tba-contacts", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf, { email: "alice@example.fr" }) as any);

      const contacts = await tbaContactsContactList.fetchContacts();

      expect(await connexionInvitationsDb().countDocuments({})).toBe(1);
      const invitation = await connexionInvitationsDb().findOne({ email: "alice@example.fr" });
      expect(invitation?.token).toMatch(/^[a-f0-9]{100}$/);
      expect(invitation?.source).toBe("tba-contacts");

      const lien = contacts[0].attributes.LIEN_CONNEXION_PERSONNALISE as string;
      expect(lien).toContain(`invitationToken=${invitation?.token}`);
    });

    it("idempotent : 2 syncs successives produisent le même token pour le même email", async () => {
      const orgaOf = buildOrgaOf();
      const organisme = buildOrganisme(orgaOf);
      await organisationsDb().insertOne(orgaOf as any);
      await organismesDb().insertOne(organisme as any);
      await usersMigrationDb().insertOne(buildUser(orgaOf, { email: "stable@example.fr" }) as any);

      const first = await tbaContactsContactList.fetchContacts();
      const second = await tbaContactsContactList.fetchContacts();

      expect(first[0].attributes.LIEN_CONNEXION_PERSONNALISE).toBe(second[0].attributes.LIEN_CONNEXION_PERSONNALISE);
      expect(await connexionInvitationsDb().countDocuments({})).toBe(1);
    });
  });
});
