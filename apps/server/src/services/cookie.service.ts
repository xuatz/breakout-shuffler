export class CookieService {
  extractCookieValue({ cookie, key }: { cookie?: string; key: string }) {
    if (!cookie) return undefined;

    const cookies = cookie.split(';').reduce((acc, curr) => {
      const [key, value] = curr.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });

    return cookies[key];
  }

  extractUserId(cookie?: string): string | undefined {
    return this.extractCookieValue({
      cookie,
      key: '_bsid',
    });
  }
}
