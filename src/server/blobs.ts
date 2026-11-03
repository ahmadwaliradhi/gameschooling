import type { Blobs } from "#/services/deps";

export function r2Blobs(bucket: R2Bucket): Blobs {
  return {
    put: async (key, bytes, contentType) =>
      void (await bucket.put(key, bytes, { httpMetadata: { contentType } })),
    get: async (key) => {
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        bytes: new Uint8Array(await object.arrayBuffer()),
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
      };
    },
    delete: (key) => bucket.delete(key),
  };
}
