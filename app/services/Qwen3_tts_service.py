import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / '.env')

ROOT_DIR = Path(__file__).parent.parent.parent
OUTPUT_DIR = ROOT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

LOCAL_TTS_URL = os.getenv("LOCAL_TTS_URL", "https://cotton-kitty-notebooks-integer.trycloudflare.com")

# voice_id는 호환성을 위해 인자로 받지만 로컬 서버에선 아직 미사용
def generate_voice_qwen(text, voice_id=None, emotion="joyful", speaker="Sohee"):
    payload = {
        "text": text,
        "language": "Korean",
        "speaker": speaker
    }

    try:
        response = requests.post(
            f"{LOCAL_TTS_URL}/tts",
            json=payload,
            timeout=60
        )

        if response.status_code == 200:
            final_filename = str(OUTPUT_DIR / f"{emotion}_result.wav")
            with open(final_filename, "wb") as f:
                f.write(response.content)
            print(f"✨ {emotion} 생성 완료: {final_filename}")
            return final_filename
        else:
            print(f"❌ 합성 실패: {response.status_code}, {response.text}")
            return None

    except requests.exceptions.RequestException as e:
        print(f"❌ 서버 연결 실패: {e}")
        return None

# enroll_voice는 나중에 로컬 보이스 클로닝 구현 시 사용 예정
def enroll_voice(audio_path):
    print("⚠️ enroll_voice: 현재 로컬 서버는 보이스 클로닝 미지원. voice_id 반환 생략.")
    return "local_default"

if __name__ == "__main__":
    generate_voice_qwen("어흥! 호랑이가 나타났다!", emotion="fear")
    generate_voice_qwen("와! 금도끼를 찾았어요!", emotion="joyful")
    generate_voice_qwen("나무꾼은 슬피 울었어요.", emotion="sad")
    generate_voice_qwen("옛날 옛날에 나무꾼이 살았어요.", emotion="calm")