import logger from "@/common/logger";
import { effectifV2Db, formationV2Db, missionLocaleEffectifs2Db, missionLocaleEffectifsDb, missionLocaleEffectifsLogDb, organisationsDb, personV2Db } from "@/common/model/collections";
import { normalisePersonIdentifiant, updateParcoursPersonV2 } from "@/jobs/ingestion/person/person.ingestion";
import { captureException } from "@sentry/node";
import { IEffectifV2 } from "shared/models";
import { getAnneeScolaireFromDate, getAnneesScolaireListFromDate } from "shared/utils";
import fs from "fs"
import { ObjectId } from "bson";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";

export const hydratePersonV2Parcours = async () => {

    const BULK_SIZE = 100;
    let bulkEffectifs: Array<IEffectifV2> = [];

    const processEffectif = async (eff: IEffectifV2) => {
        //console.log(`Mise à jour du parcours de la personne pour l'effectifV2 ${eff._id}`);
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

export const migrateMissionLocaleEffectifV2 = async () => {

    const BULK_SIZE = 1000;

    let bulkEffectifs: Array<any> = [];

    const processEffectif = async ({ _id }: any) => {

    };

    const cursor = missionLocaleEffectifsDb().aggregate([
        {
            $match: {
                person_id: { $exists: true }
            }
        },
        {
            $group: {
                _id: "$person_id",
            }
        }
    ])

    while (await cursor.hasNext()) {
        const personAggregate = await cursor.next();
        bulkEffectifs.push(personAggregate);
        if (bulkEffectifs.length > BULK_SIZE) {
            await Promise.allSettled(bulkEffectifs.map(processEffectif));
            bulkEffectifs = [];
        }

        if (bulkEffectifs.length > 0) {
            await Promise.allSettled(bulkEffectifs.map(processEffectif));
        }
    }
}


export const hydrateMissionLocaleEffectifWithPersonV2 = async () => {

    const BULK_SIZE = 1000;
    let bulkEffectifs: Array<any> = [];

    const processEffectif = async (missionLocaleEffectif: any) => {
        const identifiant = normalisePersonIdentifiant({
            nom: missionLocaleEffectif.effectif_snapshot.apprenant.nom,
            prenom: missionLocaleEffectif.effectif_snapshot.apprenant.prenom,
            date_de_naissance: missionLocaleEffectif.effectif_snapshot.apprenant.date_de_naissance,
        })

        const person = await personV2Db().findOne({
            "identifiant.nom": identifiant.nom,
            "identifiant.prenom": identifiant.prenom,
            "identifiant.date_de_naissance": identifiant.date_de_naissance,
        });



        const effectifv2 = await effectifV2Db().findOne({
            "identifiant.person_id": person?._id,
        });

        if (person) {
            await missionLocaleEffectifsDb().updateOne({ _id: missionLocaleEffectif._id }, { $set: { person_id: person._id } });
        }
    };

    try {
        const cursor = missionLocaleEffectifsDb().find({ "person_id": { $exists: false } })

        while (await cursor.hasNext()) {
            const missionLocaleEffectif = await cursor.next();
            if (missionLocaleEffectif && missionLocaleEffectif.effectif_snapshot.apprenant.date_de_naissance) {
                bulkEffectifs.push(missionLocaleEffectif);
            }

            if (bulkEffectifs.length > BULK_SIZE) {
                // console.log(`Traitement de ${bulkEffectifs.length} documents...`, Date.now());
                await Promise.allSettled(bulkEffectifs.map(processEffectif));
                //console.log(`Traitement de ${bulkEffectifs.length} documents terminé.`, Date.now());
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

export const deduplicateMissionLocaleEffectif = async () => {



    const BULK_SIZE = 1000;
    let bulkEffectifs: Array<any> = [];

    let noMatch: Array<any> = [];
    let multipleMatch: Array<any> = [];
    let singleMatch: Array<any> = [];
    let error: Array<any> = [];
    let notFoundPerson = 0;

    const processEffectif = async (doc: any) => {
        let mleff: Array<any> = [];
        let effectifv2: any = null;
        try {

            mleff = await missionLocaleEffectifsDb().aggregate([
                {
                    $match: { person_id: doc._id }
                },
                {
                    $lookup: {
                        from: "effectifs",
                        localField: "effectif_id",
                        foreignField: "_id",
                        as: "curr_eff"
                    }
                },
                {
                    $unwind: "$curr_eff"
                }
            ]).toArray();

            const person = await personV2Db().findOne({ _id: doc._id });

            if (!person || !person?.parcours?.en_cours) {
                notFoundPerson++;
                console.log("Personne sans effectifV2 ou parcours vide");
                return;
            }

            effectifv2 = await effectifV2Db().findOne({ _id: person.parcours.en_cours?.id });

            if (!effectifv2) {
                notFoundPerson++;
                console.log("Personne sans effectifV2");
                return;
            }

            const mapped = mleff.map((eff) => {

                const dateContratDebut = new Date(eff.curr_eff.contrats[eff.curr_eff.contrats.length - 1].date_debut);
                const dateContratFin = new Date(eff.curr_eff.contrats[eff.curr_eff.contrats.length - 1].date_fin);
                const dateContratRupture = eff.curr_eff.contrats[eff.curr_eff.contrats.length - 1].date_rupture ? new Date(eff.curr_eff.contrats[eff.curr_eff.contrats.length - 1].date_rupture) : null;

                const contratV2Exists = !!(effectifv2.contrats && effectifv2.contrats[dateContratDebut.toISOString().split('T')[0]]);
                const contratV2 = effectifv2.contrats[dateContratDebut.toISOString().split('T')[0]]

                const v3 = !!(eff.curr_eff.contrats.length && eff.curr_eff.contrats.length)
                const v4 = contratV2Exists
                const v5 = contratV2Exists && contratV2.date_debut.toISOString() === dateContratDebut.toISOString()
                const v6 = contratV2Exists && contratV2.date_fin?.toISOString() === (dateContratFin ? dateContratFin.toISOString() : null)
                const v7 = contratV2Exists && (contratV2.rupture?.date_rupture ? contratV2.rupture?.date_rupture?.toISOString() : null) === (dateContratRupture ? dateContratRupture.toISOString() : null)

                return {
                    ...eff,
                    checks: { v3, v4, v5, v6, v7 }
                }
            })

            const matchingEffectifs = mapped.filter((eff: any) => {
                return (
                    eff.checks.v3 &&
                    eff.checks.v4 &&
                    eff.checks.v5 &&
                    eff.checks.v6 &&
                    eff.checks.v7
                );
            })

            if (matchingEffectifs.length === 0) {
                noMatch.push({ me: mapped.map(({ curr_eff, checks }) => ({ checks, c: curr_eff.contrats, formation: { debut: curr_eff.formation.date_entree, fin: curr_eff.formation.date_fin } })), effv2: { c: effectifv2.contrats, formation: { debut: effectifv2.session.debut, fin: effectifv2.session.fin } } });
                return;
            }

            if (matchingEffectifs.length === 1) {
                singleMatch.push({ person_id: person._id, me: mapped.map(({ curr_eff, checks, _id }) => ({ checks, _id, c: curr_eff.contrats, formation: { debut: curr_eff.formation.date_entree, fin: curr_eff.formation.date_fin } })), effv2: { c: effectifv2.contrats, formation: { debut: effectifv2.session.debut, fin: effectifv2.session.fin } } });
                return
            }

            if (matchingEffectifs.length > 1) {

                matchingEffectifs.sort((a: any, b: any) => {
                    const aMax = parseInt(a.curr_eff.annee_scolaire.split('')[1]);
                    const bMax = parseInt(b.curr_eff.annee_scolaire.split('')[1]);
                    return bMax - aMax;
                });
                const toKeep = matchingEffectifs[0];

                singleMatch.push({ person_id: person._id, me: [toKeep].map(({ curr_eff, checks, _id }) => ({ checks, _id, c: curr_eff.contrats, formation: { debut: curr_eff.formation.date_entree, fin: curr_eff.formation.date_fin } })), effv2: { c: effectifv2.contrats, formation: { debut: effectifv2.session.debut, fin: effectifv2.session.fin } } });
                return
            }
        } catch (err) {

            logger.error(`Échec de la mise à jour des effectifs: ${err}`);
            error.push({ me: mleff, effv2: effectifv2 });
            //captureException(err);
        }

    };

    try {
        const aggregation = [
            {
                $group: {
                    _id: "$person_id",
                    count: { $sum: 1 },
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]

        const cursor = missionLocaleEffectifsDb().aggregate(aggregation);

        while (await cursor.hasNext()) {
            const mlEffGrouped = await cursor.next();
            if (mlEffGrouped) {
                bulkEffectifs.push(mlEffGrouped);
            } else {
                notFoundPerson++;
            }

            if (bulkEffectifs.length > BULK_SIZE) {
                await Promise.allSettled(bulkEffectifs.map(processEffectif));
                bulkEffectifs = [];
            }
        }

        if (bulkEffectifs.length > 0) {
            await Promise.allSettled(bulkEffectifs.map(processEffectif));
        }

        singleMatch.forEach(async ({ person_id, _id }) => {
            await missionLocaleEffectifsDb().updateMany({ person_id: new ObjectId(person_id), _id: { $nin: [new ObjectId(_id)] } }, { $set: { soft_deleted: true } })
        })

        console.log(`Parcours terminé, ${error.length} erreurs, ${noMatch.length} personnes sans correspondance, ${singleMatch.length} avec une seule correspondance, ${multipleMatch.length} avec plusieurs correspondances, ${notFoundPerson} personnes sans effectifV2 ou parcours vide.`);

        fs.writeFileSync('noMatch.json', JSON.stringify(noMatch, null, 2));
        fs.writeFileSync('singleMatch.json', JSON.stringify(singleMatch, null, 2));
        fs.writeFileSync('multipleMatch.json', JSON.stringify(multipleMatch, null, 2));
        fs.writeFileSync('error.json', JSON.stringify(error, null, 2));
    } catch (err) {
        logger.error(`Échec de la mise à jour des effectifs: ${err}`);
        captureException(err);
    }

}

export const hydrateMissionLocaleEffectifWithEffectifV2 = async () => {

    const BULK_SIZE = 1000;
    let bulkEffectifs: Array<any> = [];

    const processEffectif = async ({ _id, ids }: any) => {
        const person = await personV2Db().findOne({ _id: new ObjectId(_id) })
        const effv2Id = person?.parcours?.en_cours?.id;

        if (!effv2Id) {
            return
        }

        const effectifv2 = await effectifV2Db().findOne({ _id: new ObjectId(effv2Id) });

        if (!effectifv2 || !effectifv2.adresse?.mission_locale_id) {
            return
        }

        const formationv2 = await formationV2Db().findOne({ _id: effectifv2.identifiant.formation_id });

        const currentStatus =
            effectifv2._computed?.statut?.parcours.filter((statut) => statut.date <= new Date()).slice(-1)[0] ||
            effectifv2._computed?.statut?.parcours.slice(-1)[0];

        // if (currentStatus.valeur === "RUPTURANT") {
        //     return;
        // }

        const mlOrga = await organisationsDb().findOne({ type: "MISSION_LOCALE", ml_id: effectifv2.adresse.mission_locale_id });

        if (!mlOrga) {
            console.log(`Aucune mission locale trouvée pour l'effectifV2 ${effv2Id} avec la mission locale ID ${effectifv2.adresse.mission_locale_id}`);
            return;
        }
        try {
            console.log(`====Insertion de l'effectifV2 ${effv2Id} pour la personne ${_id} et la mission locale ${mlOrga._id}`);
            const data = await missionLocaleEffectifs2Db().insertOne({
                _id: new ObjectId(),
                effectifV2_id: new ObjectId(effv2Id),
                created_at: new Date(),
                mission_locale_id: mlOrga?._id,
                date_rupture: currentStatus.date,
                computed: {
                    effectif: effectifv2,
                    person: person,
                    formation: formationv2
                }
            });

            await missionLocaleEffectifsLogDb().updateOne(
                {
                    mission_locale_effectif_id: { $in: ids.map(({ mission_locale_effectif_id }) => mission_locale_effectif_id) }
                },
                {
                    $set: { mission_locale_effectif_2_id: data.insertedId }
                }
            );

            const d = ids.reduce((acc, { mission_locale_effectif_id, organisme_data }) => {
                if (organisme_data) {
                    console.log(organisme_data)
                    console.log({
                        _id: new ObjectId(),
                        type: "ORGANISME_FORMATION",
                        mission_locale_effectif_id,
                        mission_locale_effectif_2_id: data.insertedId,
                        ...organisme_data
                    })
                }

                const { reponse_at, ...rest } = organisme_data || {};


                return organisme_data ? [...acc, {
                    _id: new ObjectId(),
                    type: "ORGANISME_FORMATION",
                    mission_locale_effectif_id,
                    mission_locale_effectif_2_id: data.insertedId,
                    created_at: reponse_at,
                    ...rest
                }] : acc;
            }, []);

            d.length && await missionLocaleEffectifsLogDb().insertMany(d)

        } catch (err) {
            console.log(JSON.stringify(err, null, 2))
            console.log(`Erreur lors de l'insertion de l'effectifV2 ${effv2Id} pour la personne ${_id}: ${err}`);
        }

    }

    const cursor = missionLocaleEffectifsDb().aggregate([
        {
            $match: {
                person_id: { $exists: true },
            }
        },
        {
            $group: {
                _id: "$person_id",
                count: { $sum: 1 },
                ids: { $push: { mission_locale_effectif_id: "$_id", organisme_data: "$organisme_data" } }
            }
        }
    ])


    while (await cursor.hasNext()) {
        const personAggregate = await cursor.next();
        // console.log(`Traitement de la personne ${personAggregate._id} avec ${personAggregate.count} effectifs...`);
        bulkEffectifs.push(personAggregate);
        if (bulkEffectifs.length > BULK_SIZE) {
            await Promise.allSettled(bulkEffectifs.map(processEffectif));
            bulkEffectifs = [];
        }
    }

    if (bulkEffectifs.length > 0) {
        await Promise.allSettled(bulkEffectifs.map(processEffectif));
    }

}

export const hydrateOrganismeFormationV2 = async () => {

    const cursor = formationV2Db().find({});
    let data: Array<any> = []

    while (await cursor.hasNext()) {
        const formation = await cursor.next();
        if (!formation || !formation?.identifiant) continue;

        let organismeFormateur;
        let organismeResponsable;

        if (formation.identifiant.formateur_siret && formation.identifiant.formateur_uai) {
            organismeFormateur = await getOrganismeByUAIAndSIRET(
                formation?.identifiant.formateur_uai,
                formation?.identifiant.formateur_siret
            )
        }

        if (formation.identifiant.responsable_siret && formation.identifiant.responsable_uai) {
            organismeResponsable = await getOrganismeByUAIAndSIRET(
                formation?.identifiant.responsable_siret,
                formation?.identifiant.responsable_uai
            )
        }

        if (formation) {
            data.push({
                updateOne: {
                    filter: { _id: formation._id },
                    update: {
                        $set: {
                            organisme_formateur_id: organismeFormateur?._id,
                            organisme_responsable_id: organismeResponsable?._id,
                        }
                    }
                }
            })
        }

        if (data.length >= 500) {
            await formationV2Db().bulkWrite(data);
            data = [];
        }
    }

    if (data.length > 0) {
        await formationV2Db().bulkWrite(data);
    }
}

export const updateMLLogWithType = async () => {
    await missionLocaleEffectifsLogDb().updateMany({},
        {
            $set: { type: "MISSION_LOCALE" }
        }
    )
}
