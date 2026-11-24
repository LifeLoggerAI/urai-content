import os,json,hashlib,subprocess,math
from pathlib import Path
import numpy as np
import soundfile as sf
root=Path('/tmp/urai-the-unknown-r8')
scenes=Path('/tmp/urai_the_unknown_brand_v1')
manifest=json.loads((root/'narration_manifest.json').read_text())
clips=[]; captions=[]; wave=[]; t=0.0
def ts(v):
 h=int(v//3600); m=int(v%3600//60); s=int(v%60); ms=int(round((v-int(v))*1000))
 if ms>=1000:s+=1;ms=0
 return f'{h:02}:{m:02}:{s:02}.{ms:03}'
for i,entry in enumerate(manifest,1):
 audio,sr=sf.read(entry['wav'],dtype='float32')
 if audio.ndim>1:audio=audio.mean(axis=1)
 lead=0.28 if i==1 else 0.08
 tail=0.62 if i!=10 else 1.2
 seg=np.concatenate([np.zeros(int(sr*lead),dtype='float32'),audio,np.zeros(int(sr*tail),dtype='float32')])
 wave.append(seg)
 dur=len(seg)/sr
 file=(scenes/f'scene_{i:02}.png') if i<10 else scenes/'scene_10_endcard.png'
 assert file.exists(),file
 clips.append((str(file),dur))
 captions.append({'start':t+lead,'end':t+lead+len(audio)/sr,'text':entry['text'],'scene':i})
 t+=dur
combined=np.concatenate(wave)
peak=float(np.max(np.abs(combined)))
if peak>0: combined*=0.83/peak
sf.write(root/'narration.wav',combined,sr)
playlist='ffconcat version 1.0\n'
for filename,duration in clips:
 playlist+=f"file '{filename}'\nduration {duration:.6f}\n"
playlist+=f"file '{clips[-1][0]}'\n"
(root/'scenes.ffconcat').write_text(playlist)
vtt='WEBVTT\n\n'
for i,c in enumerate(captions,1):
 text=c['text']
 words=text.split()
 chunks=[]
 while len(words)>0:
  part=words[:max(6,min(13,len(words)//max(1,math.ceil(len(words)/12))))] if False else words[:12]
  words=words[len(part):]
  chunks.append(' '.join(part))
 total=sum(len(z) for z in chunks)
 cursor=c['start']
 for part in chunks:
  span=(c['end']-c['start'])*len(part)/total
  vtt+=f'{ts(cursor)} --> {ts(cursor+span)}\n{part}\n\n'
  cursor+=span
(root/'episode-01-narrated.en.vtt').write_text(vtt)
(root/'narrated_script.md').write_text('# THE UNKNOWN — Episode 01 narrated edition\n\nSynthesized voice (Kokoro; am_michael). The text is a scripted voiceover, not proof of any conjecture.\n\n'+ '\n\n'.join(f"**Scene {x['scene']}:** {x['text']}" for x in captions)+'\n')
cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i',str(root/'scenes.ffconcat'),'-i',str(root/'narration.wav'),'-stream_loop','-1','-i',str(scenes/'urai_labs_chalk_cheese_the_unknown_math_ep01.mp4'),'-filter_complex','[1:a]volume=1.0[a0];[2:a]volume=0.055[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]','-map','0:v:0','-map','[a]','-vf','fps=24,scale=1080:1920:flags=bilinear,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-b:a','128k','-movflags','+faststart','-t',f'{t:.3f}',str(root/'the_unknown_ep01_narrated_r8.mp4')]
(root/'render_command.json').write_text(json.dumps(cmd,indent=2))
print('VOICE_AND_TIMING_COMPLETE',round(t,3),'seconds',len(captions),'scenes',flush=True)
print('ENCODING_START',flush=True)
subprocess.run(cmd,check=True)
p=root/'the_unknown_ep01_narrated_r8.mp4'
print('ENCODING_DONE',p.stat().st_size,hashlib.sha256(p.read_bytes()).hexdigest(),flush=True)
info=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',str(p)],capture_output=True,text=True,check=True)
print('FFPROBE',info.stdout[:1500],flush=True)
