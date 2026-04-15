import shared from "./CollaborationDetail.shared.module.css";

export function ReferentCoordonnees({ value }: { value: string }) {
  return (
    <div>
      {value
        .split("\n")
        .filter(Boolean)
        .map((line, index) => (
          <p key={index} className={shared.sentBody}>
            {line}
          </p>
        ))}
    </div>
  );
}
