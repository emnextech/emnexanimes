// Vercel Serverless Function - M3U8 Proxy
// This bypasses Cloudflare Worker IP blocking by using Vercel's infrastructure

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  const targetUrl = url.searchParams.get('url');
  const customHeaders = url.searchParams.get('headers');
  
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'No URL provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  try {
    const headers = {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://rapid-cloud.co',
      'Referer': 'https://rapid-cloud.co/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    };
    
    // Apply custom headers
    if (customHeaders) {
      try {
        const parsed = JSON.parse(customHeaders);
        if (parsed.referer) {
          headers['Referer'] = parsed.referer;
          headers['Origin'] = new URL(parsed.referer).origin;
        }
      } catch {}
    }
    
    // Forward Range header for video seeking
    const range = request.headers.get('Range');
    if (range) {
      headers['Range'] = range;
    }
    
    const response = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
    });
    
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const responseHeaders = { ...corsHeaders };
    
    // Copy important headers
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    
    responseHeaders['Accept-Ranges'] = 'bytes';
    
    // Handle M3U8 - rewrite URLs
    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      let body = await response.text();
      responseHeaders['Content-Type'] = 'application/vnd.apple.mpegurl';
      
      if (body.startsWith('#EXTM3U')) {
        const baseUrl = targetUrl.replace(/\/[^\/]*$/, '');
        const proxyBase = `${url.origin}/api/proxy?url=`;
        
        // Rewrite relative URLs
        const lines = body.split('\n').map(line => {
          if (line.startsWith('#') || !line.trim()) {
            // Handle URI in tags
            if (line.includes('URI="')) {
              return line.replace(/URI="([^"]+)"/g, (_, uri) => {
                const absUrl = uri.startsWith('http') ? uri : `${baseUrl}/${uri}`;
                return `URI="${proxyBase}${encodeURIComponent(absUrl)}"`;
              });
            }
            return line;
          }
          // Handle segment URLs
          const absUrl = line.trim().startsWith('http') ? line.trim() : `${baseUrl}/${line.trim()}`;
          return `${proxyBase}${encodeURIComponent(absUrl)}`;
        });
        
        body = lines.join('\n');
      }
      
      return new Response(body, {
        status: response.status,
        headers: responseHeaders,
      });
    }
    
    // Stream other content directly
    responseHeaders['Content-Type'] = contentType;
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
