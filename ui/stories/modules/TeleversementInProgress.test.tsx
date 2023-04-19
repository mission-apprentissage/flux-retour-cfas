import { composeStories } from "@storybook/react";
import { screen } from "@testing-library/react";

import { act, render, waitFor } from "@testing-library/react";

import * as stories from "./TeleversementInProgress.stories";

const { Simple, AvecProgression, AvecProgressionEtMessageCustom } = composeStories(stories);
describe("TeleversementInProgress", () => {
  test("renders Simple", () => {
    render(<Simple />);
    expect(screen.getByText("Traitement en cours...")).toBeTruthy();
  });

  test("Renders Simple avec progression", () => {
    render(<AvecProgression />);
    expect(screen.getByText("Import en cours: 1 sur 100 effectifs")).toBeTruthy();
  });

  test("Renders Simple avec progression", () => {
    render(<AvecProgressionEtMessageCustom />);
    expect(screen.getByText("Import en cours: 1 sur 100 effectifs")).toBeTruthy();
    expect(screen.getByText("Veuillez patienter pendant l’importation de votre fichier.")).toBeTruthy();
  });
});
