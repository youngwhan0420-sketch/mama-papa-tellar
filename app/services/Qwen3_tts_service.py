import os
import uuid
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / '.env')

ROOT_DIR = Path(__file__).parent.parent.parent
OUTPUT_DIR = ROOT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

LOCAL_TTS_URL = os.getenv("LOCAL_TTS_URL", "")


def generate_voice_qwen(text: str, voice_id: str = None, emotion: str = "joyful", speaker: str = "Sohee", scene_id=None):
    """
    RTX PC /tts를 호출해서 부모 목소리 클로닝 TTS를 생성해요.

    voice_id: /api/voice/register가 반환한 RTX PC 내 파일경로
              (예: /home/ks/voices/parent_44fb939d.wav)
    scene_id: 동시 요청 시 파일 덮어쓰기 방지용 고유 ID
    """
    if not LOCAL_TTS_URL:
        print("❌ LOCAL_TTS_URL이 설정되지 않았어요.")
        return None

    if not voice_id:
        print("❌ voice_id(부모 목소리 경로)가 없어요.")
        return None

    payload = {
        "text": text,
        "language": "Korean",
        "ref_audio_path": voice_id,
    }

    try:
        response = requests.post(
            f"{LOCAL_TTS_URL}/tts",
            json=payload,
            timeout=120,
        )

        if response.status_code == 200:
            # scene_id 있으면 scene_1.wav, 없으면 emotion_result.wav
            suffix = f"scene_{scene_id}" if scene_id is not None else f"{emotion}_result"
            final_filename = str(OUTPUT_DIR / f"{suffix}.wav")
            with open(final_filename, "wb") as f:
                f.write(response.content)
            print(f"✨ {suffix} 생성 완료: {final_filename}")
            return final_filename
        else:
            print(f"❌ 합성 실패: {response.status_code}, {response.text}")
            return None

    except requests.exceptions.RequestException as e:
        print(f"❌ 서버 연결 실패: {e}")
        return None


def enroll_voice(audio_path: str) -> str:
    print("⚠️ enroll_voice: 로컬 서버는 /register 엔드포인트를 사용해요. voice_qwen.py의 /register API를 이용해 주세요.")
    return "local_default"


if __name__ == "__main__":
    TEST_VOICE_ID = "/home/ks/voices/parent_44fb939d.wav"  # 실제 경로로 변경
    generate_voice_qwen("어흥! 호랑이가 나타났다!", voice_id=TEST_VOICE_ID, emotion="fear",   scene_id=1)
    generate_voice_qwen("와! 금도끼를 찾았어요!",   voice_id=TEST_VOICE_ID, emotion="joyful", scene_id=2)
    generate_voice_qwen("나무꾼은 슬피 울었어요.",   voice_id=TEST_VOICE_ID, emotion="sad",    scene_id=3)
    generate_voice_qwen("옛날 옛날에 나무꾼이 살았어요.", voice_id=TEST_VOICE_ID, emotion="calm", scene_id=4)