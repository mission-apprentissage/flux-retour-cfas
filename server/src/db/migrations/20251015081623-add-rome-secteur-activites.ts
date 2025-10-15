import { addJob } from "job-processor";

export const up = async () => {
    addJob({
        name: "tmp:hydrate:rome-secteur-activites",
        queued: true,
    });
};
