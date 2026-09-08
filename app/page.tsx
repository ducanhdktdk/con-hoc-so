'use client';

import {
  Apple,
  ArrowRight,
  Calculator,
  Hand,
  Minus,
  PartyPopper,
  Plus,
  Trophy,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type GameKey = 'numbers' | 'counting' | 'math';
type LevelKey = 'level1' | 'level2';
type ObjectKey = 'fruit' | 'animal' | 'toy' | 'food';
type AudioVoiceKey = 'hoai-my' | 'google-north';

type Challenge = {
  answer: number;
  helper: string;
  items?: number;
  left?: number;
  objectKey?: ObjectKey;
  operation?: '+' | '-';
  options: number[];
  prompt: string;
  right?: number;
};

const levelDetails: Record<LevelKey, { label: string; max: number; range: string }> = {
  level1: { label: 'Level 1', max: 10, range: '0-10' },
  level2: { label: 'Level 2', max: 100, range: '0-100' },
};

const objectThemes: Record<
  ObjectKey,
  { name: string; plural: string; src: string }
> = {
  animal: { name: 'chú cún', plural: 'chú cún', src: '/sticker-puppy.png' },
  food: { name: 'chiếc bánh', plural: 'chiếc bánh', src: '/sticker-cupcake.png' },
  fruit: { name: 'quả táo', plural: 'quả táo', src: '/sticker-apple.png' },
  toy: { name: 'bạn gấu bông', plural: 'bạn gấu bông', src: '/sticker-teddy.png' },
};

const games: Array<{
  accent: string;
  icon: typeof Hand;
  key: GameKey;
  label: string;
}> = [
  { accent: 'bg-[#ff5f6d]', icon: Hand, key: 'numbers', label: 'Chọn số' },
  { accent: 'bg-[#00a896]', icon: Apple, key: 'counting', label: 'Đếm đồ vật' },
  { accent: 'bg-[#f6a609]', icon: Calculator, key: 'math', label: 'Cộng trừ' },
];

const firstChallenges: Record<LevelKey, Record<GameKey, Challenge>> = {
  level1: {
    numbers: {
      answer: 3,
      helper: 'Con đang cầm một thẻ số. Con tìm đúng số đó nhé.',
      options: [2, 3, 5, 8],
      prompt: 'Số nào là số 3?',
    },
    counting: {
      answer: 4,
      helper: 'Đếm từng quả táo, rồi chọn số đúng.',
      items: 4,
      objectKey: 'fruit',
      options: [2, 4, 5, 7],
      prompt: 'Có mấy quả táo?',
    },
    math: {
      answer: 3,
      helper: 'Có 2 quả táo, con thêm 1 quả nữa.',
      left: 2,
      objectKey: 'fruit',
      operation: '+',
      options: [2, 3, 4, 5],
      prompt: '2 cộng 1 bằng mấy?',
      right: 1,
    },
  },
  level2: {
    numbers: {
      answer: 47,
      helper: 'Nhìn kỹ hai chữ số: 4 chục và 7 đơn vị.',
      options: [37, 47, 74, 57],
      prompt: 'Số nào là số 47?',
    },
    counting: {
      answer: 36,
      helper: 'Mỗi nhóm có 10 bạn. Con đếm nhóm mười rồi đếm phần lẻ nhé.',
      items: 36,
      objectKey: 'toy',
      options: [26, 36, 46, 63],
      prompt: 'Có tất cả bao nhiêu bạn gấu?',
    },
    math: {
      answer: 75,
      helper: 'Có 43 chiếc bánh, thêm 32 chiếc nữa.',
      left: 43,
      objectKey: 'food',
      operation: '+',
      options: [65, 75, 85, 73],
      prompt: '43 cộng 32 bằng mấy?',
      right: 32,
    },
  },
};

const confettiColors = ['#ff5f6d', '#ffd23f', '#00a896', '#5c7cfa', '#ff8fab'];
const confettiPieces = Array.from({ length: 56 }, (_, index) => ({
  color: confettiColors[index % confettiColors.length],
  delay: `${(index % 14) * 0.11}s`,
  duration: `${2.1 + (index % 6) * 0.18}s`,
  left: `${(index * 37) % 100}%`,
}));

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeOptions(answer: number, max: number, spread: number) {
  const options = new Set([answer]);

  while (options.size < 4) {
    options.add(Math.max(0, Math.min(max, answer + randomInt(-spread, spread))));
    options.add(randomInt(0, max));
  }

  return Array.from(options).slice(0, 4).sort(() => Math.random() - 0.5);
}

function makeChallenge(game: GameKey, level: LevelKey): Challenge {
  const max = levelDetails[level].max;

  if (game === 'numbers') {
    const answer = randomInt(0, max);
    return {
      answer,
      helper:
        level === 'level1'
          ? 'Nhìn thật kỹ hình dáng của số.'
          : `${Math.floor(answer / 10)} chục và ${answer % 10} đơn vị.`,
      options: makeOptions(answer, max, level === 'level1' ? 3 : 12),
      prompt: `Số nào là số ${answer}?`,
    };
  }

  if (game === 'counting') {
    const objectKey = (['fruit', 'animal', 'toy', 'food'] as ObjectKey[])[randomInt(0, 3)];
    const answer =
      level === 'level1'
        ? randomInt(1, 10)
        : Math.random() > 0.9
          ? 100
          : randomInt(1, 9) * 10 + randomInt(0, 9);
    const theme = objectThemes[objectKey];

    return {
      answer,
      helper:
        level === 'level1'
          ? `Con đếm từng ${theme.name} thật chậm nhé.`
          : 'Mỗi nhóm có 10 món. Con đếm nhóm mười rồi đếm phần lẻ nhé.',
      items: answer,
      objectKey,
      options: makeOptions(answer, max, level === 'level1' ? 3 : 12),
      prompt: `Có tất cả bao nhiêu ${theme.plural}?`,
    };
  }

  const operation: '+' | '-' = Math.random() > 0.45 ? '+' : '-';
  const left =
    level === 'level1'
      ? randomInt(1, 9)
      : operation === '+'
        ? randomInt(10, 70)
        : randomInt(10, 100);
  const right =
    operation === '+'
      ? level === 'level1'
        ? randomInt(1, 10 - left)
        : randomInt(1, 100 - left)
      : level === 'level1'
        ? randomInt(0, left)
        : randomInt(1, left);
  const answer = operation === '+' ? left + right : left - right;
  const objectKey = (['fruit', 'animal', 'toy', 'food'] as ObjectKey[])[randomInt(0, 3)];
  const theme = objectThemes[objectKey];

  return {
    answer,
    helper:
      operation === '+'
        ? `Có ${left} ${theme.plural}, thêm ${right} ${theme.plural} nữa.`
        : `Có ${left} ${theme.plural}, bớt đi ${right} ${theme.plural}.`,
    left,
    objectKey,
    operation,
    options: makeOptions(answer, max, level === 'level1' ? 3 : 12),
    prompt: `${left} ${operation === '+' ? 'cộng' : 'trừ'} ${right} bằng mấy?`,
    right,
  };
}

const audioVoices: Record<AudioVoiceKey, { label: string; path: string }> = {
  'google-north': { label: 'Mai Bắc · Nhẹ nhàng', path: '/audio/google-north' },
  'hoai-my': { label: 'Hoài My · Tự nhiên', path: '/audio/hoai-my' },
};
let activeAudio: HTMLAudioElement | null = null;
let audioPlaybackId = 0;

function stopVoiceAudio() {
  audioPlaybackId += 1;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.dispatchEvent(new Event('ended'));
  }
  activeAudio = null;
}

