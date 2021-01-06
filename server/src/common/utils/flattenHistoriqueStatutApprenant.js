const flattenHistoriqueStatutApprenant = (historique = []) => {
  let bufferValue = null;
  const flattened = [];

  historique.forEach((historiqueElem) => {
    if (historiqueElem.valeur_statut !== bufferValue) {
      flattened.push(historiqueElem);
      bufferValue = historiqueElem.valeur_statut;
    }
  });

  return flattened;
};

module.exports = {
  flattenHistoriqueStatutApprenant,
};
