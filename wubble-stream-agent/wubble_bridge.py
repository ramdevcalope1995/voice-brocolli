"""
Pluggable bridge between GetStream call PCM and Wubble realtime voice.

When WUBBLE_WS_URL is set, maintains one WebSocket and exchanges JSON messages.
Adjust message shapes to match Wubble's real API once you have their SDK docs.

Outbound (agent → you): {"type": "agent_pcm", "pcm_s16le_b64": "...", "sample_rate": 16000}
Inbound (you → server): {"type": "user_pcm", "pcm_s16le_b64": "...", "sample_rate": 16000}
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np

from getstream.video.rtc.track_util import PcmData

logger = logging.getLogger(__name__)


def load_system_prompt() -> str:
    path = Path(__file__).resolve().parent / "sales_system_prompt.md"
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return "You are a helpful Wubble AI sales assistant."


class WubbleAudioBridge:
    def __init__(
        self,
        *,
        ws_url: str,
        api_key: str,
        system_prompt: str,
    ) -> None:
        self._ws_url = ws_url.strip()
        self._api_key = api_key
        self._system_prompt = system_prompt
        self._in_queue: asyncio.Queue[Optional[PcmData]] = asyncio.Queue()
        self._out_queue: asyncio.Queue[Optional[PcmData]] = asyncio.Queue()
        self._runner: Optional[asyncio.Task] = None
        self._running = False

    @classmethod
    def from_env(cls) -> Optional[WubbleAudioBridge]:
        ws_url = os.environ.get("WUBBLE_WS_URL", "").strip()
        if not ws_url:
            return None
        api_key = os.environ.get("WUBBLE_API_KEY", "").strip()
        return cls(
            ws_url=ws_url,
            api_key=api_key,
            system_prompt=load_system_prompt(),
        )

    async def start(self) -> None:
        self._running = True
        self._runner = asyncio.create_task(self._run_forever(), name="wubble-bridge")

    async def stop(self) -> None:
        self._running = False
        await self._in_queue.put(None)
        if self._runner:
            self._runner.cancel()
            try:
                await self._runner
            except asyncio.CancelledError:
                pass
            self._runner = None
        await self._out_queue.put(None)

    async def enqueue_user_pcm(self, pcm: PcmData) -> None:
        if not self._running:
            return
        await self._in_queue.put(pcm)

    async def iter_output_pcm(self):
        while True:
            item = await self._out_queue.get()
            if item is None:
                break
            yield item

    async def _run_forever(self) -> None:
        try:
            import websockets
        except ImportError:
            logger.error("Install websockets to use WUBBLE_WS_URL")
            return

        backoff = 1.0
        while self._running:
            try:
                headers = []
                if self._api_key:
                    headers.append(("Authorization", f"Bearer {self._api_key}"))

                async with websockets.connect(
                    self._ws_url,
                    additional_headers=headers,
                    max_size=None,
                ) as ws:
                    await ws.send(
                        json.dumps(
                            {
                                "type": "session_init",
                                "role": "system",
                                "text": self._system_prompt,
                            }
                        )
                    )
                    backoff = 1.0
                    send_task = asyncio.create_task(self._pump_send(ws))
                    try:
                        async for raw in ws:
                            if not self._running:
                                break
                            try:
                                msg = json.loads(raw)
                            except json.JSONDecodeError:
                                continue
                            if msg.get("type") != "agent_pcm":
                                continue
                            b64 = msg.get("pcm_s16le_b64")
                            if not b64:
                                continue
                            sr = int(msg.get("sample_rate", 16000))
                            samples = np.frombuffer(
                                base64.b64decode(b64), dtype=np.int16
                            )
                            await self._out_queue.put(
                                PcmData(sr, "s16", samples=samples, channels=1)
                            )
                    finally:
                        send_task.cancel()
                        try:
                            await send_task
                        except asyncio.CancelledError:
                            pass
            except Exception as e:
                logger.warning("Wubble WS disconnected: %s — retry in %ss", e, backoff)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)

    async def _pump_send(self, ws) -> None:
        while self._running:
            pcm = await self._in_queue.get()
            if pcm is None:
                break
            if pcm.samples is None:
                continue
            payload = {
                "type": "user_pcm",
                "sample_rate": pcm.sample_rate,
                "pcm_s16le_b64": base64.b64encode(pcm.samples.tobytes()).decode(
                    "ascii"
                ),
            }
            try:
                await ws.send(json.dumps(payload))
            except Exception as e:
                logger.debug("send user_pcm failed: %s", e)
                break


async def play_placeholder_tone(track, *, sample_rate: int = 16000) -> None:
    """Short tone so demos without Wubble still verify outbound audio path."""
    t = np.linspace(0, 0.35, int(0.35 * sample_rate), dtype=np.float32)
    wave = (0.12 * 32767 * np.sin(2 * np.pi * 440 * t)).astype(np.int16)
    pcm = PcmData(sample_rate, "s16", samples=wave, channels=1)
    track.write(pcm)
