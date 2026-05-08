export type SrtCue = {
  index?: number;
  startMs: number;
  endMs: number;
  text: string;
};

function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}

export function formatSrtTimestamp(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new Error(`Invalid SRT timestamp: ${ms}`);
  }

  const totalMilliseconds = Math.floor(ms);
  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

export function sanitizeSrtText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function generateSrt(cues: SrtCue[]): string {
  if (cues.length === 0) {
    return '';
  }

  return cues
    .map((cue, cueIndex) => {
      if (cue.endMs <= cue.startMs) {
        throw new Error(`SRT cue ${cueIndex + 1} endMs must be greater than startMs`);
      }

      const text = sanitizeSrtText(cue.text);
      if (!text) {
        throw new Error(`SRT cue ${cueIndex + 1} text is empty`);
      }

      const index = cue.index ?? cueIndex + 1;
      return `${index}\n${formatSrtTimestamp(cue.startMs)} --> ${formatSrtTimestamp(cue.endMs)}\n${text}`;
    })
    .join('\n\n') + '\n';
}
