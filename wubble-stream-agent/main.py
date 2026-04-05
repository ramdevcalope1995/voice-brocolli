"""
Join a GetStream Video call as the sales bot and publish audio.

Environment (set by Nest or manually):
  STREAM_API_KEY, STREAM_API_SECRET — GetStream app credentials
  CALL_TYPE — default: default
  CALL_ID — UUID of the call (created by Nest)
  BOT_USER_ID — Stream user id for the bot

Optional:
  WUBBLE_WS_URL — if set, start WubbleAudioBridge (see wubble_bridge.py)
  PLACEHOLDER_TONE — if "true", play a short tone after join (audible sanity check)
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from getstream.stream import AsyncStream
from getstream.video import rtc
from getstream.video.rtc import audio_track

from wubble_bridge import WubbleAudioBridge, play_placeholder_tone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("wubble-stream-agent")


def _env(name: str, default: str | None = None) -> str:
    v = os.environ.get(name, default or "")
    if not v and default is None:
        logger.error("Missing required env %s", name)
        sys.exit(1)
    return v


async def run() -> None:
    api_key = _env("STREAM_API_KEY")
    api_secret = _env("STREAM_API_SECRET")
    call_type = os.environ.get("CALL_TYPE", "default")
    call_id = _env("CALL_ID")
    bot_user_id = _env("BOT_USER_ID")

    placeholder = os.environ.get("PLACEHOLDER_TONE", "true").lower() == "true"

    client = AsyncStream(api_key=api_key, api_secret=api_secret)
    bridge = WubbleAudioBridge.from_env()
    output = audio_track.AudioStreamTrack(framerate=16000)

    pump_task: asyncio.Task | None = None

    try:
        call = client.video.call(call_type, call_id)
        cm = await rtc.join(call, user_id=bot_user_id, create=False)
        async with cm as conn:
            await conn.add_tracks(audio=output)
            logger.info("Bot joined call %s:%s as %s", call_type, call_id, bot_user_id)

            if placeholder:
                await play_placeholder_tone(output)

            if bridge:
                await bridge.start()

                async def pump_wubble_out() -> None:
                    async for pcm in bridge.iter_output_pcm():
                        output.write(pcm)

                pump_task = asyncio.create_task(pump_wubble_out())

                @conn.on("audio")
                async def on_audio(pcm_data, user):  # noqa: F811
                    uid = getattr(user, "user_id", None) or getattr(
                        user, "id", None
                    )
                    if uid and uid == bot_user_id:
                        return
                    await bridge.enqueue_user_pcm(pcm_data)

            await conn.wait()
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Agent failed")
        raise
    finally:
        if bridge:
            await bridge.stop()
        if pump_task:
            pump_task.cancel()
            try:
                await pump_task
            except asyncio.CancelledError:
                pass
        await client.aclose()


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
