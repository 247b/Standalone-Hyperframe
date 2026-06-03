# HyperFrames Rendering Server

A Bun service that accepts JSON payloads, generates HyperFrames compositions, renders MP4 videos, and uploads completed outputs.

## Requirements

| Requirement | Notes |
| --- | --- |
| Bun | Runs the HTTP server and project scripts |
| Node/npm | Used only for npm script compatibility |
| ffmpeg / ffprobe | Required for probing, re-encoding, and background music |
| UploadThing token | Required only when completed videos should upload |

The service listens on port `3001` by default.

## Quickstart

```bash
bun install
bun run dev
```

Run on another port:

```bash
PORT=3002 bun run dev
```

Additional commands:

```bash
bun run check
bun run render
bun run publish
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP server port |
| `CORS_ORIGIN` | `*` | CORS origin |
| `UPLOADTHING_TOKEN` | none | UploadThing authentication |
| `HYPERFRAMES_VERSION` | `0.6.69` | HyperFrames render CLI version |
| `RENDER_QUALITY` | `standard` | Render quality passed to HyperFrames |
| `FFMPEG_PRESET` | `veryfast` | ffmpeg preset for video re-encoding |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Returns server status and job counts |
| `POST` | `/render` | Creates and runs a render job synchronously |
| `GET` | `/status/:jobId` | Returns public metadata for one job |
| `GET` | `/jobs` | Lists persisted jobs, newest first |
| `GET` | `/renders/:file` | Downloads a rendered MP4 from `renders/` |

## Payloads

The server accepts one JSON payload per `POST /render` request.

### Base Fields

| Field | Required | Description |
| --- | --- | --- |
| `type` | Yes | Must be `L1L2` or `L3L4` |
| `id` | Yes | Stable render/composition id |
| `intro` | Conditional | Optional intro video link |
| `outro` | Conditional | Optional outro video link |
| `titleCard` | Conditional | Optional title card object |
| `scenes` | Conditional | Optional scene array |
| `logo` | No | Optional logo image link |
| `bgMusic` | No | Optional background music audio link |

`type` and `id` alone do not produce a video. At least one conditional render input must also be present:

- `intro`
- `outro`
- `titleCard`
- `scenes`

`logo` and `bgMusic` can be added only when the payload has at least one conditional render input. They do not create a video by themselves.

### Types

| Type | Scene media | Scene audio |
| --- | --- | --- |
| `L1L2` | Image or video clip | Required per scene |
| `L3L4` | Video | Not required |

### Title Card

When `titleCard` is present, both fields are required:

| Field | Required | Description |
| --- | --- | --- |
| `titleCard.vidSrc` | Yes | Title card video link |
| `titleCard.titleText` | Yes | Text rendered over the title card |

### Scenes

Use `scenes` for scene arrays. `sections` is not accepted.

For `L1L2`, every scene requires:

| Field | Required | Description |
| --- | --- | --- |
| `type` | No | `img` by default, or `clip` for a video clip scene |
| `link` | Yes | Image or video clip URL |
| `audio` | Yes | Narration audio URL |
| `ost` | No | On-screen text |

For `L3L4`, every scene requires:

| Field | Required | Description |
| --- | --- | --- |
| `link` | Yes | Video URL |
| `ost` | No | On-screen text |

## Examples

- [L1L2 payload example](strategies/l1l2/payload.example.json)
- [L3L4 payload example](strategies/l3l4/payload.example.json)
