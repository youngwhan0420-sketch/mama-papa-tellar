import io
import os
import requests
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydub import AudioSegment
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / '.env')

router = APIRouter(prefix="/api/voice", tags=["Voice"])

LOCAL_TTS_URL = os.getenv("LOCAL_TTS_URL", "")

# 부모가 녹음 시 읽는 스크립트 전문 (5문장 이어붙임 → ref_text로 사용)
REF_TEXT = (
    "안녕, 사랑하는 우리 아가. 오늘 하루는 어땠어? 밥도 꼭꼭 씹어 잘 먹고, 친구들이랑 신나게 뛰어놀았니? "
    "우와! 저기 밤하늘을 좀 봐! 반짝반짝 빛나는 별똥별이 떨어지고 있어! 정말 신기하고 예쁘지 않니? "
    "우리 아가는 나중에 커서 어떤 사람이 되고 싶어? 하늘을 훨훨 나는 멋진 우주 비행사? 아니면 동물 친구들과 이야기하는 마법사? "
    "자, 이제 밤이 깊었어. 따뜻한 이불속으로 쏙 들어가서 두 눈을 꼭 감아보자. 숨을 크게 들이마시고, 천천히 내쉬고... "
    "내가 세상에서 제일 재미있고 포근한 꿈나라 이야기를 들려줄게. 오늘도 정말 사랑해, 좋은 꿈 꿔."
)


@router.get("/scriptLines")
async def get_scripts():
    """부모님이 목소리 등록(녹음)을 위해 화면을 보며 읽을 샘플 스크립트예요."""
    return {
        "scripts": [
            { "emotion": "(다정하고 차분하게)", "text": "안녕, 사랑하는 우리 아가. 오늘 하루는 어땠어? 밥도 꼭꼭 씹어 잘 먹고, 친구들이랑 신나게 뛰어놀았니?" },
            { "emotion": "(조금 놀라고 신난 목소리로)", "text": "우와! 저기 밤하늘을 좀 봐! 반짝반짝 빛나는 별똥별이 떨어지고 있어! 정말 신기하고 예쁘지 않니?" },
            { "emotion": "(궁금해하며 묻듯이)", "text": "우리 아가는 나중에 커서 어떤 사람이 되고 싶어? 하늘을 훨훨 나는 멋진 우주 비행사? 아니면 동물 친구들과 이야기하는 마법사?" },
            { "emotion": "(작고 부드럽게 속삭이듯)", "text": "자, 이제 밤이 깊었어. 따뜻한 이불속으로 쏙 들어가서 두 눈을 꼭 감아보자. 숨을 크게 들이마시고, 천천히 내쉬고..." },
            { "emotion": "(사랑을 듬뿍 담아서)", "text": "내가 세상에서 제일 재미있고 포근한 꿈나라 이야기를 들려줄게. 오늘도 정말 사랑해, 좋은 꿈 꿔." }
        ]
    }


@router.post("/register")
async def register_voice(file: UploadFile = File(...)):
    """
    부모님 목소리를 RTX PC의 /register로 전송하고,
    RTX PC가 반환한 파일경로(voice_id)를 그대로 클라이언트에 전달해요.
    ref_text(스크립트 전문)를 함께 전송해서 RTX PC에 저장해요.
    """
    if not LOCAL_TTS_URL:
        raise HTTPException(status_code=500, detail=".env에 LOCAL_TTS_URL이 설정되지 않았어요.")

    try:
        audio_content = await file.read()

        # 어떤 포맷이든 16kHz 단일채널 WAV로 변환 (클로닝 품질 최적화)
        try:
            input_buffer = io.BytesIO(audio_content)
            audio_segment = AudioSegment.from_file(input_buffer)
            audio_segment = audio_segment.set_frame_rate(16000).set_channels(1)
            output_buffer = io.BytesIO()
            audio_segment.export(output_buffer, format="wav")
            wav_bytes = output_buffer.getvalue()
        except Exception as e:
            raise ValueError(f"오디오 변환 실패: {e}")

        # RTX PC /register로 전송 (파일 + ref_text)
        response = requests.post(
            f"{LOCAL_TTS_URL}/register",
            files={"file": ("voice.wav", wav_bytes, "audio/wav")},
            data={"ref_text": REF_TEXT},
            timeout=30,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"RTX PC 등록 실패: {response.status_code} {response.text}"
            )

        result = response.json()

        return {
            "status": "success",
            "voice_id": result["voice_id"],  # RTX PC 파일경로 그대로 반환
            "message": "목소리를 소중히 저장했어요!"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))