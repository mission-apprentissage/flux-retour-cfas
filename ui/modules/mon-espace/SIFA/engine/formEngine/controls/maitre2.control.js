export const Maitre2Control = {
  deps: ["maitre2.prenom", "maitre2.nom", "maitre2.dateNaissance"],
  target: "dd",
  blocCompletion: "maitre",
  process: ({ values }) => {
    if (!values.maitre2.prenom && !values.maitre2.nom && !values.maitre2.dateNaissance) return;

    if (!values.maitre2.prenom || !values.maitre2.nom || !values.maitre2.dateNaissance) {
      return { error: "Le maitre est incomplet" };
    }
  },
};
