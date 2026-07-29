// Locate the Vercel Blob read-write token regardless of its env var name.
//
// Connecting a Blob store normally adds BLOB_READ_WRITE_TOKEN — but if a
// variable with that name already existed (e.g. from a previously connected
// store that was later deleted), Vercel stores the new token under a custom
// prefix like MYSTORE_READ_WRITE_TOKEN instead. Scanning for any *_READ_WRITE_TOKEN
// whose value looks like a blob token covers both cases.
export function blobToken(): string | undefined {
  const std = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (std) return std;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("_READ_WRITE_TOKEN") && value?.startsWith("vercel_blob_rw_")) {
      return value;
    }
  }
  return undefined;
}
