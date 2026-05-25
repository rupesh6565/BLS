import { listEnquiries, saveEnquiry } from "../lib/storage.js";
import { validateEnquiry } from "../lib/validation.js";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const corsHeaders = {
  ...jsonHeaders,
  allow: "GET, POST, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function getIpAddress(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "";
}

function isAdminRequest(request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${token}`;
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const error = new Error("Expected application/json.");
    error.status = 415;
    throw error;
  }

  return request.json();
}

async function handlePost(request) {
  try {
    const body = await readJson(request);
    const validation = validateEnquiry(body);

    if (!validation.ok) {
      return json({ ok: false, errors: validation.errors }, 422);
    }

    const saved = await saveEnquiry(validation.data, {
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get("user-agent") || "",
    });

    return json(
      {
        ok: true,
        id: saved.id,
        createdAt: saved.created_at,
        message: "Your enquiry has been received. The office will contact you soon.",
      },
      201
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ ok: false, error: "Invalid JSON payload." }, 400);
    }

    if (error.status) {
      return json({ ok: false, error: error.message }, error.status);
    }

    if (error.code === "DB_NOT_CONFIGURED" || error.code === "STORAGE_NOT_CONFIGURED") {
      return json(
        {
          ok: false,
          error: "Storage is not configured yet. Please call the office directly.",
        },
        503
      );
    }

    console.error("Failed to save enquiry", error);
    return json(
      {
        ok: false,
        error: "Could not save your enquiry right now. Please call the office directly.",
      },
      500
    );
  }
}

async function handleGet(request) {
  if (!isAdminRequest(request)) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const url = new URL(request.url);
  const enquiries = await listEnquiries(url.searchParams.get("limit"));

  return json({ ok: true, enquiries });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "POST") {
      return handlePost(request);
    }

    if (request.method === "GET") {
      return handleGet(request);
    }

    return json({ ok: false, error: "Method not allowed." }, 405);
  },
};