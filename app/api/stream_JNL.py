from gtts import gTTS
from pydub import AudioSegment
import sounddevice as sd
import numpy as np
import json
import os
import re
from services.tts_service import generate_voice

def clean_tts_text(text):
    return re.sub(r"""['"`‘’“”]""", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def apply_pitch(audio, pitch):
    if pitch == "high":
        return audio._spawn(audio.raw_data, overrides={"frame_rate": int(audio.frame_rate * 1.2)}).set_frame_rate(audio.frame_rate)
    elif pitch == "low":
        return audio._spawn(audio.raw_data, overrides={"frame_rate": int(audio.frame_rate * 0.85)}).set_frame_rate(audio.frame_rate)
    elif pitch == "normal":
        return audio
    else:
        print(f"알 수 없는 pitch 값: {pitch}, normal로 처리합니다.")
        return audio

def apply_speed(audio, speed):
    if speed != 1.0:
        return audio._spawn(audio.raw_data, overrides={"frame_rate": int(audio.frame_rate * speed)}).set_frame_rate(audio.frame_rate)
    return audio

def play_audio_sd(audio):
    samples = np.array(audio.get_array_of_samples()).astype(np.float32)
    samples /= np.iinfo(audio.array_type).max
    if audio.channels == 2:
        samples = samples.reshape((-1, 2))
    sd.play(samples, samplerate=audio.frame_rate)
    sd.wait()

def text_to_audio(text, pitch="normal", speed=1.0, emotion="평온"):
    text = clean_tts_text(text)

    generate_voice(text, emotion=emotion)
    audio = AudioSegment.from_mp3(f"파일명_{emotion}.mp3")
    audio = apply_pitch(audio, pitch)
    audio = apply_speed(audio, speed)
    return audio

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def play_story(story):
    print(f"\n[ {story['story_title']} 시작 ]\n")

    full_audio = text_to_audio(story['story_title'])

    for scene in story['scenes']:
        print(f"scene {scene['id']} | emotion: {scene['emotion']} | pitch: {scene['pitch']} | speed: {scene['speed']}")
        print(f"{scene['text']}\n")
        full_audio += AudioSegment.silent(duration=500)
        full_audio += text_to_audio(scene['text'], scene['pitch'], scene['speed'])

    full_audio.export(f"{story['story_title']}.wav", format="wav")
    print(f"저장 완료: {story['story_title']}.wav")
    play_audio_sd(full_audio)

    if os.path.exists("temp.mp3"):
        os.remove("temp.mp3")


def play_selected_story(filename, json_folder="../../data/story"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(base_dir, json_folder, filename)

    if not os.path.exists(filepath):
        print(f"파일을 찾을 수 없어요: {filepath}")
        return

    story = load_json(filepath)
    play_story(story)

def load_metadata(metadata_path):
    with open(metadata_path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_story_file_by_id(metadata, story_id):
    for story in metadata["story"]:
        if story["story_id"] == story_id:
            return story["file_name"]

    return None

def play_story_by_id(story_id, data_folder="../../data"):
    base_dir = os.path.dirname(os.path.abspath(__file__))

    metadata_path = os.path.join(base_dir, data_folder, "metadata.json")
    metadata = load_metadata(metadata_path)

    file_name = find_story_file_by_id(metadata, story_id)

    if file_name is None:
        print(f"story_id를 찾을 수 없어요: {story_id}")
        return

    play_selected_story(file_name, json_folder=os.path.join(data_folder, "story"))            


if __name__ == "__main__":
    play_story_by_id("ST_001")