import { formatPhoneNumber } from "@/app/_utils/phone.utils";

interface EffectifCoordonneesProps {
  telephone?: string;
  courriel?: string;
  rqth?: boolean;
  referentHandicap?: { nom: string; email: string; prenom: string };
  coordTitleClassName?: string;
  infoParaClassName?: string;
}

export function EffectifCoordonnees({
  telephone,
  courriel,
  rqth,
  referentHandicap,
  coordTitleClassName = "",
  infoParaClassName = "",
}: EffectifCoordonneesProps) {
  return (
    <>
      <p className={coordTitleClassName}>Coordonnées élève</p>
      <p className={infoParaClassName}>{formatPhoneNumber(telephone) || "-"}</p>
      <p className={infoParaClassName}>{courriel || "-"}</p>
      {referentHandicap && rqth && (
        <>
          <p className={coordTitleClassName}>Responsable RQTH</p>
          <p className={infoParaClassName}>
            <span>{referentHandicap.prenom}</span> <span>{referentHandicap.nom}</span>
          </p>
          <p className={infoParaClassName}>{referentHandicap.email || "-"}</p>
        </>
      )}
    </>
  );
}
