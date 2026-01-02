import { addJob } from "job-processor";

export const up = async () => {
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
};
