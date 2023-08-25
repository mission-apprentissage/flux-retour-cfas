const { resourceExists, waitReady } = require("./utils");

async function getNasName(client) {
  let [nasName] = await client.request("GET", "/dedicated/nasha");
  return nasName;
}

async function partitionExists(client, nasName, partitionName) {
  return resourceExists(client, () => {
    return client.request("GET", `/dedicated/nasha/${nasName}/partition/${partitionName}`);
  });
}

async function ipExists(client, nasName, partitionName, ip) {
  return resourceExists(client, () => {
    return client.request("GET", `/dedicated/nasha/${nasName}/partition/${partitionName}/access/${ip}`);
  });
}

async function createPartition(client, nasName, partitionName) {
  if (await partitionExists(client, nasName, partitionName)) {
    console.info(`Partition ${partitionName} already exists`);
    return;
  }

  console.info(`Creating new partition ${partitionName}...`);
  await client.request("POST", `/dedicated/nasha/${nasName}/partition`, {
    partitionName,
    protocol: "NFS",
    size: 100,
  });

  return waitReady(() => client.request("GET", `/dedicated/nasha/${nasName}/partition/${partitionName}`));
}

async function allowIp(client, nasName, partitionName, ip) {
  if (await ipExists(client, nasName, partitionName, ip)) {
    console.info(`IP ${ip} already allowed for the partition ${partitionName}`);
    return;
  }

  console.info(`Allow ip ${ip} to access to the partition ${partitionName}...`);
  return client.request("POST", `/dedicated/nasha/${nasName}/partition/${partitionName}/access`, {
    ip,
    type: "readwrite",
  });
}

async function createBackupPartition(client, ip, partitionName, nasName) {
  await createPartition(client, nasName, partitionName);
  await allowIp(client, nasName, partitionName, ip);
}

module.exports = {
  createBackupPartition,
};
