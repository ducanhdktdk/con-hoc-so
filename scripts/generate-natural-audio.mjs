import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../public/audio/natural-female');

const voiceOptions = {
  pitch: '+10Hz',
  rate: '+4%',
  volume: '+0%',
};

function saveStreamToFile(audioStream, filePath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(filePath);
    audioStream.pipe(file);
    audioStream.on('error', reject);
    file.on('error', reject);
    file.on('finish', resolve);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasUsableFile(filePath) {
  try {
    const info = await stat(filePath);
    return info.size > 1024;
  } catch {
    return false;
  }
}

async function synthesizeToFile(filePath, text) {
  const tmpPath = `${filePath}.tmp`;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await rm(tmpPath, { force: true });
      const tts = new MsEdgeTTS();
      await tts.setMetadata('vi-VN-HoaiMyNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text, voiceOptions);
      await saveStreamToFile(audioStream, tmpPath);

      if (!(await hasUsableFile(tmpPath))) {
        throw new Error(`Empty audio file: ${filePath}`);
      }

      await rename(tmpPath, filePath);
      return;
    } catch (error) {
      await rm(tmpPath, { force: true });
      if (attempt === 4) throw error;
      await wait(900 * attempt);
    }
  }
}

const objectPrompts = {
  animal: 'Con đếm xem có tất cả bao nhiêu chú cún nhé.',
  food: 'Con đếm xem có tất cả bao nhiêu chiếc bánh nhé.',
  fruit: 'Con đếm xem có tất cả bao nhiêu quả táo nhé.',
  toy: 'Con đếm xem có tất cả bao nhiêu bạn gấu bông nhé.',
};

const basePrompts = {
  celebrate: 'Tuyệt vời! Con trả lời đúng năm câu rồi. Mẹ rất tự hào về con!',
  correct: 'Đúng rồi!',
  equals: 'bằng mấy?',
  'math-start': 'Con tính cùng mẹ nhé.',
  minus: 'trừ',
  plus: 'cộng',
  'try-again': 'Con thử lại nhé.',
};

const tasks = [];

for (const [name, text] of Object.entries(basePrompts)) {
  tasks.push([name, text]);
}

for (const [key, text] of Object.entries(objectPrompts)) {
  tasks.push([`count-${key}`, text]);
}

for (let number = 0; number <= 100; number += 1) {
  tasks.push([`number-${number}`, `${number}`]);
  tasks.push([`ask-number-${number}`, `Con tìm số ${number} nhé.`]);
  tasks.push([`correct-number-${number}`, `Đúng rồi, là số ${number}.`]);
}

await mkdir(outputDir, { recursive: true });

let completed = 0;

for (const [name, text] of tasks) {
  const filePath = path.join(outputDir, `${name}.mp3`);
  if (!(await hasUsableFile(filePath))) {
    await synthesizeToFile(filePath, text);
  }
  completed += 1;
  if (completed % 25 === 0 || completed === tasks.length) {
    console.log(`Generated ${completed}/${tasks.length}`);
  }
}

console.log(`Done: ${outputDir}`);
