/**
 * Anime Streaming Proxy Worker
 * 
 * This Cloudflare Worker proxies HLS/M3U8 streaming sources to bypass CORS
 * and other restrictions. It handles:
 * - M3U8 playlist files (master and media playlists)
 * - TS/Video segment files
 * - Key files for encrypted streams
 * - VTT subtitle files
 */

export interface Env {
    ALLOWED_ORIGINS?: string;
}

// CORS headers for responses
const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Access-Control-Max-Age": "3600",
};

// Required headers for upstream requests (mimics browser)
const getRequiredHeaders = (range?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Origin": "https://megacloud.blog",
        "Referer": "https://megacloud.blog/",
        "Sec-Ch-Ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Gpc": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };
    
    // Forward Range header for video seeking
    if (range) {
        headers["Range"] = range;
    }
    
    return headers;
};

// Handle OPTIONS preflight requests
function handleOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

// Health check endpoint
function handleHealth(): Response {
    return new Response(JSON.stringify({
        status: 'ok',
        service: 'anime-proxy-worker',
        timestamp: new Date().toISOString(),
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}

// Check if content type indicates HLS/M3U8 content (not TS segments)
function isM3U8Content(contentType: string | null, url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // TS segments should NOT be treated as M3U8
    if (lowerUrl.endsWith(".ts") || lowerUrl.includes(".ts?")) {
        return false;
    }
    
    // Check content type for M3U8
    if (contentType) {
        const lowerContentType = contentType.toLowerCase();
        if (
            lowerContentType.includes("application/vnd.apple.mpegurl") ||
            lowerContentType.includes("application/x-mpegurl") ||
            lowerContentType.includes("audio/mpegurl") ||
            lowerContentType.includes("audio/x-mpegurl")
        ) {
            return true;
        }
    }
    
    // Check URL for M3U8 extension
    if (lowerUrl.endsWith(".m3u8") || lowerUrl.includes(".m3u8?")) {
        return true;
    }
    
    return false;
}

// Check if this is a binary/streamable content
function isBinaryContent(contentType: string | null, url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // TS segments are binary
    if (lowerUrl.endsWith(".ts") || lowerUrl.includes(".ts?")) {
        return true;
    }
    
    // Check content type
    if (contentType) {
        const lowerContentType = contentType.toLowerCase();
        if (
            lowerContentType.includes("video/") ||
            lowerContentType.includes("audio/") ||
            lowerContentType.includes("application/octet-stream") ||
            lowerContentType.includes("video/mp2t")
        ) {
            return true;
        }
    }
    
    return false;
}

// Main proxy handler
async function handleProxy(request: Request): Promise<Response> {
    try {
        const requestUrl = new URL(request.url);
        const workerOrigin = requestUrl.origin; // e.g., http://127.0.0.1:8787
        const url = requestUrl.searchParams.get('url');
        const customHeadersParam = requestUrl.searchParams.get('headers');

        if (!url) {
            return new Response(JSON.stringify({ 
                error: "No URL provided",
                usage: "/fetch?url=<encoded-url>",
                example: "/fetch?url=" + encodeURIComponent("https://example.com/video.m3u8"),
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // Validate URL
        let targetURL: URL;
        try {
            targetURL = new URL(url);
            if (!['http:', 'https:'].includes(targetURL.protocol)) {
                throw new Error('Invalid protocol');
            }
        } catch {
            return new Response(JSON.stringify({
                error: 'Invalid target URL',
                provided: url,
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // Get Range header from original request for video seeking
        const rangeHeader = request.headers.get('Range');
        const headers = getRequiredHeaders(rangeHeader);

        // Parse and apply custom headers from the request (e.g., referer from Player)
        if (customHeadersParam) {
            try {
                const customHeaders = JSON.parse(customHeadersParam);
                if (customHeaders.referer) {
                    headers["Referer"] = customHeaders.referer;
                    // Also update Origin to match
                    try {
                        headers["Origin"] = new URL(customHeaders.referer).origin;
                    } catch {
                        // Keep default Origin if referer URL parsing fails
                    }
                }
            } catch {
                // Ignore invalid JSON, use default headers
            }
        }

        // Set up abort controller for timeout (60s for large segments)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const fetchOptions: RequestInit = {
            headers,
            redirect: "follow",
            signal: controller.signal,
            method: request.method === 'HEAD' ? 'HEAD' : 'GET'
        };

        const fetchedResponse = await fetch(url, fetchOptions)
            .finally(() => clearTimeout(timeoutId));

        // Handle 403 Forbidden
        if (fetchedResponse.status === 403) {
            console.error("403 Forbidden - Server denied access");
            return new Response(
                JSON.stringify({
                    message: "Access denied by target server",
                    error: "The streaming server returned a 403 Forbidden error",
                }),
                {
                    status: 403,
                    headers: { "Content-Type": "application/json", ...corsHeaders },
                }
            );
        }

        // Handle other error responses
        if (!fetchedResponse.ok && fetchedResponse.status !== 206) {
            return new Response(
                JSON.stringify({
                    message: "Upstream request failed",
                    status: fetchedResponse.status,
                    statusText: fetchedResponse.statusText,
                }),
                {
                    status: fetchedResponse.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders },
                }
            );
        }

        const contentType = fetchedResponse.headers.get("Content-Type") || "application/octet-stream";

        // Build response headers
        const responseHeaders: Record<string, string> = { ...corsHeaders };
        
        // Copy important headers from upstream
        const contentLength = fetchedResponse.headers.get("Content-Length");
        if (contentLength) {
            responseHeaders["Content-Length"] = contentLength;
        }
        
        const contentRange = fetchedResponse.headers.get("Content-Range");
        if (contentRange) {
            responseHeaders["Content-Range"] = contentRange;
        }
        
        const acceptRanges = fetchedResponse.headers.get("Accept-Ranges");
        if (acceptRanges) {
            responseHeaders["Accept-Ranges"] = acceptRanges;
        } else {
            responseHeaders["Accept-Ranges"] = "bytes";
        }

        // IMPORTANT: Check M3U8 FIRST (by URL) before binary content check
        // Some servers incorrectly return M3U8 files with video/* content-type
        if (isM3U8Content(contentType, url)) {
            let responseBody = await fetchedResponse.text();
            responseHeaders["Content-Type"] = "application/vnd.apple.mpegurl";

            // Check if it's a valid M3U8 file
            if (!responseBody.startsWith("#EXTM3U")) {
                // Not a valid M3U8, return as-is
                return new Response(responseBody, {
                    status: fetchedResponse.status,
                    headers: responseHeaders,
                });
            }

            const pathRegex = /\/[^\/]*$/;
            const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)[^\s/$.?#].[^\s]*$/i;
            const m3u8FileChunks = responseBody.split("\n");
            const m3u8AdjustedChunks: string[] = [];

            for (const line of m3u8FileChunks) {
                // Keep comments and empty lines as-is
                if (line.startsWith("#") || !line.trim()) {
                    // Handle URI in EXT-X-KEY or EXT-X-MAP tags
                    if (line.includes('URI="')) {
                        const rewrittenLine = line.replace(
                            /URI="([^"]+)"/g,
                            (_match, uri) => {
                                let absoluteUrl: string;
                                if (uri.match(urlRegex)) {
                                    absoluteUrl = uri;
                                } else {
                                    absoluteUrl = url.replace(
                                        pathRegex,
                                        uri.startsWith("/") ? uri : `/${uri}`
                                    );
                                }
                                return `URI="${workerOrigin}/fetch?url=${encodeURIComponent(absoluteUrl)}"`;
                            }
                        );
                        m3u8AdjustedChunks.push(rewrittenLine);
                    } else {
                        m3u8AdjustedChunks.push(line);
                    }
                    continue;
                }

                const formattedLine = line.trim();

                // Handle absolute URLs
                if (formattedLine.match(urlRegex)) {
                    m3u8AdjustedChunks.push(
                        `${workerOrigin}/fetch?url=${encodeURIComponent(formattedLine)}`
                    );
                } else {
                    // Handle relative URLs
                    const newUrls = url.replace(
                        pathRegex,
                        formattedLine.startsWith("/") ? formattedLine : `/${formattedLine}`
                    );
                    m3u8AdjustedChunks.push(
                        `${workerOrigin}/fetch?url=${encodeURIComponent(newUrls)}`
                    );
                }
            }

            responseBody = m3u8AdjustedChunks.join("\n");
            
            return new Response(responseBody, {
                status: fetchedResponse.status,
                headers: responseHeaders,
            });
        }

        // Handle binary content (TS segments, video files) - stream directly
        if (isBinaryContent(contentType, url)) {
            responseHeaders["Content-Type"] = contentType.includes("video") || contentType.includes("mp2t") 
                ? contentType 
                : "video/mp2t";
            
            // Stream the response body directly without buffering
            return new Response(fetchedResponse.body, {
                status: fetchedResponse.status,
                statusText: fetchedResponse.statusText,
                headers: responseHeaders,
            });
        }

        // Handle VTT subtitle files
        if (contentType.includes("text/vtt")) {
            let responseBody = await fetchedResponse.text();
            responseHeaders["Content-Type"] = "text/vtt";

            // Rewrite image URLs in VTT files (for thumbnail sprites)
            const regex = /.+?\.(jpg)+/g;
            const matches = [...responseBody.matchAll(regex)];

            const fileNames: string[] = [];
            for (const match of matches) {
                const filename = match[0];
                if (!fileNames.includes(filename)) {
                    fileNames.push(filename);
                }
            }

            if (fileNames.length > 0) {
                for (const filename of fileNames) {
                    const newUrl = url.replace(/\/[^\/]*$/, `/${filename}`);
                    responseBody = responseBody.replaceAll(
                        filename,
                        `${workerOrigin}/fetch?url=${encodeURIComponent(newUrl)}`
                    );
                }
            }
            
            return new Response(responseBody, {
                status: fetchedResponse.status,
                headers: responseHeaders,
            });
        }

        // Default: stream other content types directly
        responseHeaders["Content-Type"] = contentType;
        return new Response(fetchedResponse.body, {
            status: fetchedResponse.status,
            statusText: fetchedResponse.statusText,
            headers: responseHeaders,
        });

    } catch (error: unknown) {
        console.error("Proxy error:", error);

        let errorMessage = error instanceof Error ? error.message : "Unknown error";
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.name === "AbortError") {
                errorMessage = "Request timed out";
                statusCode = 504;
            } else if (error.name === "TypeError" && error.message.includes("fetch")) {
                errorMessage = "Network error when trying to fetch resource";
                statusCode = 502;
            }
        }

        const requestUrl = new URL(request.url);
        return new Response(
            JSON.stringify({
                message: "Request failed",
                error: errorMessage,
                url: requestUrl.searchParams.get('url'),
            }),
            {
                status: statusCode,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    }
}

// Main request handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const startTime = Date.now();
        
        // Log incoming request
        console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}${url.search ? '?' + url.searchParams.toString().slice(0, 100) : ''}`);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            console.log(`[${new Date().toISOString()}] CORS preflight handled`);
            return handleOptions();
        }

        // Health check endpoint
        if (url.pathname === '/health') {
            console.log(`[${new Date().toISOString()}] Health check`);
            return handleHealth();
        }

        // Root path without query params shows health/usage
        if (url.pathname === '/' && url.search === '') {
            return handleHealth();
        }

        // Handle proxy requests at /fetch or root with url param
        if (request.method === 'GET' || request.method === 'HEAD') {
            // Support both /fetch?url= and /?url=
            if (url.pathname === '/fetch' || url.pathname === '/') {
                const targetUrl = url.searchParams.get('url');
                console.log(`[${new Date().toISOString()}] Proxying: ${targetUrl?.slice(0, 150)}...`);
                
                const response = await handleProxy(request);
                const duration = Date.now() - startTime;
                console.log(`[${new Date().toISOString()}] Completed ${response.status} in ${duration}ms`);
                
                return response;
            }
            
            // Handle bare paths that look like streaming resources
            // This catches cases where the player requests /segment.ts or /index.m3u8 directly
            // This often happens during stream switching when the player has stale references
            const barePath = url.pathname;
            if (
                barePath.endsWith('.ts') ||
                barePath.endsWith('.m3u8') ||
                barePath.endsWith('.vtt') ||
                barePath.endsWith('.key') ||
                barePath.endsWith('.mp4') ||
                barePath.includes('seg-') ||
                barePath.includes('index-')
            ) {
                // Check if there's a referer header we can use to construct the full URL
                const referer = request.headers.get('Referer');
                if (referer) {
                    try {
                        // Try to extract the original base URL from the referer
                        const refererUrl = new URL(referer);
                        const refererParams = refererUrl.searchParams.get('url');
                        if (refererParams) {
                            // Get base URL from the referer's target URL
                            const targetUrl = new URL(refererParams);
                            const basePath = targetUrl.href.replace(/\/[^\/]*$/, '');
                            const fullUrl = `${basePath}${barePath}`;
                            
                            // Redirect to proper fetch URL
                            const redirectUrl = `${url.origin}/fetch?url=${encodeURIComponent(fullUrl)}`;
                            return Response.redirect(redirectUrl, 302);
                        }
                    } catch {
                        // Referer parsing failed, fall through to graceful handling
                    }
                }
                
                // Return graceful responses for stale stream requests during switching
                // This prevents player errors when switching between sub/dub or episodes
                
                if (barePath.endsWith('.m3u8')) {
                    // Return an empty but valid M3U8 that signals stream end
                    return new Response('#EXTM3U\n#EXT-X-ENDLIST\n', {
                        status: 200,
                        headers: { 
                            "Content-Type": "application/vnd.apple.mpegurl",
                            ...corsHeaders 
                        },
                    });
                }
                
                if (barePath.endsWith('.ts')) {
                    // Return empty response for TS segments - player will skip
                    return new Response(null, {
                        status: 204,
                        headers: corsHeaders,
                    });
                }
                
                if (barePath.endsWith('.vtt')) {
                    // Return empty VTT
                    return new Response('WEBVTT\n\n', {
                        status: 200,
                        headers: { 
                            "Content-Type": "text/vtt",
                            ...corsHeaders 
                        },
                    });
                }
                
                // For other types, return 204 No Content
                return new Response(null, {
                    status: 204,
                    headers: corsHeaders,
                });
            }
        }

        return new Response(JSON.stringify({
            error: 'Not found',
            usage: '/fetch?url=<encoded-url>',
        }), { 
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    },
};
