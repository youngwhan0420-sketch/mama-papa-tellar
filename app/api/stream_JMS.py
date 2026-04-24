"""
데이터 정제 및 오디오 인터페이스

설치: pip install gtts playsound==1.2.2

실행: python app/api/stream_JMS.py
"""

import json
import re
import time
import tempfile
import os
from pathlib import Path

from gtts import gTTS
from playsound import playsound


# data/ 폴더 경로 (이 파일 기준 프로젝트 루트 → data/)
DATA_DIR = Path(__file__).parent.parent.parent / "data"
STORY_DIR = DATA_DIR / "story"


# 감정별 속도 / 일시정지 설정
EMOTION_PARAMS = {
    "gentle": {"speed": 0.90, "slow": True,  "pause_after": 0.8},
    "scary":  {"speed": 0.80, "slow": True,  "pause_after": 1.2},
    "urgent": {"speed": 1.25, "slow": False, "pause_after": 0.5},
    "happy":  {"speed": 1.15, "slow": False, "pause_after": 0.6},
    "sad":    {"speed": 0.80, "slow": True,  "pause_after": 1.0},
    "neutral":{"speed": 1.00, "slow": False, "pause_after": 0.7},
}


# 동화 목록 불러오기
def load_metadata():
    meta_path = DATA_DIR / "metadata.json"
    with open(meta_path, "r", encoding="utf-8") as f:
        return json.load(f)


# 동화 JSON 불러오기
def load_story(filename):
    path = STORY_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# 텍스트 정제
def clean_text(text):
    text = text.replace("…", ".").replace("—", ",")
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


# TTS 생성 → mp3 파일 경로 반환

#  gTTS로 한국어 음성 생성 후 임시 구현된 상태
def tts_generate(text, params):
    tts = gTTS(text=text, lang="ko", slow=params["slow"])
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name
    tts.save(tmp_path)
    return tmp_path

''' ElevenLabs (elevenlabs.py 완성 후 사용)

def tts_generate(text, params):
     from app.services.elevenlabs import generate_audio
     mp3_bytes = generate_audio(
         text=text,
         stability=params["stability"], # 감정 파라미터
         similarity_boost=params["similarity_boost"],
         style=params["style"],
         speed=params["speed"],
     )
     with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
         tmp.write(mp3_bytes)
         tmp_path = tmp.name
     return tmp_path

'''

# 5. 오디오 재생 (mp3 → playsound)
#    gTTS, ElevenLabs 모두 mp3로 반환하므로 공통 사용
def play_audio(mp3_path):
    playsound(mp3_path)
    os.unlink(mp3_path)

# 6. 동화 목록 출력
def print_story_list():
    meta = load_metadata()
    print("\n사용 가능한 동화 목록:")
    for story in meta["story"]:
        print(f"  [{story['story_id']}] {story['title']} ({story['duration']}) - {story['file_name']}")
    print()


# 7. 전체 동화 실행
def run_story(filename):
    story  = load_story(filename)
    title  = story["story_title"]
    scenes = story["scenes"]

    print(f"\n{title} 시작 (총 {len(scenes)}장면)\n")

    for scene in scenes:
        text    = clean_text(scene["text"])
        emotion = scene["emotion"]
        params  = EMOTION_PARAMS.get(emotion, EMOTION_PARAMS["neutral"])

        print(f"장면 {scene['id']} [{emotion}]")
        print(f"  {text}\n")

        mp3_path = tts_generate(text, params)
        play_audio(mp3_path)
        time.sleep(params["pause_after"])

    print("끝!")


if __name__ == "__main__":
    # 동화 목록 출력 후 실행
    print_story_list()
    run_story("cowherd_and_weaver.json")