async function playAudioFiles(files: string[], voice: AudioVoiceKey) {
  if (typeof window === 'undefined') return false;

  stopVoiceAudio();
  const playbackId = audioPlaybackId;

  for (const file of files) {
    if (playbackId !== audioPlaybackId) return false;

    const audio = new Audio(`${audioVoices[voice].path}/${file}.mp3`);
    audio.playbackRate = 1.1;
    activeAudio = audio;
    try {
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.addEventListener('ended', () => resolve(), { once: true });
        audio.addEventListener('error', () => resolve(), { once: true });
      });
    } catch {
      return false;
    }

    if (playbackId !== audioPlaybackId) return false;
  }

  if (playbackId === audioPlaybackId) activeAudio = null;
  return playbackId === audioPlaybackId;
}

function challengeAudioFiles(challenge: Challenge, game: GameKey) {
  if (game === 'numbers') return ['ask-number', `number-${challenge.answer}`];
  if (game === 'counting') return [`count-${challenge.objectKey ?? 'fruit'}`];

  return [
    `number-${challenge.left ?? 0}`,
    challenge.operation === '-' ? 'minus' : 'plus',
    `number-${challenge.right ?? 0}`,
    'equals',
  ];
}

function playApplause() {
  if (typeof window === 'undefined') return;

  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  void context.resume();

  for (let clap = 0; clap < 36; clap += 1) {
    const start = context.currentTime + clap * 0.065 + (clap % 4) * 0.018;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.055), context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let sample = 0; sample < data.length; sample += 1) {
      data[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / data.length, 2);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1100 + (clap % 5) * 130;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.13, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    source.stop(start + 0.06);
  }

  window.setTimeout(() => void context.close(), 3200);
}

