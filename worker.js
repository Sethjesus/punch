export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ===== CORS =====
    if (req.method === "OPTIONS") {
      return cors();
    }

    // ===== 打卡 =====
    if (url.pathname === "/api/punch" && req.method === "POST") {
      const data = await req.json();

      const record = {
        id: crypto.randomUUID(),
        employeeId: data.employeeId,
        type: data.type, // IN / OUT
        time: new Date().toISOString(),
        clientTime: data.clientTime,
        location: data.location || null,
        ip: req.headers.get("CF-Connecting-IP")
      };

      await env.ATTENDANCE_KV.put(
        `punch:${record.employeeId}:${record.time}`,
        JSON.stringify(record)
      );

      return ok("打卡成功");
    }

    // ===== 請假 =====
    if (url.pathname === "/api/leave" && req.method === "POST") {
      const data = await req.json();

      const record = {
        id: crypto.randomUUID(),
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || "",
        status: "pending",
        createdAt: new Date().toISOString()
      };

      await env.LEAVE_KV.put(
        `leave:${record.employeeId}:${record.id}`,
        JSON.stringify(record)
      );

      return ok("請假申請已送出");
    }

    // ===== 後台：查打卡 =====
    if (url.pathname === "/api/admin/punches" && req.method === "GET") {
      const list = await env.ATTENDANCE_KV.list({ prefix: "punch:" });
      const data = [];

      for (const k of list.keys) {
        const v = await env.ATTENDANCE_KV.get(k.name);
        if (v) data.push(JSON.parse(v));
      }

      return json(data);
    }

    // ===== 後台：查請假 =====
    if (url.pathname === "/api/admin/leaves" && req.method === "GET") {
      const list = await env.LEAVE_KV.list({ prefix: "leave:" });
      const data = [];

      for (const k of list.keys) {
        const v = await env.LEAVE_KV.get(k.name);
        if (v) data.push(JSON.parse(v));
      }

      return json(data);
    }

    return new Response("Not Found", { status: 404 });
  }
};

// ===== 工具 =====
function cors() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function ok(msg) {
  return new Response(msg, {
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
