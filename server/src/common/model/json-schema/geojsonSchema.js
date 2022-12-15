import { object, string, array, number } from "./jsonSchemaTypes.js";

export const geojsonSchema = () => {
  return object(
    {
      type: string(),
      geometry: object(
        {
          type: string(),
          coordinates: array(),
        },
        { required: ["type", "coordinates"] }
      ),
      properties: object({
        score: number(),
        source: string(),
      }),
    },
    { required: ["type", "geometry"] }
  );
};
