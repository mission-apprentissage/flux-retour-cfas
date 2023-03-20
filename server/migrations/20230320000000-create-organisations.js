export const up = async (/** @type {import('mongodb').Db} */ db) => {
  // cette migration introduit la collection organisations et affecte une organisation à chaque utilisateur
  await db.createCollection("organisations");

  /*
  Création des organisations avec les membres, récupérés via champ usersMigration.organisation avec :
    - si OF : siret
    - si réseau : réseau
    - si dreets/deets/draaf/conseil régional : codes_region[0]
    - si ddets : codes_departement[0]
    - si académie : codes_academie[0]
  */
  {
    console.log("MAJ ORGANISME_FORMATION");
    const users = await db
      .collection("usersMigration")
      .find({
        organisation: "ORGANISME_FORMATION",
      })
      .toArray();

    const organisations = users.reduce((organisations, user) => {
      let organisation = organisations[user.siret];
      if (!organisation) {
        organisation = organisations[user.siret] = {
          siret: user.siret,
          membres: [],
        };
      }
      organisation.membres.push(user._id);
      return organisations;
    }, {});

    await Promise.all(
      Object.values(organisations).map(async (organisation) => {
        const organisme = await db.collection("organismes").findOne({
          siret: organisation.siret,
        });
        if (!organisme) {
          console.log(`organisme ${organisation.siret} non trouvé`);
          // on continue quand même la création des organisations, sans la nature
        }
        const { insertedId } = await db.collection("organisations").insertOne({
          type: "ORGANISME_FORMATION",
          siret: organisation.siret,
          nature: organisme?.nature ?? "inconnue",
        });
        await db.collection("usersMigration").updateMany(
          {
            organisation: "ORGANISME_FORMATION",
            siret: organisation.siret,
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
    console.log("MAJ TETE_DE_RESEAU");
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
      Object.values(organisations).map(async (organisation) => {
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
    console.log("MAJ DREETS");
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
      Object.values(organisationsReseau).map(async (organisation) => {
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
    console.log("MAJ DEETS");
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
      Object.values(organisationsReseau).map(async (organisation) => {
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
    console.log("MAJ DRAAF");
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
      Object.values(organisationsReseau).map(async (organisation) => {
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
    console.log("MAJ CONSEIL_REGIONAL");
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
      Object.values(organisationsReseau).map(async (organisation) => {
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
    console.log("MAJ DDETS");
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
      Object.values(organisationsReseau).map(async (organisation) => {
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
    console.log("MAJ ACADEMIE");
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
      Object.values(organisationsReseau).map(async (organisation) => {
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
    console.log("MAJ Admins");
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

  console.log("MAJ organisation.created_at");
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
  console.log(`Utilisateurs non migrés: ${users.length}`);
};
