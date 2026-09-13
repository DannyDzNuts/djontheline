/** Prefix public and page URLs exactly once for repository-hosted Pages sites. */
export function url(path = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
