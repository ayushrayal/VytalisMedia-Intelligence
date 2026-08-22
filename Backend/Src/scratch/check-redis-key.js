const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const cacheUtil = require("../utils/cache.util");

async function checkKey() {
  await cacheUtil.connect();
  const userId = "6a7af82ba42501fa04e118e9";
  const uVer = (await cacheUtil.get(`perm_ver:user:${userId}`)) || 1;
  const oVer = (await cacheUtil.get("perm_ver:org:6a86d1f49699597f4b7d3af9")) || 1;
  const gVer = (await cacheUtil.get("perm_ver:global")) || 1;

  console.log(`perm_ver:user:${userId} =`, uVer);
  console.log("perm_ver:org:6a86d1f49699597f4b7d3af9 =", oVer);
  console.log("perm_ver:global =", gVer);

  const exactKey = `eff_perms:${userId}:u${uVer}:o${oVer}:g${gVer}`;
  const data = await cacheUtil.get(exactKey);
  console.log(`Exact Key '${exactKey}' content for meta.campaigns:`, data ? data["meta.campaigns"] : "NULL / NOT FOUND");

  process.exit(0);
}

checkKey().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
