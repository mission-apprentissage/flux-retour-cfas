import bunyan from "bunyan";
import PrettyStream from "bunyan-prettystream";
import config from "../config.js";

const createStreams = () => {
  const { type, level } = config.log;

  const jsonStream = () => {
    return {
      name: "json",
      level,
      stream: process.stdout,
    };
  };

  const consoleStream = () => {
    const pretty = new PrettyStream();
    pretty.pipe(process.stdout);
    return {
      name: "console",
      level,
      stream: pretty,
    };
  };

  const streams = type === "console" ? [consoleStream()] : [jsonStream()];

  return streams;
};

export default bunyan.createLogger({
  name: config.appName,
  serializers: bunyan.stdSerializers,
  streams: createStreams(),
});
