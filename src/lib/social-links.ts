export function resolveInstagramUrl(
  value: string | undefined,
  href: string | undefined,
  fallback: string,
): string {
  const displayValue = value?.trim() ?? "";

  if (/^https?:\/\/(?:www\.)?instagram\.com\//i.test(displayValue)) {
    return displayValue;
  }

  const handle = displayValue.replace(/^@/, "");
  if (/^[a-zA-Z0-9._]+$/.test(handle)) {
    return `https://instagram.com/${handle}`;
  }

  const configuredHref = href?.trim() ?? "";
  if (/^https?:\/\/(?:www\.)?instagram\.com\/[^/]+\/?$/i.test(configuredHref)) {
    return configuredHref;
  }

  return fallback;
}
