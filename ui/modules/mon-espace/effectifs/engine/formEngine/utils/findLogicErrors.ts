export const findLogicErrors = async ({
  name,
  logics,
  values,
  dossier,
  fields,
}: {
  name: string;
  logics: any;
  values: any;
  dossier: any;
  fields: any;
}) => {
  for (const logic of logics) {
    try {
      const { error } = (await logic.process({ fields, values, dossier, name, cache: logic.cache })) ?? {};
      if (error) return error;
    } catch (e) {
      if (e.name !== "AbortError") throw e;
    }
  }
};
