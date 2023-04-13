import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Home from "../pages/index";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", {
      name: /Hello World !/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
