import type { AnyBulkWriteOperation } from "mongodb";
import type { IEffectifArchive } from "shared/models/data/effectifsArchive.model";

import logger from "@/common/logger";
import { effectifsArchiveDb } from "@/common/model/collections";

const ACADEMIE_SUR_UN_CHIFFRE = /^[0-9]$/;
const DERNIERES_SITUATIONS_RETIREES = [1013, 1015];
const TAILLE_LOT = 500;

export const up = async () => {
  const archives = effectifsArchiveDb();
  const compteurs = { academiesApprenant: 0, academiesOrganisme: 0, dernieresSituations: 0 };
  const idsDernieresSituations: string[] = [];
  let lot: AnyBulkWriteOperation<IEffectifArchive>[] = [];
  let modifies = 0;

  const vider = async () => {
    if (!lot.length) return;
    const { modifiedCount } = await archives.bulkWrite(lot);
    modifies += modifiedCount;
    lot = [];
  };

  const cursor = archives.find(
    {
      $or: [
        { "apprenant.adresse.academie": ACADEMIE_SUR_UN_CHIFFRE },
        { "_computed.organisme.academie": ACADEMIE_SUR_UN_CHIFFRE },
        { "apprenant.derniere_situation": { $in: DERNIERES_SITUATIONS_RETIREES } },
      ],
    },
    {
      projection: {
        "apprenant.adresse.academie": 1,
        "_computed.organisme.academie": 1,
        "apprenant.derniere_situation": 1,
      },
    }
  );

  for await (const archive of cursor) {
    const modifications: Record<string, string | null> = {};

    const academieApprenant = archive.apprenant?.adresse?.academie;
    if (typeof academieApprenant === "string" && ACADEMIE_SUR_UN_CHIFFRE.test(academieApprenant)) {
      modifications["apprenant.adresse.academie"] = academieApprenant.padStart(2, "0");
      compteurs.academiesApprenant++;
    }

    const academieOrganisme = archive._computed?.organisme?.academie;
    if (typeof academieOrganisme === "string" && ACADEMIE_SUR_UN_CHIFFRE.test(academieOrganisme)) {
      modifications["_computed.organisme.academie"] = academieOrganisme.padStart(2, "0");
      compteurs.academiesOrganisme++;
    }

    const derniereSituation = archive.apprenant?.derniere_situation;
    if (typeof derniereSituation === "number" && DERNIERES_SITUATIONS_RETIREES.includes(derniereSituation)) {
      modifications["apprenant.derniere_situation"] = null;
      compteurs.dernieresSituations++;
      idsDernieresSituations.push(archive._id.toString());
    }

    if (!Object.keys(modifications).length) continue;

    // Un seul $set par document : la validation stricte porte sur le document entier
    lot.push({ updateOne: { filter: { _id: archive._id }, update: { $set: modifications } } });
    if (lot.length >= TAILLE_LOT) await vider();
  }
  await vider();

  logger.info({ ...compteurs, modifies, idsDernieresSituations }, "[Migration] Archives d'effectifs normalisées");
};
