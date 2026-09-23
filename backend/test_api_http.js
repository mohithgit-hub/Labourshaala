import http from "node:http";

async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testHttpEndpoints() {
  console.log("-----------------------------------------");
  console.log("Testing HTTP API Endpoints on port 5000...");
  console.log("-----------------------------------------");

  // 1. Health check
  const healthRes = await makeRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/health",
    method: "GET",
  });
  console.log(`1. Health Check (Status ${healthRes.status}):`, healthRes.body.status === "ok" ? "PASS ✅" : "FAIL ❌");

  // 2. Login as demo user
  const loginRes = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { emailOrPhone: "customer@labourshaala.com", password: "password123" }
  );
  console.log(`2. Login API (Status ${loginRes.status}):`, loginRes.body.token ? "PASS ✅" : "FAIL ❌");
  const token = loginRes.body.token;

  // 3. /api/auth/me
  const meRes = await makeRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`3. Auth Me (Status ${meRes.status}):`, meRes.body.user?.email === "customer@labourshaala.com" ? "PASS ✅" : "FAIL ❌");

  // 4. /api/workers?skill=Electrician
  const workersRes = await makeRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/workers?skill=Electrician",
    method: "GET",
  });
  console.log(`4. Worker Listing API (Found ${workersRes.body.length} Electricians):`, workersRes.body.length > 0 ? "PASS ✅" : "FAIL ❌");

  console.log("-----------------------------------------");
  console.log("HTTP API Test Completed Successfully!");
  console.log("-----------------------------------------");
}

testHttpEndpoints().catch(err => {
  console.error("HTTP Test error:", err);
  process.exit(1);
});
