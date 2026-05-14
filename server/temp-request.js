const http = require("http");
const postJson = (path, data) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: "localhost",
      port: 5001,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () =>
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: raw,
        }),
      );
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
(async () => {
  try {
    const reg = await postJson("/api/auth/register", {
      name: "Temp User",
      email: "tempuser@local",
      password: "Temp1234",
    });
    console.log("REGISTER", reg.statusCode, reg.body);
    const login = await postJson("/api/auth/login", {
      email: "tempuser@local",
      password: "Temp1234",
    });
    console.log("LOGIN", login.statusCode, login.body);
  } catch (err) {
    console.error(err);
  }
})();
