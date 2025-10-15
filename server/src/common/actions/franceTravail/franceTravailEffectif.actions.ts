import { franceTravailEffectifsDb, organisationsDb } from "@/common/model/collections";
import { IEffectif } from "shared/models"
import { getRomeByRncp } from "../rome/rome.actions";
import logger from "@/common/logger";


export const createFranceTravailEffectif = () => {

}

export const getFranceTravailOrganisationByCodeRegion = async (codeRegion: string) => {
    const orga = await organisationsDb().findOne({ type: "FRANCE_TRAVAIL", code_region: codeRegion });
    return orga;
}

export const createFranceTravailEffectifSnapshot = async (effectif: IEffectif) => {
    const currentStatus =
        effectif._computed?.statut?.parcours.filter((statut) => statut.date <= new Date()).slice(-1)[0] ||
        effectif._computed?.statut?.parcours.slice(-1)[0];
    const effectifCodeRegion = effectif?.apprenant?.adresse?.region;

    if (!effectifCodeRegion) {
        return;
    }

    const inscritFilter = currentStatus?.valeur === "INSCRIT";
    const romes = await getRomeByRncp(effectif.formation?.rncp);
    const ftData = romes.reduce((acc, curr) => ({ ...acc, [curr]: null }), {});
    try {
        await franceTravailEffectifsDb().findOneAndUpdate(
            {
                _id: effectif._id
            },
            {
                $set: {
                    current_status: {
                        value: currentStatus?.valeur || null,
                        date: currentStatus?.date || null,
                    }
                },
                $setOnInsert: {
                    created_at: new Date(),
                    effectif_id: effectif._id,
                    effectif_snapshot: effectif,
                    effectif_snapshot_date: new Date(),
                    code_region: effectif?.apprenant?.adresse?.region,
                    ft_data: ftData
                }
            },
            { upsert: !!inscritFilter }
        )
    } catch (e) {
        logger.error(e)
        console.error("Error while creating France Travail effectif snapshot", e);
    }


}
