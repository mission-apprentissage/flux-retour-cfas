import { EffectifData } from "@/common/types/ruptures";

type CommuneCellProps = Pick<EffectifData, "commune" | "code_postal">;

export function CommuneCell({ commune, code_postal }: CommuneCellProps) {
  if (!commune && !code_postal) {
    return <span style={{ color: "var(--text-mention-grey)" }}>—</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {commune && <span>{commune}</span>}
      {code_postal && (
        <span className="fr-text--sm" style={{ color: "var(--text-mention-grey)" }}>
          {code_postal}
        </span>
      )}
    </div>
  );
}
