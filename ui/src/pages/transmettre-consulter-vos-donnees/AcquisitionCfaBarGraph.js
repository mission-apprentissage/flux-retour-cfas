import { ResponsiveBar } from "@nivo/bar";
import React from "react";

const data = [
  { month: "nov 2020", "Nombre d'organismes": 349 },
  { month: "dec 2020", "Nombre d'organismes": 746 },
  { month: "jan 2021", "Nombre d'organismes": 947 },
  { month: "fev 2021", "Nombre d'organismes": 1010 },
  { month: "mars 2021", "Nombre d'organismes": 1058 },
  { month: "avr 2021", "Nombre d'organismes": 1090 },
  { month: "mai 2021", "Nombre d'organismes": 1149 },
  { month: "juin 2021", "Nombre d'organismes": 1216 },
  { month: "juil 2021", "Nombre d'organismes": 1352 },
  { month: "aout 2021", "Nombre d'organismes": 1431 },
  { month: "sept 2021", "Nombre d'organismes": 1537 },
  { month: "oct 2021", "Nombre d'organismes": 1642 },
  { month: "nov 2021", "Nombre d'organismes": 1835 },
];

const AcquisitionCfaBarGraph = () => {
  return (
    <ResponsiveBar
      data={data}
      indexBy="month"
      keys={["Nombre d'organismes"]}
      margin={{ top: 32, right: 0, bottom: 32, left: 16 }}
      colors="#6A94F8"
      padding={0.4}
      enableGridY={false}
      axisBottom={{ tickSize: 0, tickPadding: 16 }}
      axisLeft={{
        legend: "Nombre d'organismes",
        legendPosition: "start",
        legendOffset: -10,
        renderTick: () => null,
      }}
      axisTop={null}
      axisRight={null}
      enableLabel
      theme={{
        fontFamily: "Marianne",
        textColor: "#1E1E1E",
      }}
    />
  );
};

export default AcquisitionCfaBarGraph;
