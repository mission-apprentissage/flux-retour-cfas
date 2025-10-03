import { addJob } from "job-processor";

export const up = async () => {
    await addJob({
        name: "tmp:hydrate:formation-organisme-v2",
        queued: true,
    });
}
