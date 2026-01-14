# Anime Proxy Worker

A Cloudflare Worker that proxies HLS/M3U8 streaming sources to bypass CORS and other restrictions.

## Features

- Proxies M3U8 playlist files (master and media playlists)
- Automatically rewrites URLs in M3U8 files to route through the proxy
- Handles TS/Video segment files
- Supports encrypted streams (key files)
- Handles VTT subtitle files
- Configurable CORS settings

## Usage

### Query Parameter Method
```
https://your-worker.workers.dev/?url=https://example.com/video.m3u8
```

### Path-Based Method
```
https://your-worker.workers.dev/proxy/https%3A%2F%2Fexample.com%2Fvideo.m3u8
```

### Base64 Method
```
https://your-worker.workers.dev/b64/aHR0cHM6Ly9leGFtcGxlLmNvbS92aWRlby5tM3U4
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Configuration

Edit `wrangler.toml` to configure:

- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

## Environment Variables

You can set these in `wrangler.toml` or via Cloudflare dashboard:

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins. If not set, allows all origins. |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Health check |
| `/health` | Health check |
| `/?url=<encoded-url>` | Proxy the given URL |
| `/proxy/<encoded-url>` | Path-based proxy |
| `/b64/<base64-url>` | Base64 encoded URL proxy |
