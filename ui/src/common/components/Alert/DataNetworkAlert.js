import React from "react";

import { Alert, Section } from "../index";

const DataNetworkAlert = (props) => (
  <Section {...props}>
    <Alert>
      Les données sont en cours de correction. <br />
      Nous vous remercions de votre compréhension
    </Alert>
  </Section>
);

export default DataNetworkAlert;
