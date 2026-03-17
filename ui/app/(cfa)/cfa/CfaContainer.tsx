import { fr } from "@codegouvfr/react-dsfr";

export function CfaContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "auto",
        maxWidth: 1232,
        ...fr.spacing("padding", {
          topBottom: "10v",
        }),
      }}
    >
      {children}
    </div>
  );
}
