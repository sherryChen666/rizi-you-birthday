"""Render an original quiet piano loop from CC0 VCSL Kawai samples."""
from pathlib import Path
import numpy as np
from scipy.io import wavfile
import subprocess
from urllib.request import urlretrieve

ROOT = Path(__file__).parent
SR = 44100
BEAT = 60 / 68
samples = {}
sample_dir = ROOT / 'samples'
sample_dir.mkdir(exist_ok=True)
sample_url = 'https://raw.githubusercontent.com/sgossner/VCSL/master/Chordophones/Zithers/Grand%20Piano,%20Kawai/Sustains/GPiano_sus_{}_v2_rr1_Player.wav'
for midi, name in [(48, 'C3'), (52, 'E3'), (60, 'C4'), (64, 'E4'), (72, 'C5')]:
    sample_path = sample_dir / f'{name}.wav'
    if not sample_path.exists():
        urlretrieve(sample_url.format(name), sample_path)
    rate, data = wavfile.read(sample_path)
    assert rate == SR
    samples[midi] = data.astype(np.float32) / 32768

total_beats = 32
mix = np.zeros((int((total_beats * BEAT + 2.4) * SR), 2), dtype=np.float32)

def play(midi, beat, length=1.6, volume=.16):
    nearest = min(samples, key=lambda pitch: abs(pitch - midi))
    source = samples[nearest]
    rate = 2 ** ((midi - nearest) / 12)
    count = min(int((length + .6) * SR), int(len(source) / rate) - 2)
    if count <= 0:
        return
    positions = np.arange(count) * rate
    low = positions.astype(np.int32)
    fraction = (positions - low).astype(np.float32)[:, None]
    sound = source[low] * (1 - fraction) + source[low + 1] * fraction
    envelope = np.ones(count, dtype=np.float32)
    attack = min(count, int(.012 * SR))
    envelope[:attack] = np.linspace(0, 1, attack)
    release_start = min(count, int(length * SR))
    envelope[release_start:] = np.linspace(1, 0, count - release_start) ** 1.6
    start = int(beat * BEAT * SR)
    end = min(len(mix), start + count)
    mix[start:end] += sound[:end-start] * envelope[:end-start, None] * volume

# Eight bars: a small original theme, played softly and with space between notes.
bars = [
    ([48, 55, 64, 71], [(76,.25),(74,1.55),(72,2.65)]),
    ([55, 62, 71, 76], [(71,.35),(74,1.7),(67,2.8)]),
    ([57, 64, 67, 72], [(72,.25),(71,1.6),(69,2.75)]),
    ([53, 60, 64, 69], [(69,.35),(67,1.55),(64,2.75)]),
    ([52, 55, 60, 64], [(67,.25),(72,1.45),(76,2.6)]),
    ([50, 57, 60, 65], [(65,.25),(69,1.55),(72,2.7)]),
    ([55, 62, 65, 72], [(74,.25),(72,1.45),(71,2.65)]),
    ([48, 55, 64, 72], [(67,.35),(64,1.55),(72,2.55)]),
]
for bar_index, (chord, melody) in enumerate(bars):
    offset = bar_index * 4
    play(chord[0], offset, 2.4, .19)
    play(chord[1], offset + 1.03, 1.6, .105)
    play(chord[2], offset + 2.04, 1.7, .105)
    play(chord[3], offset + 3.03, 1.4, .09)
    for index, (pitch, at) in enumerate(melody):
        play(pitch, offset + at, 1.3 if index < 2 else 1.65, .21 if index == 0 else .19)

# A short room reflection makes the notes less dry without obscuring the melody.
dry = mix.copy()
for delay, level in [(.11,.085),(.27,.065),(.49,.045)]:
    shift = int(delay * SR)
    mix[shift:] += dry[:-shift, ::-1] * level
mix *= .62 / max(np.max(np.abs(mix)), .001)
tail = int(.65 * SR)
mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
wav_path = ROOT / 'piano-theme.wav'
wavfile.write(wav_path, SR, (mix * 32767).astype(np.int16))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav_path),'-codec:a','libmp3lame','-b:a','128k',str(ROOT/'piano-theme.mp3')],check=True)
print(ROOT/'piano-theme.mp3')
