import os,json,hashlib
from pathlib import Path
import soundfile as sf
from kokoro_onnx import Kokoro

out=Path('/tmp/urai-the-unknown-r8')
segments=[
"What if one million number experiments could teach us something about math's biggest mysteries? Welcome to The Unknown, from URAI Labs and Chalk and Cheese.",
"Start with Collatz. If a number is even, halve it. If it is odd, triple it and add one. Repeat.",
"Take twenty seven. That innocent looking number needs one hundred and eleven steps before finally reaching one.",
"Our software checked every starting number from one through one million. Each reached one. But that is a finite result, not a proof.",
"The longest path in our tested range started at eight hundred thirty seven thousand seven hundred ninety nine. It took five hundred twenty four steps.",
"Goldbach asks whether every even number greater than two is a sum of two primes. We checked four hundred ninety nine thousand nine hundred ninety nine cases, with no counterexample found.",
"Twin primes are pairs of primes exactly two apart. We counted eight thousand one hundred sixty nine such pairs through one million. Whether there are infinitely many is still unknown.",
"Computers can check enormous lists, but checking one million cases is not the same as proving a statement about infinitely many numbers.",
"Next, the Riemann Hypothesis. We'll examine formal proof work published by Levent Alpoge with Claude, and how the Lean community checked its validity. That work is not ours.",
"We're Chalk and Cheese, presented by URAI Labs. Explore. Question. Verify. Discover. And always keep the receipts."
]
os.environ['OMP_NUM_THREADS']='2'
import onnxruntime as ort
so=ort.SessionOptions()
so.intra_op_num_threads=2
so.inter_op_num_threads=1
sess=ort.InferenceSession('/tmp/urai-the-unknown-r8/tts/kokoro-v1.0.int8.onnx',sess_options=so,providers=['CPUExecutionProvider'])
k=Kokoro.from_session(sess,'/tmp/urai-the-unknown-r8/tts/voices-v1.0.bin')
details=[]
for i,s in enumerate(segments,1):
 wav,sr=k.create(s,voice='am_michael',speed=1.12)
 path=out/f'voice_{i:02d}.wav'
 sf.write(str(path),wav,sr)
 dur=len(wav)/sr
 details.append({'scene':i,'text':s,'duration':round(dur,3),'wav':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 print('SCENE',i,'duration',round(dur,3),'bytes',path.stat().st_size,flush=True)
(out/'narration_manifest.json').write_text(json.dumps(details,indent=2)+'\n')
print('TOTAL_SPEECH_SECONDS',round(sum(d['duration'] for d in details),3),flush=True)
