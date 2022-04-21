import { ResponsiveBar } from "@nivo/bar";
import React from "react";

const data = [
  { month: "mars 2021", "Nombre d'organismes": 1013 },
  { month: "avr 2021", "Nombre d'organismes": 1047 },
  { month: "mai 2021", "Nombre d'organismes": 1107 },
  { month: "juin 2021", "Nombre d'organismes": 1173 },
  { month: "juil 2021", "Nombre d'organismes": 1305 },
  { month: "aout 2021", "Nombre d'organismes": 1372 },
  { month: "sept 2021", "Nombre d'organismes": 1468 },
  { month: "oct 2021", "Nombre d'organismes": 1568 },
  { month: "nov 2021", "Nombre d'organismes": 1815 },
  { month: "dec 2021", "Nombre d'organismes": 1935 },
  { month: "jan 2022", "Nombre d'organismes": 2055 },
  { month: "fev 2022", "Nombre d'organismes": 2199 },
  { month: "mars 2022", "Nombre d'organismes": 2503 },
];

const AcquisitionCfaBarGraph = () => {
  return (
    <ResponsiveBar
      data={data}
      indexBy="month"
      keys={["Nombre d'organismes"]}
      margin={{ top: 16, right: 0, bottom: 32, left: 56 }}
      colors="#6A94F8"
      padding={0.4}
      enableGridY={false}
      axisBottom={{ tickSize: 0, tickPadding: 12 }}
      axisLeft={{
        legend: "Nombre d'organismes",
        legendPosition: "middle",
        legendOffset: -48,
        tickSize: 0,
        tickPadding: 0,
      }}
      axisTop={null}
      axisRight={null}
      enableLabel={false}
      theme={{
        fontFamily: "Marianne",
        textColor: "#1E1E1E",
      }}
    />
  );
};

export default AcquisitionCfaBarGraph;
