import axios from "axios";
import { createOrganisme } from "../../common/actions/organismes.actions.js";
import { createUser } from "../../common/actions/users.actions.js";
import { userAfterCreate } from "../../common/actions/users.afterCreate.actions.js";
import logger from "../../common/logger.js";
import { runScript } from "../scriptWrapper.js";

runScript(async () => {
  //   await createOrganisme({
  //     uai: "0142321X",
  //     sirets: ["44492238900010"],
  //     adresse: {
  //       departement: "14",
  //       region: "28",
  //       academie: "70",
  //     },
  //     reseaux: ["CCI"],
  //     erps: ["YMAG"],
  //     nature: "responsable_formateur",
  //     nom: "ADEN Formations (Caen)",
  //   });

  //   // Create user support
  //   const userOf = await createUser(
  //     { email: "of2@test.fr", password: "Secret!Password1" },
  //     {
  //       nom: "of",
  //       prenom: "test",
  //       description: "Aden formation Caen - direction",
  //       roles: ["of"],
  //       account_status: "CONFIRMED",
  //       siret: "44492238900010",
  //       uai: "0142321X",
  //       organisation: "ORGANISME_FORMATION",
  //     }
  //   );
  //   await userAfterCreate({ user: userOf, pending: false, notify: false });

  const response = await axios.post("/api/v1/auth/login", {
    email: "of2@test.fr",
    password: "Secret!Password1",
  });

  const cookie = response.headers["set-cookie"].join(";");

  // Get effectifs
  const response2 = await axios.get("/api/effectifs", {
    params: { date: "2022-10-10T00:00:00.000Z", organisme_id: "639c342dc9a489f859eb036d" },
    headers: { cookie },
  });

  logger.info(response2);
}, "test");
