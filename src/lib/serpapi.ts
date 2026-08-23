const SERPAPI_KEY = process.env.SERPAPI_KEY;

export async function fetchPAA(keyword: string): Promise<string[]> {
  if (!SERPAPI_KEY) return [];
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', keyword);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('gl', 'ca');
    url.searchParams.set('api_key', SERPAPI_KEY);
    url.searchParams.set('num', '10');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`SerpApi ${res.status}`);
    const data = await res.json();
    const paa = data?.related_questions?.map((q: any) => q.question) || [];
    return paa.slice(0, 5);
  } catch (error) {
    console.error('SerpApi error:', error);
    return [];
  }
}
