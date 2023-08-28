import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // cette migration introduit la collection organisations et affecte une organisation à chaque utilisateur
  // try catch au cas où la collection soit créée par le serveur d'abord...
  try {
    await db.createCollection("organisations");
  } catch (err) {
    //
  }

  /*
  Création des organisations avec les membres, récupérés via champ usersMigration.organisation avec :
    - si OF : siret+uai
    - si réseau : réseau
    - si dreets/deets/draaf/conseil régional : codes_region[0]
    - si ddets : codes_departement[0]
    - si académie : codes_academie[0]
  */

  // on crée une organisation seulement pour les organismes fiables
  async function findFirstOrganismeFiable(siret, uai) {
    let organisme;
    if (siret && uai) {
      organisme = await db.collection("organismes").findOne({
        siret: siret,
        uai: uai,
        fiabilisation_statut: "FIABLE",
      });
      if (organisme) {
        console.info(`organisme fiable trouvé pour SIRET/UAI ${siret}/${uai}`);
        return organisme;
      }
    }
    if (siret) {
      organisme = await db.collection("organismes").findOne({
        siret: siret,
        fiabilisation_statut: "FIABLE",
      });
      if (organisme) {
        console.info(`organisme fiable trouvé pour SIRET ${siret}`);
        return organisme;
      }
    }
    if (uai) {
      organisme = await db.collection("organismes").findOne({
        uai: uai,
        fiabilisation_statut: "FIABLE",
      });
      if (organisme) {
        console.info(`organisme fiable trouvé pour UAI ${uai}`);
        return organisme;
      }
    }
    return null;
  }

  {
    console.info("MAJ ORGANISME_FORMATION");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "ORGANISME_FORMATION",
      })
      .toArray();

    const usersWithoutOrganisation: any[] = [];
    const organisations = {};
    for (const user of users) {
      const organisme = await findFirstOrganismeFiable(user.siret, user.uai);
      if (!organisme) {
        usersWithoutOrganisation.push(user);
        continue;
      }
      console.info(
        `Affectation ${user.email} ${user.siret}/${user.uai} à l'organisation ${organisme.siret}/${organisme.uai}`
      );
      let organisation = organisations[`${organisme.siret}/${organisme.uai}`];
      if (!organisation) {
        organisation = organisations[`${organisme.siret}/${organisme.uai}`] = {
          siret: organisme.siret,
          uai: organisme.uai,
          nature: organisme?.nature ?? "inconnue",
          membres: [],
        };
      }
      organisation.membres.push(user._id);
    }
    usersWithoutOrganisation.forEach((user) => {
      console.info(`Aucun organisme fiable trouvé pour ${user.email} (SIRET/UAI=${user.siret}/${user.uai})`);
    });

    const natureOFToOrganisationType = {
      responsable_formateur: "RESPONSABLE_FORMATEUR",
      responsable: "RESPONSABLE",
      formateur: "FORMATEUR",
      inconnue: "FORMATEUR",
    };
    await Promise.all(
      Object.values(organisations).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne(
          stripUndefinedFields({
            type: `ORGANISME_FORMATION_${natureOFToOrganisationType[organisation.nature] || "FORMATEUR"}`,
            siret: organisation.siret,
            uai: organisation.uai,
          })
        );
        await db.collection("usersMigration").updateMany(
          {
            _id: {
              $in: organisation.membres,
            },
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ TETE_DE_RESEAU");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "TETE_DE_RESEAU",
      })
      .toArray();

    const organisations = users.reduce((organisations, user) => {
      let organisation = organisations[user.reseau];
      if (!organisation) {
        organisation = organisations[user.reseau] = {
          reseau: user.reseau,
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisations).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "TETE_DE_RESEAU",
          reseau: organisation.reseau,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "TETE_DE_RESEAU",
            reseau: organisation.reseau,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ DREETS");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "DREETS",
        "codes_region.0": {
          $exists: true,
        },
      })
      .toArray();

    const organisationsReseau = users.reduce((organisations, user) => {
      let organisation = organisations[user.codes_region[0]];
      if (!organisation) {
        organisation = organisations[user.codes_region[0]] = {
          code_region: user.codes_region[0],
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisationsReseau).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "DREETS",
          code_region: organisation.code_region,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "DREETS",
            "codes_region.0": organisation.code_region,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ DEETS");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "DEETS",
        "codes_region.0": {
          $exists: true,
        },
      })
      .toArray();

    const organisationsReseau = users.reduce((organisations, user) => {
      let organisation = organisations[user.codes_region[0]];
      if (!organisation) {
        organisation = organisations[user.codes_region[0]] = {
          code_region: user.codes_region[0],
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisationsReseau).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "DEETS",
          code_region: organisation.code_region,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "DEETS",
            "codes_region.0": organisation.code_region,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ DRAAF");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "DRAAF",
        "codes_region.0": {
          $exists: true,
        },
      })
      .toArray();

    const organisationsReseau = users.reduce((organisations, user) => {
      let organisation = organisations[user.codes_region[0]];
      if (!organisation) {
        organisation = organisations[user.codes_region[0]] = {
          code_region: user.codes_region[0],
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisationsReseau).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "DRAAF",
          code_region: organisation.code_region,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "DRAAF",
            "codes_region.0": organisation.code_region,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ CONSEIL_REGIONAL");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "CONSEIL_REGIONAL",
        "codes_region.0": {
          $exists: true,
        },
      })
      .toArray();

    const organisationsReseau = users.reduce((organisations, user) => {
      let organisation = organisations[user.codes_region[0]];
      if (!organisation) {
        organisation = organisations[user.codes_region[0]] = {
          code_region: user.codes_region[0],
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisationsReseau).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "CONSEIL_REGIONAL",
          code_region: organisation.code_region,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "CONSEIL_REGIONAL",
            "codes_region.0": organisation.code_region,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ DDETS");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "DDETS",
        "codes_departement.0": {
          $exists: true,
        },
      })
      .toArray();

    const organisationsReseau = users.reduce((organisations, user) => {
      let organisation = organisations[user.codes_departement[0]];
      if (!organisation) {
        organisation = organisations[user.codes_departement[0]] = {
          code_departement: user.codes_departement[0],
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisationsReseau).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "DDETS",
          code_departement: organisation.code_departement,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "DDETS",
            "codes_departement.0": organisation.code_departement,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  {
    console.info("MAJ ACADEMIE");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "ACADEMIE",
        "codes_academie.0": {
          $exists: true,
        },
      })
      .toArray();

    const organisationsReseau = users.reduce((organisations, user) => {
      let organisation = organisations[user.codes_academie[0]];
      if (!organisation) {
        organisation = organisations[user.codes_academie[0]] = {
          code_academie: user.codes_academie[0],
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisationsReseau).map(async (organisation: any) => {
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "ACADEMIE",
          code_academie: organisation.code_academie,
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "ACADEMIE",
            "codes_academie.0": organisation.code_academie,
          },
          {
            $set: {
              organisation_id: insertedId,
            },
          }
        );
      })
    );
  }

  // organisation spécifique pour les administrateurs de la plateforme
  {
    console.info("MAJ Admins");
    const { insertedId } = await db.collection("organisations").insertOne({
      type: "ADMINISTRATEUR",
    });
    await db.collection("usersMigration").updateMany(
      {
        is_admin: true,
      },
      {
        $set: {
          organisation_id: insertedId,
        },
      }
    );
  }

  console.info("MAJ organisation.created_at");
  await db.collection("organisations").updateMany(
    {},
    {
      $set: {
        created_at: new Date(),
      },
    }
  );

  const users = await db
    .collection("usersMigration")
    .find({
      organisation_id: {
        $exists: false,
      },
    })
    .toArray();
  console.info(`> Utilisateurs non migrés : ${users.length}`);
  users.forEach((user) => {
    console.info(`${user.email} : ${user.nom} ${user.prenom} (ancienne organisation = '${user.organisation}')`);
  });
  console.info("> Il faudra contacter manuellement ces personnes pour recréer leur compte !");

  await db.collection("usersMigration").deleteMany({
    organisation_id: {
      $exists: false,
    },
  });

  // utilisateurs avec les anciens statuts
  {
    const users = await db
      .collection("usersMigration")
      .find({
        account_status: {
          $not: {
            $in: ["PENDING_EMAIL_VALIDATION", "PENDING_ADMIN_VALIDATION", "CONFIRMED"],
          },
        },
      })
      .toArray();
    console.info("> Utilisateurs dont il faudra leur communiquer de reset leur MDP :");
    users.forEach((user) => {
      console.info(
        `${user.email} : ${user.nom} ${user.prenom} (ancienne organisation='${user.organisation}', ancien statut='${user.account_status}')`
      );
    });
    await db.collection("usersMigration").updateMany(
      {
        _id: {
          $in: users.map((user) => user._id),
        },
      },
      {
        $set: {
          account_status: "CONFIRMED",
        },
      }
    );
  }
};

function stripUndefinedFields(object) {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (typeof value !== "undefined") {
      acc[key] = value?.constructor?.name === "Object" ? stripUndefinedFields(value) : value;
    }
    return acc;
  }, {});
}
