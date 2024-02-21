import { register } from "@/common/actions/account.actions";
import { createOrganisme, findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { getUserByEmail } from "@/common/actions/users.actions";
import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";
import { buildAdresseFromUai } from "@/common/utils/uaiUtils";

// TODO devrait désactiver l'envoi d'email globalement en mode CLI
export const seedAdmin = async ({ email } = { email: "admin@test.fr" }) => {
  // Create user Admin
  if (!(await getUserByEmail(email))) {
    await register({
      user: {
        email,
        password: "Secret!Password1",
        civility: "Monsieur",
        nom: "Admin",
        prenom: "test",
        fonction: "",
        telephone: "",
        has_accept_cgu_version: "",
      },
      organisation: {
        type: "ADMINISTRATEUR",
      },
    });
  }

  await usersMigrationDb().updateOne(
    {
      email,
    },
    {
      $set: {
        account_status: "CONFIRMED",
      },
    }
  );
  logger.info(`Admin User ${email} with password 'Secret!Password1' is successfully created `);
};

export const seedSample = async () => {
  await seedSampleOrganismes();
  await seedSampleUsers();
};

export const seedSampleOrganismes = async () => {
  // Create Organisme A reseau A erp A
  // Create Organisme B reseau A erp B
  // Create Organisme C reseau B erp A

  const organismeK = await findOrganismeByUaiAndSiret("0333326L", "51400512300062");
  if (!organismeK) {
    await createOrganisme({
      uai: "0333326L",
      siret: "51400512300062",
      nature: "responsable_formateur",
      ...buildAdresseFromUai("0333326L"),
      organismesFormateurs: [],
      organismesResponsables: [],
    });
  }

  const organismeA = await findOrganismeByUaiAndSiret("0142321X", "44492238900010");
  if (!organismeA) {
    await createOrganisme({
      uai: "0142321X",
      siret: "44492238900010",
      reseaux: ["CCI"],
      nature: "responsable_formateur",
      nom: "ADEN Formations (Caen)",
      ...buildAdresseFromUai("0142321X"),
      organismesFormateurs: [],
      organismesResponsables: [],
    });
    logger.info("organisme A created");
  }

  const organismeB = await findOrganismeByUaiAndSiret("0611309S", "44492238900044");
  if (!organismeB) {
    await createOrganisme({
      uai: "0611309S",
      siret: "44492238900044",
      reseaux: ["CCI"],
      erps: ["GESTI"],
      nature: "inconnue",
      nom: "ADEN Formations (Damigny)",
      ...buildAdresseFromUai("0611309S"),
      organismesFormateurs: [],
      organismesResponsables: [],
    });
    logger.info("organisme B created");
  }

  const organismeC = await findOrganismeByUaiAndSiret("0010856A", "77931004400028");
  if (!organismeC) {
    await createOrganisme({
      uai: "0010856A",
      siret: "77931004400028",
      reseaux: ["UIMM"],
      erps: ["YMAG"],
      nature: "responsable_formateur",
      nom: "AFPMA APPRENTISSAGE - Site de Peronnas",
      ...buildAdresseFromUai("0010856A"),
      organismesFormateurs: [],
      organismesResponsables: [],
    });
    logger.info("organisme C created");
  }

  const organismeZ = await findOrganismeByUaiAndSiret("0261098C", "34497770700027");
  if (!organismeZ) {
    await createOrganisme({
      uai: "0261098C",
      siret: "34497770700027",
      reseaux: ["MFR"],
      erps: ["GESTI"],
      nature: "responsable_formateur",
      nom: "MAISON FAMILIALE RURALE CFA - 26300 CHATEAUNEUF SUR ISERE",
      ...buildAdresseFromUai("0261098C"),
      organismesFormateurs: [],
      organismesResponsables: [],
    });
    logger.info("organisme Z created");
  }

  const organismeE = await findOrganismeByUaiAndSiret("0312755B", "49917930700024");
  if (!organismeE) {
    await createOrganisme({
      uai: "0312755B",
      siret: "49917930700024",
      nature: "responsable_formateur",
      nom: "MIDISUP",
      ...buildAdresseFromUai("0312755B"),
      organismesFormateurs: [],
      organismesResponsables: [],
    });
    logger.info("organisme E created");
  }
};

export const seedSampleUsers = async () => {
  // Create user ofr
  if (!(await getUserByEmail("ofr@test.fr"))) {
    await register({
      user: {
        email: "ofr@test.fr",
        password: "Secret!Password1",
        civility: "Monsieur",
        nom: "ofr",
        prenom: "test",
        fonction: "",
        telephone: "",
        has_accept_cgu_version: "",
      },
      organisation: {
        type: "ORGANISME_FORMATION",
        uai: "0010856A",
        siret: "77931004400028",
      },
    });
  }

  await usersMigrationDb().updateOne(
    {
      email: "ofr@test.fr",
    },
    {
      $set: {
        account_status: "CONFIRMED",
      },
    }
  );
};
