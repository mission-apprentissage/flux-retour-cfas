import logger from "@/common/logger";
import { effectifV2Db, missionLocaleEffectifsDb, personV2Db } from "@/common/model/collections";
import { normalisePersonIdentifiant, updateParcoursPersonV2 } from "@/jobs/ingestion/person/person.ingestion";
import { captureException } from "@sentry/node";
import { IEffectifV2 } from "shared/models";

export const hydratePersonV2Parcours = async () => {

    const BULK_SIZE = 100;
    let bulkEffectifs: Array<IEffectifV2> = [];

    const processEffectif = async (eff: IEffectifV2) => {
        console.log(`Mise à jour du parcours de la personne pour l'effectifV2 ${eff._id}`);
        if (eff) {
            await updateParcoursPersonV2(eff.identifiant.person_id, eff);
        }
    };

    try {
        const cursor = effectifV2Db().find();

        while (await cursor.hasNext()) {
            const effectif: IEffectifV2 | null = await cursor.next();
            if (effectif) {
                bulkEffectifs.push(effectif);
            }

            if (bulkEffectifs.length > BULK_SIZE) {
                await Promise.allSettled(bulkEffectifs.map(processEffectif));
                bulkEffectifs = [];
            }
        }

        if (bulkEffectifs.length > 0) {
            await Promise.allSettled(bulkEffectifs.map(processEffectif));
        }

    } catch (err) {
        logger.error(`Échec de la mise à jour des effectifs: ${err}`);
        captureException(err);
    }
}

export const hydrateMissionLocaleEffectifWithPersonV2 = async () => {
    const cursor = missionLocaleEffectifsDb().find({ "person_id": { $exists: false } })

    while (await cursor.hasNext()) {
        const missionLocaleEffectif = await cursor.next();

        if (!missionLocaleEffectif || !missionLocaleEffectif.effectif_snapshot.apprenant.date_de_naissance) continue;

        const identifiant = normalisePersonIdentifiant({
            nom: missionLocaleEffectif.effectif_snapshot.apprenant.nom,
            prenom: missionLocaleEffectif.effectif_snapshot.apprenant.prenom,
            date_de_naissance: missionLocaleEffectif.effectif_snapshot.apprenant.date_de_naissance,
        })

        const person = await personV2Db().findOne({ identifiant });

        if (person) {
            await missionLocaleEffectifsDb().updateOne({ _id: missionLocaleEffectif._id }, { $set: { person_id: person._id } });
        }
    }
}
