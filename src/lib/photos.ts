import manifest from "@/data/photos.generated.json";

export type Photo = {
  src: string;
  thumb: string;
  w: number;
  h: number;
  place: string;
  file: string;
};

const photos = manifest as Record<string, Photo[]>;

export function photosFor(slug: string): Photo[] {
  return photos[slug] ?? [];
}

/** Every photo, tagged with its country slug, in manifest order. */
export const allPhotos: (Photo & { country: string })[] = Object.entries(photos).flatMap(([country, list]) =>
  list.map((p) => ({ ...p, country })),
);

export function findPhoto(file: string): Photo | undefined {
  return allPhotos.find((p) => p.file === file);
}
