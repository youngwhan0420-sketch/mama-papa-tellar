import io
import os
import re
import json
import struct
import asyncio
import time
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydub import AudioSegment

from app.services.Qwen3_tts_service import generate_voice_qwen

router = APIRouter(prefix="/api/stream", tags=["Stream"])

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
STORY_DIR = DATA_DIR / "story"
FRONTEND_PUBLIC_DIR = BASE_DIR / "frontend" / "public"
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"

# 현재 장면 + 앞으로 2장면까지 동시에 TTS 준비
PREFETCH = 2


def replace_child_name(text: str, name: str) -> str:
    last = ord(name[-1])
    b = 0xAC00 <= last <= 0xD7A3 and (last - 0xAC00) % 28 != 0
    return text \
        .replace("{이름이가}", name + ("이가" if b else "가")) \
        .replace("{이름이는}", name + ("이는" if b else "는")) \
        .replace("{이름이를}", name + ("이를" if b else "를")) \
        .replace("{이름이와}", name + ("이와" if b else "와")) \
        .replace("{이름이의}", name + ("이의" if b else "의")) \
        .replace("{이름이}", name + ("이" if b else "")) \
        .replace("{이름}", name)


def normalize_image_path(raw_image):
    if not raw_image:
        return ""
    image_path = str(raw_image).strip()
    if image_path.startswith(("http://", "https://", "data:", "blob:")):
        return image_path
    if image_path.startswith("/"):
        return image_path
    return f"/{image_path}"


def public_image_exists(image_path):
    if not image_path:
        return False
    if image_path.startswith(("http://", "https://", "data:", "blob:")):
        return True
    relative_path = image_path.lstrip("/")
    return any(
        (base_dir / relative_path).exists()
        for base_dir in (FRONTEND_PUBLIC_DIR, FRONTEND_DIST_DIR)
    )


def get_scene_image_path(story_info, scene):
    for key in ("image", "image_path", "storyImage"):
        if scene.get(key):
            return normalize_image_path(scene.get(key))

    story_id = story_info.get("story_id", "")
    scene_id = scene.get("id")

    if story_id and scene_id is not None:
        auto_candidates = [
            f"/illusts/{story_id}/scene_{scene_id}.png",
            f"/illusts/{story_id}/scene_{scene_id}.jpg",
            f"/illusts/{story_id}/scene_{scene_id}.jpeg",
            f"/illusts/{story_id}/scene_{scene_id}.webp",
            f"/illusts/{story_id}/{scene_id}.png",
            f"/illusts/{story_id}/{scene_id}.jpg",
            f"/illusts/{story_id}/{scene_id}.jpeg",
            f"/illusts/{story_id}/{scene_id}.webp",
        ]
        for candidate in auto_candidates:
            if public_image_exists(candidate):
                return candidate

    return normalize_image_path(story_info.get("image_path", ""))


PAUSE_MS = {
    "calm": 900, "gentle": 800, "warm": 800, "neutral": 700,
    "happy": 600, "joyful": 500, "urgent": 400, "greedy": 600,
    "sad": 1000, "shocked": 900,
    "scary": 1200, "stern": 900,
    "hungry": 600, "painful": 800,
}


def clean_text_combined(text: str) -> str:
    text = re.sub(r"""['"`''""]""", "", text)
    text = text.replace("…", ".").replace("—", ",")
    text = re.sub(r"(\d)([가-힣])", r"\1 \2", text)
    text = re.sub(r"([가-힣])(\d)", r"\1 \2", text)
    text = re.sub(r"\.{2,}", ".", text)
    return text.strip()


def make_chunk(timeline_item: dict, audio_bytes: bytes) -> bytes:
    """
    청크 포맷 (8바이트 헤더):
    [4바이트: JSON 길이][4바이트: 오디오 길이][JSON 바이트][오디오 바이트]
    """
    json_bytes   = json.dumps(timeline_item, ensure_ascii=False).encode("utf-8")
    json_header  = struct.pack(">I", len(json_bytes))
    audio_header = struct.pack(">I", len(audio_bytes))
    return json_header + audio_header + json_bytes + audio_bytes


async def tts_scene(scene, voice_id: str) -> tuple:
    """장면 하나의 TTS 생성. 실패 시 temp_path=None 반환"""
    start         = time.time()
    clean         = clean_text_combined(scene["text"])
    scene_emotion = scene.get("emotion", "neutral")
    scene_id      = scene.get("id")

    temp_path = None
    for attempt in range(2):
        temp_path = await asyncio.to_thread(
            generate_voice_qwen,
            clean,
            voice_id=voice_id,
            emotion=scene_emotion,
            scene_id=scene_id,
        )
        if temp_path is not None:
            break
        if attempt == 0:
            await asyncio.sleep(1.5)

    elapsed = time.time() - start
    print(f"⏱️ 장면 {scene_id} TTS 완료: {elapsed:.1f}초")
    return scene, temp_path


