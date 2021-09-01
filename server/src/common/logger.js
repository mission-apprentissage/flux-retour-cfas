const util = require("util");
const bunyan = require("bunyan");
const PrettyStream = require("bunyan-prettystream");
const BunyanSlack = require("bunyan-slack");
const BunyanElasticSearchStream = require("bunyan-elasticsearch-bulk");
const config = require("../../config");

const createStreams = () => {
  const { type, level } = config.log;
  const envName = config.env;

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

  const elasticStream = () => {
    return {
      name: "elastic-search",
      level,
      stream: BunyanElasticSearchStream({
        // see https://github.com/Milad/bunyan-elasticsearch-bulk#parameters-specific-to-this-module
        indexPattern: "[tdb-apprentissage-logs-]YYYY.MM.DD",
        node: config.elasticSearch.uri,
        limit: 10, // send logs by bulks of 10
        interval: 3000, // send logs every 3 seconds
      }),
    };
  };

  const slackStream = () => {
    const stream = new BunyanSlack(
      {
        webhook_url: config.slackWebhookUrl,
        customFormatter: (record, levelName) => {
          if (record.type === "http") {
            record = {
              url: record.request.url.relative,
              statusCode: record.response.statusCode,
              ...(record.error ? { message: record.error.message } : {}),
            };
          }
          return {
            text: util.format(`[%s][${envName}] %O`, levelName.toUpperCase(), record),
          };
        },
      },
      (error) => {
        console.log("Unable to send log to slack", error);
      }
    );

    return {
      name: "slack",
      level: "error",
      stream,
    };
  };

  const streams = type === "console" ? [consoleStream()] : [jsonStream()];

  if (config.log.streams.includes("elastic-search") && config.elasticSearch.uri) {
    streams.push(elasticStream());
  }
  if (config.log.streams.includes("slack") && config.slackWebhookUrl) {
    streams.push(slackStream());
  }
  return streams;
};

module.exports = bunyan.createLogger({
  name: config.appName,
  serializers: bunyan.stdSerializers,
  streams: createStreams(),
});
