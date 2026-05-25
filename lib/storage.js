import { get, list, put } from "@vercel/blob";
import {
  checkDatabase,
  hasDatabaseConfig,
  listEnquiries as listDatabaseEnquiries,
  saveEnquiry as saveDatabaseEnquiry,
} from "./database.js";

function storageConfigError() {
  const error = new Error(
    "Storage is not configured. Set DATABASE_URL for Postgres or connect Vercel Blob."
  );
  error.code = "STORAGE_NOT_CONFIGURED";
  return error;
}

export function hasBlobConfig() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function hasStorageConfig() {
  return hasDatabaseConfig() || hasBlobConfig();
}

export function getStorageMode() {
  if (hasDatabaseConfig()) {
    return "postgres";
  }

  if (hasBlobConfig()) {
    return "blob";
  }

  return "missing_configuration";
}

function blobRecord(data, meta) {
  const createdAt = new Date().toISOString();
  const id = `${createdAt.replace(/[:.]/g, "-")}-${crypto.randomUUID()}`;

  return {
    id,
    name: data.name,
    phone: data.phone,
    matter: data.matter,
    message: data.message,
    status: "new",
    ip_address: meta.ipAddress || null,
    user_agent: meta.userAgent || null,
    created_at: createdAt,
  };
}

async function saveBlobEnquiry(data, meta = {}) {
  const record = blobRecord(data, meta);

  await put(`enquiries/${record.id}.json`, JSON.stringify(record, null, 2), {
    access: "private",
    contentType: "application/json",
  });

  return {
    id: record.id,
    created_at: record.created_at,
  };
}

async function readBlobJson(pathname) {
  const result = await get(pathname, { access: "private" });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return JSON.parse(await new Response(result.stream).text());
}

async function listBlobEnquiries(limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const { blobs } = await list({
    prefix: "enquiries/",
    limit: 1000,
  });

  const newest = blobs
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, safeLimit);

  const records = await Promise.all(newest.map((blob) => readBlobJson(blob.pathname)));

  return records
    .filter(Boolean)
    .map(({ ip_address, user_agent, ...record }) => record);
}

export async function saveEnquiry(data, meta = {}) {
  if (hasDatabaseConfig()) {
    return saveDatabaseEnquiry(data, meta);
  }

  if (hasBlobConfig()) {
    return saveBlobEnquiry(data, meta);
  }

  throw storageConfigError();
}

export async function listEnquiries(limit = 50) {
  if (hasDatabaseConfig()) {
    return listDatabaseEnquiries(limit);
  }

  if (hasBlobConfig()) {
    return listBlobEnquiries(limit);
  }

  throw storageConfigError();
}

export async function checkStorage() {
  if (hasDatabaseConfig()) {
    await checkDatabase();
    return "postgres";
  }

  if (hasBlobConfig()) {
    await list({ prefix: "enquiries/", limit: 1 });
    return "blob";
  }

  throw storageConfigError();
}