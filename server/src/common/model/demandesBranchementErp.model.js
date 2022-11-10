const { object, string, date, boolean, objectId } = require("./json-schema/jsonSchemaTypes");

const collectionName = "demandesBranchementErp";

const schema = object(
  {
    _id: objectId(),
    erp: string({ description: "Nom de l'ERP" }),
    nom_organisme: string({ description: "Nom de l'organisme faisant la demande" }),
    uai_organisme: string({ description: "UAI de l'organisme faisant la demande" }),
    email_demandeur: string({ description: "Adresse email de la personne faisant la demande" }),
    nb_apprentis: string({ description: "Nombre d'apprentis sur la dernière année" }),
    is_ready_co_construction: boolean({
      description: "Indique si l'établissement souhaite participer à la construction du nouvel ERP",
    }),
    created_at: date({ description: "Date à laquelle la demande a été effectuée" }),
  },
  { required: ["erp", "nom_organisme", "uai_organisme", "email_demandeur", "created_at"] }
);

module.exports = {
  collectionName,
  schema,
};
