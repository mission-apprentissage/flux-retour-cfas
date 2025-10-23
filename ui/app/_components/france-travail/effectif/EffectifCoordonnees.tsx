import { formatPhoneNumber } from "@/app/_utils/phone.utils";

interface EffectifCoordonneesProps {
  telephone?: string;
  courriel?: string;
  responsableMail?: string;
  coordTitleClassName?: string;
  infoParaClassName?: string;
}

export function EffectifCoordonnees({
  telephone,
  courriel,
  responsableMail,
  coordTitleClassName = "",
  infoParaClassName = "",
}: EffectifCoordonneesProps) {
  return (
    <>
      <p className={coordTitleClassName}>Coordonnées</p>
      <p className={infoParaClassName}>
        <span>{formatPhoneNumber(telephone) || "-"}</span> <span>{courriel || "-"}</span>
      </p>
      {responsableMail && (
        <>
          <p className={coordTitleClassName}>Responsable légal</p>
          <p className={infoParaClassName}>
            <span>{responsableMail}</span>
          </p>
        </>
      )}
    </>
  );
}
