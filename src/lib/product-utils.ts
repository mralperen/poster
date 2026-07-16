export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function defaultViewLabels(viewCount: 2 | 3): string[] {
  if (viewCount === 3) {
    return ["Sol görünüm", "Orta görünüm", "Sağ görünüm"];
  }
  return ["Sol görünüm", "Sağ görünüm"];
}