function StickerIcon({
  className,
  muted = false,
  objectKey,
}: {
  className?: string;
  muted?: boolean;
  objectKey: ObjectKey;
}) {
  const theme = objectThemes[objectKey];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-block shrink-0 overflow-hidden rounded-[24%] bg-white drop-shadow-[0_8px_7px_rgb(36_49_63/18%)]',
        muted && 'opacity-20 grayscale',
        className,
      )}
    >
      <Image
        alt=""
        className="object-contain"
        fill
        sizes="96px"
        src={theme.src}
      />
    </span>
  );
}

function NumberCard({ level, value }: { level: LevelKey; value: number }) {
  return (
    <div className="grid min-h-[220px] grid-cols-[1fr_auto_1fr] items-center rounded-[30px] border-4 border-white bg-[#fff1a8] px-4 shadow-[0_16px_0_rgb(58_47_29/12%)] sm:min-h-[340px] sm:px-10">
      <StickerIcon className="mx-auto size-16 sm:size-32" objectKey="animal" />
      <div className="text-center">
        <span className="select-none text-[6.5rem] font-black leading-none text-[#ef476f] sm:text-[11rem]">
          {value}
        </span>
        {level === 'level2' && (
          <p className="text-lg font-black text-[#007f73]">
            {Math.floor(value / 10)} chục · {value % 10} đơn vị
          </p>
        )}
      </div>
      <StickerIcon className="mx-auto size-16 sm:size-32" objectKey="toy" />
    </div>
  );
}

