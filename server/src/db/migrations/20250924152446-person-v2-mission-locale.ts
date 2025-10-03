import { addJob } from "job-processor";

export const up = async () => {

    await addJob({
        name: "tmp:migrate:update-ml-log-with-type",
        queued: true,
    });


};
