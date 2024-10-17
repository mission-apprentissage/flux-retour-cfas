export const buildAdresse = (adresse) => {
  const l1 = adresse.l1 && adresse.l1 !== "" ? `${adresse.l1}\r\n` : "";
  const l2 = adresse.l2 && adresse.l2 !== "" ? `${adresse.l2}\r\n` : "";
  const l3 = adresse.l3 && adresse.l3 !== "" ? `${adresse.l3}\r\n` : "";
  const l4 = adresse.l4 && adresse.l4 !== "" ? `${adresse.l4}\r\n` : "";
  const l5 = adresse.l5 && adresse.l5 !== "" ? `${adresse.l5}\r\n` : "";
  const l6 = adresse.l6 && adresse.l6 !== "" ? `${adresse.l6}\r\n` : "";
  const l7 = adresse.l7 && adresse.l7 !== "" ? `${adresse.l7}` : "";
  return `${l1}${l2}${l3}${l4}${l5}${l6}${l7}`;
};
