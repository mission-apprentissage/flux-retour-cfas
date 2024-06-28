import { cyrb53Hash, normalize } from "shared";

export function toEffectifsQueue(data: any[]) {
  return data.map((e) => ({
    ...e,
    // Generate a unique id for each row, based on the apprenant's name and birthdate.
    // Source: https://mission-apprentissage.slack.com/archives/C02FR2L1VB8/p1693294663898159?thread_ts=1693292246.217809&cid=C02FR2L1VB8
    id_erp_apprenant: cyrb53Hash(
      normalize(e.prenom_apprenant || "").trim() +
        normalize(e.nom_apprenant || "").trim() +
        (e.date_de_naissance_apprenant || "").trim()
    ),
  }));
}
