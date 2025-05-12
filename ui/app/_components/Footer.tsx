import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

export function Footer() {
  return (
    <DsfrFooter
      accessibility="non compliant"
      contentDescription={
        <>
          Mandatée par plusieurs ministères, la{" "}
          <a
            href="https://beta.gouv.fr/startups/?incubateur=mission-apprentissage"
            target="_blank"
            rel="noopener noreferrer"
            className="fr-link fr-text--sm"
            style={{ color: "var(--text-action-grey)" }}
          >
            Mission interministérielle pour l’apprentissage
          </a>{" "}
          développe plusieurs services destinés à faciliter les entrées en apprentissage.
        </>
      }
      operatorLogo={{
        alt: "France relance",
        imgUrl: "/images/france_relance.svg",
        orientation: "vertical",
      }}
    />
  );
}
