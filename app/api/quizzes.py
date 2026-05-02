import io
import os
import json
import random
import asyncio
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydub import AudioSegment

from app.services.Qwen3_tts_service import generate_voice_qwen

router = APIRouter(prefix="/api/quizzes", tags=["Quiz"])

BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
QUIZ_JSON_PATH = DATA_DIR / "quizzes.json"

@router.get("")
async def get_all_quizzes():
    """모든 퀴즈 데이터를 반환합니다 (프론트엔드에서 보기 생성용)"""
    try:
        if not QUIZ_JSON_PATH.exists():
            raise HTTPException(status_code=404, detail="퀴즈 데이터를 찾을 수 없어요.")
        
        with open(QUIZ_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail="퀴즈를 불러오는 중에 문제가 생겼어요.")

@router.get("/play")
async def stream_quiz_audio(
    quiz_id: int = Query(..., description="퀴즈 식별자"),
    voice_id: str = Query(..., description="부모님 목소리 ID")
):
    """특정 퀴즈의 부모님 힌트 음성을 생성하여 스트리밍합니다."""
    try:
        # 1. 퀴즈 데이터 로드
        with open(QUIZ_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            quiz = next((q for q in data["quizzes"] if q["id"] == quiz_id), None)

        if not quiz:
            raise HTTPException(status_code=404, detail="해당 퀴즈를 찾을 수 없어요.")

        # 2. TTS 음성 합성 (부모님 목소리)
        # 퀴즈는 보통 밝고 다정한 톤이므로 'happy' 감정을 기본으로 제안합니다.
        voice_script = quiz["voiceScript"]
        temp_path = None
        
        # 이벤트 루프 블로킹 방지를 위한 스레드 실행
        temp_path = await asyncio.to_thread(
            generate_voice_qwen, voice_script, voice_id=voice_id, emotion="happy"
        )

        if not temp_path or not os.path.exists(temp_path):
            raise Exception("Qwen3 TTS 음성 생성 실패")

        # 3. 오디오 처리 (약간의 앞뒤 여백 추가로 여유로운 느낌 전달)
        scene_audio = AudioSegment.from_file(temp_path)
        combined_audio = AudioSegment.silent(duration=500) + scene_audio + AudioSegment.silent(duration=500)

        # 4. 메모리 스트리밍
        audio_buffer = io.BytesIO()
        combined_audio.export(audio_buffer, format="mp3", bitrate="128k")
        audio_buffer.seek(0)

        # 사용한 임시 파일 삭제
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=quiz_{quiz_id}.mp3"
            }
        )

    except Exception as e:
        print(f"퀴즈 음성 스트리밍 에러: {e}")
        raise HTTPException(status_code=500, detail="부모님 목소리를 만드는 데 실패했어요.")