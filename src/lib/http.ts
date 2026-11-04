export const USER_AGENT = 'scott-feed/0.1 (+https://github.com/scottackerson/scott-feed)';

export const FETCH_TIMEOUT_MS = 3000;

async function request(url: string, accept: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: accept },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res;
}

export async function getJson<T = unknown>(url: string): Promise<T> {
  return (await request(url, 'application/json')).json() as Promise<T>;
}

export async function getText(url: string, accept = 'text/html, application/xml, */*'): Promise<string> {
  return (await request(url, accept)).text();
}
