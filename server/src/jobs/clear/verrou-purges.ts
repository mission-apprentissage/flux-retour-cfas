import { getDbCollection } from "@/common/mongodb";

const PURGES_CONSERVATION = [
  "purge:effectifs-anciens",
  "purge:ml-dossiers-masques",
  "purge:dossiers-suivi",
  "purge:voeux-affelnet",
];

export const refuserPurgesConcurrentes = async (nom: string) => {
  const enCours = await getDbCollection("job_processor.jobs").countDocuments({
    type: "simple",
    name: { $in: PURGES_CONSERVATION },
    status: "running",
  });
  if (enCours > 1) {
    throw new Error(`${nom} refusé : une autre purge de conservation est en cours`);
  }
};
