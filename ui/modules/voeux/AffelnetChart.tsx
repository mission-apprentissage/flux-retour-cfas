import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { Chart, DoughnutController, ArcElement } from "chart.js";
import { Doughnut } from "react-chartjs-2";

Chart.register(ArcElement);
Chart.register(DoughnutController);

interface AffelnetChartProps {
  totalApprenants?: number;
  apprenantsConcretises?: number;
}

const AffelnetChart = ({ totalApprenants = 1, apprenantsConcretises = 0 }: AffelnetChartProps) => {
  const data = {
    maintainAspectRatio: true,
    labels: ["Red", "Blue", "Yellow"],
    datasets: [
      {
        data: [apprenantsConcretises, totalApprenants - apprenantsConcretises],
        backgroundColor: ["#FA7659", "#EEF1F8"],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    rotation: -90,
    circumference: 180,
    hover: { mode: undefined },
  };

  return (
    <Box border="2px solid #EEEEEE">
      <VStack>
        <Flex>
          <Text color="#000091" fontWeight="700" fontSize="20px" textAlign="center" mt="30px" px="40px">
            % de jeunes ayant formulé un vœu Affelnet retrouvés sur votre Tableau de bord
          </Text>
        </Flex>

        <Flex width="260px">
          <Doughnut data={data} options={options} />
        </Flex>
        <Flex color="#000091" fontWeight="700" fontSize="24px" transform="translate(0, -105px)">
          {Number((apprenantsConcretises / totalApprenants) * 100).toFixed(2)}%
        </Flex>
        <Flex color="#000091" fontSize="16px" transform="translate(0, -105px)">
          <Text>soit {apprenantsConcretises} jeunes</Text>
        </Flex>
      </VStack>
    </Box>
  );
};

export default AffelnetChart;
