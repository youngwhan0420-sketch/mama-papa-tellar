import io
import os
import re
import json
import asyncio
from urllib.parse import quote
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydub import AudioSegment

from app.services.Qwen3_tts_service import generate_voice_qwen

router = APIRouter(prefix="/api/stream_jms", tags=["Stream JMS"])

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
STORY_DIR = DATA_DIR / "story"

# story JSON emotion(영어) → Qwen3_tts_service emotion(한국어 4종)
EMOTION_MAP = {
    "calm":    "평온",
    "gentle":  "평온",
    "warm":    "평온",
    "neutral": "평온",
    "happy":   "기쁨",
    "joyful":  "기쁨",
    "urgent":  "기쁨",
    "greedy":  "공포",
    "sad":     "슬픔",
    "shocked": "슬픔",
    "scary":   "공포",
    "stern":   "공포",
}

# 감정별 장면 사이 여백 (ms)
PAUSE_MS = {
    "calm": 900, "gentle": 800, "warm": 800, "neutral": 700,
    "happy": 600, "joyful": 500, "urgent": 400, "greedy": 600,
    "sad": 1000, "shocked": 900,
    "scary": 1200, "stern": 900,
}

# 캐릭터별 목소리 지시 프리픽스 (부모 한 명이 모든 역할 담당)
SPEAKER_PREFIX = {
    "narrator":   "",
    "tiger":      "(낮고 거친 호랑이 목소리로) ",
    "brother":    "(어린 남자아이 목소리로) ",
    "sister":     "(어린 여자아이 목소리로) ",
    "king":       "(위엄 있고 낮은 목소리로) ",
    "lover":      "(그리움에 젖은 목소리로) ",
    "deer":       "(겁에 질린 동물 목소리로) ",
    "fairy":      "(맑고 청아한 목소리로) ",
    "woodcutter": "(수줍고 진지한 목소리로) ",
    "god":        "(인자하고 깊은 목소리로) ",
    "turtle":     "(느리고 진지한 목소리로) ",
    "rabbit":     "(재빠르고 영리한 목소리로) ",
}


def clean_text_combined(text: str) -> str:
    text = re.sub(r"""['"`''""]""", "", text)
    text = text.replace("…", ".").replace("—", ",")
    text = re.sub(r"(\d)([가-힣])", r"\1 \2", text)
    text = re.sub(r"([가-힣])(\d)", r"\1 \2", text)
    text = re.sub(r"\.{2,}", ".", text)
    return text.strip()


@router.get("/play/{story_id}")
async def stream_story_audio_jms(
    story_id: str,
    voice_id: str = Query(..., description="Qwen3 등록 부모님 목소리 ID")
):
    try:
        # 1. 동화 데이터 로드
        with open(DATA_DIR / "metadata.json", "r", encoding="utf-8") as f:
            meta = json.load(f)
        story_info = next((s for s in meta["story"] if s["story_id"] == story_id), None)

        if not story_info:
            raise HTTPException(status_code=404, detail="동화를 찾을 수 없습니다.")

        with open(STORY_DIR / story_info["file_name"], "r", encoding="utf-8") as f:
            story_data = json.load(f)

        # 2. 오디오 합성 및 타임라인 계산
        combined_audio = AudioSegment.empty()
        timeline = []
        current_time_ms = 0

        for scene in story_data.get("scenes", []):
            scene_emotion = scene.get("emotion", "neutral")
            speaker       = scene.get("speaker", "narrator")
            kr_emotion    = EMOTION_MAP.get(scene_emotion, "평온")

            # 캐릭터 프리픽스 + 정제 텍스트 조합 → Qwen3에 전달
            clean     = clean_text_combined(scene["text"])
            full_text = SPEAKER_PREFIX.get(speaker, "") + clean

            temp_path = None
            try:
                # asyncio.to_thread: blocking 함수를 별도 스레드에서 실행 (이벤트 루프 블로킹 방지)
                # 재시도 1회: DashScope API 일시적 오류 대응
                for attempt in range(2):
                    temp_path = await asyncio.to_thread(
                        generate_voice_qwen, full_text, voice_id=voice_id, emotion=kr_emotion
                    )
                    if temp_path is not None:
                        break
                    if attempt == 0:
                        await asyncio.sleep(1.5)

                if temp_path is None:
                    raise Exception("Qwen3 TTS 반환값 없음 (재시도 후에도 실패)")

                # TTS 성공 후 타임라인 기록
                timeline.append({
                    "scene_index": len(timeline),
                    "start_time":  current_time_ms / 1000.0,
                    "text":        scene["text"],
                    "emotion":     scene_emotion,
                    "speaker":     speaker,
                    "type":        scene.get("type", "narration"),
                    "id":          scene.get("id"),
                    "storyImage":  story_info.get("image_path")
                })

                scene_audio = AudioSegment.from_file(temp_path)
                combined_audio += scene_audio
                current_time_ms += len(scene_audio)

                pause_duration = PAUSE_MS.get(scene_emotion, 700)
                combined_audio += AudioSegment.silent(duration=pause_duration)
                current_time_ms += pause_duration

            except Exception as e:
                print(f"장면 {scene.get('id')} 합성 에러: {e}")
                continue
            finally:
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)

        if len(combined_audio) == 0:
            raise HTTPException(status_code=500, detail="음성 생성에 실패했습니다.")

        # 3. 메모리 스트리밍
        audio_buffer = io.BytesIO()
        combined_audio.export(audio_buffer, format="mp3", bitrate="128k")
        audio_buffer.seek(0)

        # 4. 타임라인 헤더 전달
        timeline_json      = json.dumps(timeline, ensure_ascii=False)
        safe_timeline_json = quote(timeline_json)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename={story_id}.mp3",
                "X-Story-Timeline": safe_timeline_json,
                "Access-Control-Expose-Headers": "X-Story-Timeline"
            }
        )

    except Exception as e:
        print(f"서버 에러: {e}")
        raise HTTPException(status_code=500, detail="동화를 읽어주는 중에 문제가 생겼어요.")
