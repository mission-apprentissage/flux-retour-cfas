import { addJob } from "job-processor";

export const up = async () => {
  // mongodump  --uri="mongodb://localhost:27017" --db=tdb-preprod-save --archive | mongorestore --archive --nsInclude="tdb-preprod-save.*" --nsFrom="tdb-preprod-save.*" --nsTo="tdb-preprod.*" --uri="mongodb://localhost:27017" --drop

  await addJob({
    name: "import:formation",
  });
  await addJob({
    name: "tmp:hydrate:person-effectif-v2",
  });
  await addJob({
    name: "tmp:hydrate:formation-organisme-v2",
  });
  await addJob({
    name: "tmp:hydrate:person-ml-effectif-v2",
  });
  await addJob({
    name: "tmp:hydrate:update-effectif-v2",
  });
  await addJob({
    name: "tmp:migrate:update-ml-log-with-type",
  });
  await addJob({
    name: "tmp:hydrate:ml-v2",
  });
  await addJob({
    name: "tmp:migration:set-ml-data-from-log",
  });

  // Puis relance les stats de ML
};
