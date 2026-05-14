const http = require("http");

const request = (method, path, data = null, token = null) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5001,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      options.headers["Content-Length"] = Buffer.byteLength(
        JSON.stringify(data),
      );
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });

async function testAPIs() {
  try {
    console.log("🧪 TESTING BACKEND APIs...\n");

    // 1. Register user
    console.log("1. Registering user...");
    const register = await request("POST", "/api/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "Test1234",
    });
    console.log(`   Status: ${register.status}`);
    console.log(`   Response: ${JSON.stringify(register.data, null, 2)}\n`);

    // 2. Login
    console.log("2. Logging in...");
    const login = await request("POST", "/api/auth/login", {
      email: "test@example.com",
      password: "Test1234",
    });
    console.log(`   Status: ${login.status}`);
    const token = login.data.token;
    console.log(
      `   Token: ${token ? token.substring(0, 20) + "..." : "No token"}\n`,
    );

    if (!token) {
      console.log("❌ No token received, stopping tests");
      return;
    }

    // 3. Create task
    console.log("3. Creating task...");
    const task = await request(
      "POST",
      "/api/tasks",
      {
        title: "Test Task",
        description: "This is a test task",
        priority: "high",
      },
      token,
    );
    console.log(`   Status: ${task.status}`);
    console.log(`   Response: ${JSON.stringify(task.data, null, 2)}\n`);

    // 4. Get tasks
    console.log("4. Getting tasks...");
    const tasks = await request("GET", "/api/tasks", null, token);
    console.log(`   Status: ${tasks.status}`);
    console.log(
      `   Tasks count: ${Array.isArray(tasks.data) ? tasks.data.length : "N/A"}\n`,
    );

    // 5. Clock in (or handle already clocked in)
    console.log("5. Clocking in...");
    let clockIn = await request("POST", "/api/sessions/clock-in", {}, token);
    console.log(`   Status: ${clockIn.status}`);

    if (
      clockIn.status === 400 &&
      clockIn.data.message === "Already clocked in"
    ) {
      console.log(`   Already clocked in (expected for repeated tests)`);
    } else {
      console.log(`   Response: ${JSON.stringify(clockIn.data, null, 2)}`);
    }
    console.log();

    // 6. Send message (need another user first)
    console.log("6. Testing message API...");
    const message = await request(
      "POST",
      "/api/messages",
      {
        receiver: "507f1f77bcf86cd799439011", // Fake ID for testing
        content: "Hello from test!",
        position: { x: 100, y: 200 },
        distance: 50,
      },
      token,
    );
    console.log(`   Status: ${message.status}`);
    console.log(`   Response: ${JSON.stringify(message.data, null, 2)}\n`);

    console.log("✅ API Testing Complete!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAPIs();
