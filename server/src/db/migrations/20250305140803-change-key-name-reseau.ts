import { addJob } from "job-processor";

import { organismesDb, reseauxDb } from "@/common/model/collections";

export const up = async () => {
  // Récupération de tous les reseaux des organismes, et vérification si c'est le nom ou le key qui est dans la liste
  // Puis mise à jour en conséquence

  const allReseaux = await reseauxDb().find().toArray();

  const reseauxMap = allReseaux.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.nom]: curr.key,
    };
  }, {});

  const cursor = organismesDb().find({ reseaux: { $exists: true, $not: { $size: 0 } } });
  while (await cursor.hasNext()) {
    const org = await cursor.next();
    if (org) {
      // Remplacer le nom par la key si existe, sinon on garde la valeur dans la liste
      const newReseaux = org?.reseaux?.map((n) => reseauxMap[n] ?? n);
      await organismesDb().updateOne({ _id: org._id }, { $set: { reseaux: newReseaux } });
    }
  }
  // Mise a jour des computed des organismes
  await addJob({ name: "computed:update", queued: true });
};
