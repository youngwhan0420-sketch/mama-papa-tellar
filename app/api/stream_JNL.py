from gtts import gTTS
from pydub import AudioSegment
import sounddevice as sd
import numpy as np
import json
import os

EMOTION_MAP = {
    "gentle": {"pitch": "normal", "speed": 0.95},
    "scary":  {"pitch": "low",    "speed": 0.9},
    "urgent": {"pitch": "high",   "speed": 1.3},
    "happy":  {"pitch": "high",   "speed": 1.1},
}

def apply_pitch(audio, pitch):
    if pitch == "high":
        return audio._spawn(audio.raw_data, overrides={"frame_rate": int(audio.frame_rate * 1.2)}).set_frame_rate(audio.frame_rate)
    elif pitch == "low":
        return audio._spawn(audio.raw_data, overrides={"frame_rate": int(audio.frame_rate * 0.85)}).set_frame_rate(audio.frame_rate)
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

def text_to_audio(text, emotion="gentle"):
    params = EMOTION_MAP.get(emotion, {"pitch": "normal", "speed": 1.0})
    gTTS(text=text, lang='ko').save("temp.mp3")
    audio = AudioSegment.from_mp3("temp.mp3")
    audio = apply_pitch(audio, params["pitch"])
    audio = apply_speed(audio, params["speed"])
    return audio

def play_story(story):
    print(f"\n[ {story['story_title']} 시작 ]\n")

    full_audio = text_to_audio(story['story_title'])

    for scene in story['scenes']:
        print(f"scene {scene['id']} | emotion: {scene['emotion']}")
        print(f"{scene['text']}\n")
        full_audio += text_to_audio(scene['text'], scene['emotion'])

    full_audio.export(f"{story['story_title']}.wav", format="wav")
    print(f"저장 완료: {story['story_title']}.wav")
    play_audio_sd(full_audio)

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def play_all_stories(json_folder="./data/story"):
    json_files = sorted([
        f for f in os.listdir(json_folder)
        if f.endswith('.json') and f != 'metadata.json'
    ])

    if not json_files:
        print("json 파일이 없어요!")
        return

    for filename in json_files:
        filepath = os.path.join(json_folder, filename)
        print(f"\n파일 로드: {filename}")
        story = load_json(filepath)
        play_story(story)

if __name__ == "__main__":
    play_all_stories("../../data/story")

