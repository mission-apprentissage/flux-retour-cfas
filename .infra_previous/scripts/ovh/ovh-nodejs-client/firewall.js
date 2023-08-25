const { resourceExists } = require("./utils");

const rules = {
  allowTcpConnection: () => {
    return {
      sequence: "0",
      action: "permit",
      protocol: "tcp",
      source: null,
      sourcePort: null,
      destinationPort: null,
      tcpOption: { option: "established" },
    };
  },
  allowTcpOnPort: (port, priority) => {
    return {
      sequence: priority,
      action: "permit",
      protocol: "tcp",
      destinationPort: port,
      source: null,
      sourcePort: null,
      tcpOption: {},
    };
  },
  allowICMP: () => {
    return {
      sequence: "10",
      protocol: "icmp",
      action: "permit",
      source: null,
      sourcePort: null,
      destinationPort: null,
    };
  },
  denyAllTcp: () => {
    return {
      sequence: "19",
      action: "deny",
      protocol: "tcp",
      source: null,
      sourcePort: null,
      destinationPort: null,
      tcpOption: {},
    };
  },
};

function asIpBlock(ip) {
  return `${ip}%2F32`;
}

async function firewallExists(client, ip) {
  return resourceExists(client, () => {
    let ipBlock = asIpBlock(ip);
    return client.request("GET", `/ip/${ipBlock}/firewall/${ip}`);
  });
}

async function ruleExists(client, ip, rule) {
  return resourceExists(client, () => {
    let ipBlock = asIpBlock(ip);
    return client.request("GET", `/ip/${ipBlock}/firewall/${ip}/rule/${rule.sequence}`);
  });
}

async function mitigationActivated(client, ip) {
  return resourceExists(client, () => {
    let ipBlock = asIpBlock(ip);
    return client.request("GET", `/ip/${ipBlock}/mitigation/${ip}`);
  });
}

async function createFirewall(client, ip) {
  let ipBlock = asIpBlock(ip);

  if (await firewallExists(client, ip)) {
    console.info("Firewall already created");
    return;
  }
  console.info(`Creating firewall for ip '${ip}'...`);
  return client.request("POST", `/ip/${ipBlock}/firewall`, { ipOnFirewall: ip });
}

async function addRule(client, ip, rule) {
  let ipBlock = asIpBlock(ip);

  if (await ruleExists(client, ip, rule)) {
    console.info(`Rule ${rule.sequence} already exists`);
    return;
  }

  console.info(`Creating rule ${rule.sequence}...`);
  return client.request("POST", `/ip/${ipBlock}/firewall/${ip}/rule`, rule);
}

async function removeRule(client, ip, rule) {
  let ipBlock = asIpBlock(ip);

  if (await ruleExists(client, ip, rule)) {
    console.info(`Deleting rule ${rule.sequence}...`);
    return client.request("DELETE", `/ip/${ipBlock}/firewall/${ip}/rule/${rule.sequence}`);
  } else {
    console.info(`Rule ${rule.sequence} does not exists !`);
  }
}

async function configureFirewall(client, ip) {
  await createFirewall(client, ip);
  await addRule(client, ip, rules.allowTcpConnection());
  await addRule(client, ip, rules.allowTcpOnPort(22, 1));
  await addRule(client, ip, rules.allowTcpOnPort(443, 2));
  await addRule(client, ip, rules.allowTcpOnPort(80, 3));
  await addRule(client, ip, rules.allowICMP());
  await addRule(client, ip, rules.denyAllTcp());
}

async function closeService(client, ip) {
  if (await firewallExists(client, ip)) {
    await removeRule(client, ip, rules.allowTcpOnPort(443, 2));
    await removeRule(client, ip, rules.allowTcpOnPort(80, 3));
  } else {
    console.warn("Firewall does not exist, can't close service on port 443/80 !");
  }
}

async function activateMitigation(client, ip) {
  let ipBlock = asIpBlock(ip);
  if (await mitigationActivated(client, ip)) {
    console.info("Mitigation already activated");
    return;
  }

  console.info("Activating permanent mitigation...");
  await client.request("POST", `/ip/${ipBlock}/mitigation`, { ipOnMitigation: ip });
}

module.exports = {
  configureFirewall,
  activateMitigation,
  closeService,
};
