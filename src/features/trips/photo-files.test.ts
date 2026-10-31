import { describe, expect, it } from "vitest";

import { selectPhotoFiles } from "./photo-files";
import { MAX_PHOTOS, MAX_SOURCE_IMAGE_BYTES } from "./schemas";

function file(name: string, type: string, size = 1000): File {
  const blob = new File([new Uint8Array(0)], name, { type });
  Object.defineProperty(blob, "size", { value: size });
  return blob;
}

describe("selectPhotoFiles", () => {
  it("accepts JPEG, PNG and WebP", () => {
    const files = [
      file("a.jpg", "image/jpeg"),
      file("b.png", "image/png"),
      file("c.webp", "image/webp"),
    ];
    expect(selectPhotoFiles(files, 0)).toEqual({ accepted: files, problems: [] });
  });

  it("explains HEIC separately from other unsupported types", () => {
    const { accepted, problems } = selectPhotoFiles(
      [file("a.heic", "image/heic"), file("b.HEIC", ""), file("c.gif", "image/gif")],
      0,
    );
    expect(accepted).toEqual([]);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/HEIC/);
    expect(problems[1]).toMatch(/JPEG, PNG and WebP/);
  });

  it("rejects files over the size limit", () => {
    const { accepted, problems } = selectPhotoFiles(
      [file("big.jpg", "image/jpeg", MAX_SOURCE_IMAGE_BYTES + 1)],
      0,
    );
    expect(accepted).toEqual([]);
    expect(problems[0]).toMatch(/under/);
  });

  it("stops at the photo limit", () => {
    const files = Array.from({ length: 3 }, (_, i) => file(`${i}.jpg`, "image/jpeg"));
    const { accepted, problems } = selectPhotoFiles(files, MAX_PHOTOS - 2);
    expect(accepted).toEqual(files.slice(0, 2));
    expect(problems).toEqual([`A trip can have up to ${MAX_PHOTOS} photos.`]);
  });
});
