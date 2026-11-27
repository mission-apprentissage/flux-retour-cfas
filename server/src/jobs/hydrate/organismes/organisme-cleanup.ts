import { ObjectId } from "mongodb";
import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants";

import {
  effectifsDb,
  effectifsDECADb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";

const CRITERES_SUPPRESSION = {
  est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
  api_key: null,
};

const TAILLE_LOT = 1000;

const evaluerOrganisme = async (organismeId: ObjectId, effectifsRetires = 0, flechesRetires = 0) => {
  const organisation = await organisationsDb().findOne({
    type: "ORGANISME_FORMATION",
    organisme_id: organismeId.toString(),
  });

  const [userCount, effectifCount, decaCount, decaFlecheCount] = await Promise.all([
    organisation === null ? 0 : usersMigrationDb().countDocuments({ organisation_id: organisation._id }),
    effectifsDb().countDocuments({ organisme_id: organismeId }),
    effectifsDECADb().countDocuments({ organisme_id: organismeId }),
    effectifsDECADb().countDocuments(
      { organisme_responsable_id: organismeId, fleche: { $exists: true } },
      { limit: flechesRetires + 1 }
    ),
  ]);

  return {
    organisation,
    supprimable: userCount === 0 && effectifCount + decaCount <= effectifsRetires && decaFlecheCount <= flechesRetires,
  };
};

export async function cleanupOrganismes() {
  const cursor = organismesDb().find({ effectifs_count: 0, ...CRITERES_SUPPRESSION });

  for await (const organisme of cursor) {
    const { organisation, supprimable } = await evaluerOrganisme(organisme._id);

    if (supprimable) {
      if (organisation !== null) {
        await organisationsDb().deleteOne({ _id: organisation._id });
      }
      await organismesDb().deleteOne({ _id: organisme._id });
    }
  }
}

export async function compterOrganismesSupprimables(
  effectifsRetiresParOrganisme: Map<string, number>,
  flechesRetiresParResponsable: Map<string, number> = new Map()
): Promise<number> {
  const ids = [...new Set([...effectifsRetiresParOrganisme.keys(), ...flechesRetiresParResponsable.keys()])].map(
    (id) => new ObjectId(id)
  );
  let supprimables = 0;

  for (let debut = 0; debut < ids.length; debut += TAILLE_LOT) {
    const organismes = await organismesDb()
      .find({ _id: { $in: ids.slice(debut, debut + TAILLE_LOT) }, ...CRITERES_SUPPRESSION }, { projection: { _id: 1 } })
      .toArray();
    for (const { _id } of organismes) {
      const { supprimable } = await evaluerOrganisme(
        _id,
        effectifsRetiresParOrganisme.get(_id.toString()) ?? 0,
        flechesRetiresParResponsable.get(_id.toString()) ?? 0
      );
      if (supprimable) supprimables++;
    }
  }

  return supprimables;
}