function CountScene({ challenge, level }: { challenge: Challenge; level: LevelKey }) {
  const count = challenge.items ?? challenge.answer;
  const objectKey = challenge.objectKey ?? 'fruit';

  if (level === 'level1') {
    return (
      <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-4 rounded-[30px] border-4 border-white bg-[#c9f5e9] p-5 shadow-inner sm:min-h-[340px] sm:gap-6 sm:p-6">
        {Array.from({ length: count }, (_, index) => (
          <StickerIcon className="size-20 sm:size-24" key={index} objectKey={objectKey} />
        ))}
      </div>
    );
  }

  const tens = Math.floor(count / 10);
  const ones = count % 10;

  return (
    <div className="min-h-[220px] rounded-[30px] border-4 border-white bg-[#c9f5e9] p-5 shadow-inner sm:min-h-[340px] sm:p-7">
      <div className="flex flex-wrap items-start justify-center gap-4">
        {Array.from({ length: tens }, (_, groupIndex) => (
          <div
            className="grid w-28 place-items-center gap-1 rounded-[18px] border-3 border-[#00a896] bg-white p-2 shadow-[0_8px_0_rgb(0_127_115/16%)]"
            key={`ten-${groupIndex}`}
          >
            <StickerIcon className="size-16" objectKey={objectKey} />
            <span className="text-xl font-black text-[#007f73]">× 10</span>
          </div>
        ))}
        {Array.from({ length: ones }, (_, itemIndex) => (
          <StickerIcon className="size-16 sm:size-20" key={`one-${itemIndex}`} objectKey={objectKey} />
        ))}
      </div>
      <p className="mt-6 text-center text-xl font-black text-[#007f73]">
        {tens} nhóm mười {ones > 0 ? `và ${ones} món lẻ` : ''}
      </p>
    </div>
  );
}

function NumberBlocks({ objectKey, value }: { objectKey: ObjectKey; value: number }) {
  const tens = Math.floor(value / 10);
  const ones = value % 10;

  return (
    <div className="rounded-[24px] border-3 border-white bg-[#fff3c7] p-4 shadow-inner">
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: tens }, (_, index) => (
          <div
            className="grid w-16 place-items-center rounded-[14px] border-2 border-[#f6a609] bg-white p-1"
            key={`bar-${index}`}
          >
            <StickerIcon className="size-11" objectKey={objectKey} />
            <span className="text-sm font-black text-[#9a5f00]">10</span>
          </div>
        ))}
      </div>
      {ones > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {Array.from({ length: ones }, (_, index) => (
            <StickerIcon className="size-12" key={`one-${index}`} objectKey={objectKey} />
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-3xl font-black text-[#24313f]">{value}</p>
    </div>
  );
}

function SmallObjectGroup({ count, objectKey }: { count: number; objectKey: ObjectKey }) {
  return (
    <div className="flex min-h-[130px] flex-wrap items-center justify-center gap-3 rounded-[22px] bg-white/80 p-4 sm:min-h-[180px]">
      {Array.from({ length: count }, (_, index) => (
        <StickerIcon className="size-16 sm:size-20" key={index} objectKey={objectKey} />
      ))}
    </div>
  );
}

function MathScene({ challenge, level }: { challenge: Challenge; level: LevelKey }) {
  const left = challenge.left ?? 0;
  const right = challenge.right ?? 0;
  const operation = challenge.operation ?? '+';
  const objectKey = challenge.objectKey ?? 'fruit';

  if (level === 'level1' && operation === '-') {
    return (
      <div className="min-h-[220px] rounded-[30px] border-4 border-white bg-[#ffd9e3] p-5 shadow-inner sm:min-h-[340px] sm:p-6">
        <div className="flex min-h-[150px] flex-wrap items-center justify-center gap-4 sm:min-h-[230px]">
          {Array.from({ length: left }, (_, index) => (
            <StickerIcon
              className="size-20 sm:size-24"
              key={index}
              muted={index >= left - right}
              objectKey={objectKey}
            />
          ))}
        </div>
        <p className="text-center text-xl font-black text-[#b53357]">Bớt đi {right} món</p>
      </div>
    );
  }

  if (level === 'level1') {
    return (
      <div className="grid min-h-[220px] items-center gap-4 rounded-[30px] border-4 border-white bg-[#ffd9e3] p-5 shadow-inner sm:min-h-[340px] sm:grid-cols-[1fr_auto_1fr]">
        <SmallObjectGroup count={left} objectKey={objectKey} />
        <Plus className="mx-auto size-14 rounded-full bg-white p-2 text-[#00a896] shadow" />
        <SmallObjectGroup count={right} objectKey={objectKey} />
      </div>
    );
  }

  return (
    <div className="grid min-h-[220px] items-center gap-4 rounded-[30px] border-4 border-white bg-[#ffd9e3] p-5 shadow-inner sm:min-h-[340px] sm:grid-cols-[1fr_auto_1fr]">
      <NumberBlocks objectKey={objectKey} value={left} />
      {operation === '+' ? (
        <Plus className="mx-auto size-14 rounded-full bg-white p-2 text-[#00a896] shadow" />
      ) : (
        <Minus className="mx-auto size-14 rounded-full bg-white p-2 text-[#ef476f] shadow" />
      )}
      <NumberBlocks objectKey={objectKey} value={right} />
    </div>
  );
}

function ConfettiRain() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {confettiPieces.map((piece, index) => (
        <span
          className="mimi-confetti"
          key={index}
          style={{
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            left: piece.left,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [activeGame, setActiveGame] = useState<GameKey>('numbers');
  const [activeLevel, setActiveLevel] = useState<LevelKey>('level1');
  const [challenge, setChallenge] = useState<Challenge>(firstChallenges.level1.numbers);
  const [correctInSet, setCorrectInSet] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [round, setRound] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [audioVoice, setAudioVoice] = useState<AudioVoiceKey>('google-north');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopVoiceAudio();
    };
  }, []);

  useEffect(() => {
    if (isCelebrating) return;

    const timer = window.setTimeout(() => {
      void playAudioFiles(challengeAudioFiles(challenge, activeGame), audioVoice);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [activeGame, audioVoice, challenge, isCelebrating]);

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopVoiceAudio();
  }

  function resetForGame(game: GameKey, level = activeLevel) {
    clearTimers();
    setIsCelebrating(false);
    setActiveGame(game);
    setChallenge(firstChallenges[level][game]);
    setSelected(null);
    setRound(1);
  }

  function selectLevel(level: LevelKey) {
    setActiveLevel(level);
    resetForGame(activeGame, level);
  }

  function nextQuestion(game = activeGame, level = activeLevel) {
    setChallenge(makeChallenge(game, level));
    setSelected(null);
    setRound((value) => value + 1);
  }

  function finishCelebration() {
    setIsCelebrating(false);
    nextQuestion(activeGame, activeLevel);
  }

  function celebrateFiveAnswers() {
    setIsCelebrating(true);
    playApplause();
    void playAudioFiles(['celebrate'], audioVoice).then((completed) => {
      if (completed) finishCelebration();
    });
  }

  function handleAnswer(value: number) {
    if (selected === challenge.answer) return;

    setSelected(value);

    if (value === challenge.answer) {
      const nextCorrect = correctInSet + 1;
      setStars((count) => count + 1);

      if (nextCorrect === 5) {
        setCorrectInSet(0);
        timeoutRef.current = setTimeout(celebrateFiveAnswers, 350);
        return;
      }

      setCorrectInSet(nextCorrect);
      void playAudioFiles(['correct', `number-${challenge.answer}`], audioVoice).then(
        (completed) => {
          if (completed) nextQuestion(activeGame, activeLevel);
        },
      );
      return;
    }

    void playAudioFiles(['try-again'], audioVoice);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fff0a8_0%,#bff5e9_42%,#ffd1df_72%,#cdd9ff_100%)] px-3 py-3 text-[#24313f] sm:px-6 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-6xl flex-col gap-4">
        <header className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[26px] border-4 border-white bg-white/85 p-4 shadow-[0_14px_0_rgb(36_49_63/10%)] lg:grid-cols-[auto_minmax(340px,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[20px] bg-[#fff0a8]">
              <Image
                alt="Con"
                className="h-full w-full object-cover object-top"
                height={128}
                src="/mimi-mascot.png"
                width={128}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#007f73] sm:text-sm">Khu vườn toán học</p>
              <h1 className="whitespace-nowrap text-xl font-black leading-tight sm:text-4xl">
                Con học số
              </h1>
            </div>
          </div>

          <div className="col-span-2 row-start-2 flex w-full flex-col gap-2 sm:flex-row lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-auto lg:max-w-3xl">
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-stretch gap-2">
              {(Object.keys(levelDetails) as LevelKey[]).map((level) => {
                const detail = levelDetails[level];
                return (
                  <Button
                    className={cn(
                      'h-12 min-w-0 rounded-[15px] border-2 border-white px-2 text-sm font-black shadow-sm sm:px-4 sm:text-base',
                      activeLevel === level
                        ? 'bg-[#5c7cfa] text-white hover:bg-[#4b68dc]'
                        : 'bg-[#e8edff] text-[#334a9c] hover:bg-[#dce4ff]',
                    )}
                    key={level}
                    onClick={() => selectLevel(level)}
                    type="button"
                  >
                    <span>{detail.label}</span>
                    <span className="opacity-75">{detail.range}</span>
                  </Button>
                );
              })}
              <span className="flex items-center justify-center rounded-[15px] bg-[#c9f5e9] px-4 py-2 text-sm font-black text-[#007f73]">
                Câu {round}
              </span>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <NativeSelect
                aria-label="Chọn giọng đọc nữ"
                autoComplete="off"
                className="w-[190px] [&_select]:h-12 [&_select]:rounded-[15px] [&_select]:border-2 [&_select]:border-[#5c7cfa] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:font-black [&_select]:text-[#334a9c]"
                onChange={(event) => setAudioVoice(event.target.value as AudioVoiceKey)}
                value={audioVoice}
              >
                {(Object.keys(audioVoices) as AudioVoiceKey[]).map((voice) => (
                  <NativeSelectOption key={voice} value={voice}>
                    {audioVoices[voice].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="col-start-2 row-start-1 flex flex-col items-end justify-center gap-1.5 sm:flex-row sm:items-center sm:gap-2 lg:col-start-3">
            <div className="flex items-center gap-2 rounded-full bg-[#24313f] px-4 py-2 text-white">
              <Trophy className="size-5 text-[#ffd23f]" fill="currentColor" />
              <span className="text-base font-black">{stars}</span>
              <span className="text-sm font-bold">sao</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-[#ffe0e8] px-3 py-2" aria-label={`${correctInSet} trên 5 câu đúng`}>
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  className={cn(
                    'size-3 rounded-full bg-white',
                    index < correctInSet && 'bg-[#ef476f]',
                  )}
                  key={index}
                />
              ))}
            </div>
          </div>
        </header>

        <Tabs
          className="min-w-0 flex-1"
          onValueChange={(value) => resetForGame(value as GameKey)}
          value={activeGame}
        >
          <TabsList className="grid h-16 w-full grid-cols-3 gap-0 overflow-hidden rounded-[20px] border-4 border-white bg-white p-0 shadow-[0_8px_0_rgb(36_49_63/10%)] group-data-horizontal/tabs:h-16 sm:h-[72px] sm:group-data-horizontal/tabs:h-[72px]">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <TabsTrigger
                  className={cn(
                    'min-h-16 rounded-none border-r-2 border-[#e4eaf2] bg-white text-sm font-black text-[#334155] transition-colors last:border-r-0 sm:min-h-[72px] sm:text-lg',
                    activeGame === game.key && `${game.accent} border-transparent text-white shadow-inner`,
                  )}
                  key={game.key}
                  value={game.key}
                >
                  <Icon className="size-7 sm:size-8" />
                  <span>{game.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-3 rounded-[24px] border-4 border-white bg-white/88 p-4 shadow-[0_18px_0_rgb(36_49_63/10%)] sm:p-6">
            <h2 className="sr-only">{challenge.prompt}</h2>
            <div
              className="mimi-scene-transition"
              key={`${activeGame}-${activeLevel}-${round}`}
            >
              <TabsContent className="m-0" value="numbers">
                <NumberCard level={activeLevel} value={challenge.answer} />
              </TabsContent>
              <TabsContent className="m-0" value="counting">
                <CountScene challenge={challenge} level={activeLevel} />
              </TabsContent>
              <TabsContent className="m-0" value="math">
                <MathScene challenge={challenge} level={activeLevel} />
              </TabsContent>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {challenge.options.map((option) => {
                  const isSelected = selected === option;
                  const isRight = option === challenge.answer;
                  return (
                    <Button
                      aria-label={`Chọn ${option}`}
                      className={cn(
                        'h-24 rounded-[22px] border-4 border-white bg-[#fff0a8] text-5xl font-black text-[#24313f] shadow-[0_10px_0_rgb(87_66_0/18%)] hover:bg-[#ffe76c] active:translate-y-1 sm:h-32 sm:text-6xl',
                        activeLevel === 'level2' && 'text-4xl sm:text-5xl',
                        isSelected &&
                          isRight &&
                          'bg-[#7ee29a] text-[#174b27] hover:bg-[#7ee29a]',
                        isSelected &&
                          !isRight &&
                          'bg-[#ff9eb2] text-[#7f1834] hover:bg-[#ff9eb2]',
                      )}
                      key={option}
                      onClick={() => handleAnswer(option)}
                      type="button"
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <Button
                aria-label="Nghe lại câu hỏi"
                className="h-20 w-20 overflow-hidden rounded-[22px] bg-transparent p-0 shadow-[0_7px_0_#d7a72a,0_10px_22px_rgb(65_164_219/30%)] hover:scale-105 hover:bg-transparent active:translate-y-1 active:shadow-[0_3px_0_#d7a72a] sm:h-[92px] sm:w-[92px]"
                onClick={() =>
                  void playAudioFiles(challengeAudioFiles(challenge, activeGame), audioVoice)
                }
                title="Nghe lại câu hỏi"
                type="button"
              >
                <Image
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                  height={184}
                  src="/radio-replay-button.png"
                  width={184}
                />
              </Button>

              <Button
                aria-label="Chuyển sang câu tiếp theo"
                className="h-20 w-20 rounded-[22px] border-4 border-white bg-[#fff1a8] p-0 text-[#27a9e1] shadow-[0_7px_0_#d7a72a,0_10px_22px_rgb(65_164_219/30%)] hover:scale-105 hover:bg-[#ffe775] active:translate-y-1 active:shadow-[0_3px_0_#d7a72a] sm:h-[92px] sm:w-[92px]"
                onClick={() => {
                  clearTimers();
                  nextQuestion(activeGame, activeLevel);
                }}
                title="Câu tiếp theo"
                type="button"
              >
                <ArrowRight className="size-9 text-[#ef476f]" strokeWidth={3.5} />
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

      {isCelebrating && <ConfettiRain />}
      <Dialog
        onOpenChange={(open) => {
          if (!open && isCelebrating) finishCelebration();
        }}
        open={isCelebrating}
      >
        <DialogContent
          className="z-[70] max-w-[min(92vw,520px)] place-items-center rounded-[28px] border-4 border-white bg-[#fff0a8] p-7 text-center shadow-[0_20px_0_rgb(36_49_63/18%)]"
          showCloseButton={false}
        >
          <DialogHeader className="items-center">
            <div className="grid size-28 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#c9f5e9] shadow-lg">
              <Image
                alt="Con chúc mừng"
                className="h-full w-full object-cover object-top"
                height={220}
                src="/mimi-mascot.png"
                width={220}
              />
            </div>
            <PartyPopper className="mt-2 size-12 text-[#ef476f]" />
            <DialogTitle className="text-4xl font-black text-[#ef476f] sm:text-5xl">
              Tuyệt vời!
            </DialogTitle>
            <DialogDescription className="text-xl font-black leading-relaxed text-[#334155]">
              Con đã trả lời đúng 5 câu. Mẹ rất tự hào về con!
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-2 h-14 rounded-[18px] bg-[#00a896] px-7 text-lg font-black text-white shadow-[0_8px_0_#007f73] hover:bg-[#008f80]"
            onClick={finishCelebration}
            type="button"
          >
            Chơi tiếp
            <ArrowRight className="size-6" />
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
