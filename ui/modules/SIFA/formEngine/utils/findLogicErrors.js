export const findLogicErrors = async ({ name, logics, values, dossier, fields }) => {
  for (let logic of logics) {
    try {
      const { error } = (await logic.process({ fields, values, dossier, name, cache: logic.cache })) ?? {};
      if (error) return error;
    } catch (e) {
      if (e.name !== "AbortError") throw e;
    }
  }
};
