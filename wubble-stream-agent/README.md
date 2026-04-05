# Wubble Stream sales agent (Python)

Headless participant for [GetStream Video](https://getstream.io/video/) that publishes bot audio into the same call the Angular demo joins.

## Setup

```bash
cd wubble-stream-agent
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `STREAM_API_KEY` | yes | From GetStream dashboard |
| `STREAM_API_SECRET` | yes | From GetStream dashboard |
| `CALL_ID` | yes | Call UUID (Nest `POST /sales-demo/session` creates it) |
| `BOT_USER_ID` | yes | Bot Stream user id (returned only to Nest; pass via spawn env — Nest already sets this) |
| `CALL_TYPE` | no | Default `default` |
| `WUBBLE_WS_URL` | no | If set, starts `WubbleAudioBridge` (see `wubble_bridge.py`) |
| `WUBBLE_API_KEY` | no | Sent as `Authorization: Bearer` when opening the WS |
| `PLACEHOLDER_TONE` | no | `true` (default): play a short tone after join to verify audio publish |

Nest normally spawns this process with the right env. To run manually after starting a session, copy `callId` and `botUserId` from Nest logs or temporarily log them from `StreamService`.

## Wubble integration

The bridge uses a **placeholder** JSON protocol over WebSocket. Replace it with Wubble’s real client when you have their SDK: keep `sales_system_prompt.md` as the instruction payload their session API expects.

## Disable auto-spawn

In `backend/.env` set `SALES_DEMO_SPAWN_AGENT=false` and start this script manually for debugging.