@router.get("/play/{story_id}")
async def stream_story_audio_jms(
    story_id: str,
    voice_id: str = Query(None),
    narrator_voice_id: str = Query(None),
    character_voice_id: str = Query(None),
    child_name: str = Query(None),
    use_child_protagonist: str = Query("false"),
):
    narrator_vid  = narrator_voice_id or voice_id
    character_vid = character_voice_id or voice_id
    if not narrator_vid:
        raise HTTPException(status_code=400, detail="voice_id가 필요합니다.")

    try:
        with open(DATA_DIR / "metadata.json", "r", encoding="utf-8") as f:
            meta = json.load(f)
        story_info = next((s for s in meta["story"] if s["story_id"] == story_id), None)

        if not story_info:
            raise HTTPException(status_code=404, detail="동화를 찾을 수 없습니다.")

        with open(STORY_DIR / story_info["file_name"], "r", encoding="utf-8") as f:
            story_data = json.load(f)

        scenes = story_data.get("scenes", [])

        def get_voice(scene):
            speaker = scene.get("speaker", "narrator")
            return narrator_vid if speaker == "narrator" else character_vid

        async def scene_chunk_generator():
            current_time_ms = 0
            scene_index     = 0

            # 처음에 PREFETCH+1 개 장면 동시 TTS 시작
            task_queue = []
            for i in range(min(PREFETCH + 1, len(scenes))):
                task = asyncio.create_task(tts_scene(scenes[i], get_voice(scenes[i])))
                task_queue.append((i, task))

            next_to_start = PREFETCH + 1  # 다음에 시작할 장면 인덱스

            for i, scene in enumerate(scenes):
                # 현재 장면 task 꺼내기
                _, current_task = task_queue.pop(0)

                # 다음 프리페치 장면 시작
                if next_to_start < len(scenes):
                    task = asyncio.create_task(
                        tts_scene(scenes[next_to_start], get_voice(scenes[next_to_start]))
                    )
                    task_queue.append((next_to_start, task))
                    next_to_start += 1

                # 현재 장면 TTS 완료 대기
                scene, temp_path = await current_task

                if temp_path is None:
                    print(f"장면 {scene.get('id')} TTS 실패 — 건너뜀")
                    continue

                try:
                    scene_emotion          = scene.get("emotion", "neutral")
                    pause_duration         = PAUSE_MS.get(scene_emotion, 700)
                    scene_audio            = AudioSegment.from_file(temp_path)
                    scene_audio_with_pause = scene_audio + AudioSegment.silent(duration=pause_duration)

                    audio_buffer = io.BytesIO()
                    scene_audio_with_pause.export(audio_buffer, format="mp3", bitrate="128k")
                    audio_bytes  = audio_buffer.getvalue()

                    timeline_item = {
                        "scene_index":  scene_index,
                        "total_scenes": len(scenes),
                        "start_time":   current_time_ms / 1000.0,
                        "duration":     len(scene_audio_with_pause) / 1000.0,
                        "text":         scene["text"],
                        "emotion":      scene_emotion,
                        "speaker":      scene.get("speaker", "narrator"),
                        "type":         scene.get("type", "narration"),
                        "id":           scene.get("id"),
                        "storyImage":   story_info.get("image_path"),
                        "image":        get_scene_image_path(story_info, scene),
                    }

                    current_time_ms += len(scene_audio_with_pause)
                    scene_index     += 1

                    yield make_chunk(timeline_item, audio_bytes)

                except Exception as e:
                    print(f"장면 {scene.get('id')} 청크 생성 에러: {e}")
                    continue
                finally:
                    if temp_path and os.path.exists(temp_path):
                        os.remove(temp_path)

        return StreamingResponse(
            scene_chunk_generator(),
            media_type="application/octet-stream",
            headers={
                "X-Stream-Mode":  "scene-chunks",
                "X-Total-Scenes": str(len(scenes)),
                "Access-Control-Expose-Headers": "X-Stream-Mode, X-Total-Scenes",
            }
        )

    except Exception as e:
        print(f"서버 에러: {e}")
        raise HTTPException(status_code=500, detail="동화를 읽어주는 중에 문제가 생겼어요.")