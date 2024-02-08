import { Text } from "@chakra-ui/react";

interface EffectifQueueItemViewProps {
  effectifQueueItem: any;
}
const EffectifQueueItemView = ({ effectifQueueItem }: EffectifQueueItemViewProps) => {
  return <Text>{JSON.stringify(effectifQueueItem)}</Text>;
};

export default EffectifQueueItemView;
