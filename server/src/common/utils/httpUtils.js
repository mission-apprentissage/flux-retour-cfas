import { oleoduc } from "oleoduc";

export const sendJsonStream = (stream, res) => {
  res.setHeader("Content-Type", "application/json");
  oleoduc(stream, res);
};
