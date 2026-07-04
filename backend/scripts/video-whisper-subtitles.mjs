/**
 * Субтитры через Whisper + ffmpeg в стиле окружения qasiet:
 * - OPENAI_API_KEY из .env (запуск: node --env-file=.env scripts/video-whisper-subtitles.mjs ...)
 * - MEDIA_LOCAL_PATH — корень медиа (как в backend / ffmpeg-service)
 * - FFMPEG_SERVICE_URL — опционально: вызов docker ffmpeg вместо локального бинарника
 *
 * Пример:
 *   npm run video:subtitles -- --key myfolder/video.MOV
 *   npm run video:subtitles -- --key myfolder/video.MOV --out myfolder/video_with_subs.mp4
 */

import { createReadStream, promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { tmpdir } from 'os';
import OpenAI from 'openai';

const execFileAsync = promisify(execFile);

function getMediaBase() {
    return path.resolve(
        process.cwd(),
        process.env.MEDIA_LOCAL_PATH || 'uploads/media',
    );
}

function resolveKeyPath(mediaKey) {
    const base = getMediaBase();
    const normalizedKey = String(mediaKey || '').replace(/^\/+/, '');
    const resolved = path.resolve(base, normalizedKey);
    if (!resolved.startsWith(base)) {
        throw new Error('Некорректный mediaKey (вне MEDIA_LOCAL_PATH)');
    }
    return resolved;
}

function getKeyWithoutExtension(key) {
    const ext = path.extname(key);
    if (!ext) {
        return key;
    }
    return key.slice(0, -ext.length);
}

function parseArgs(argv) {
    const out = { key: '', outputKey: '' };
    for (let i = 2; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === '--key' && argv[i + 1]) {
            out.key = argv[i + 1];
            i += 1;
        } else if (a === '--out' && argv[i + 1]) {
            out.outputKey = argv[i + 1];
            i += 1;
        }
    }
    return out;
}

async function extractAudioLocal(videoPath, audioPath) {
    await fs.mkdir(path.dirname(audioPath), { recursive: true });
    await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        videoPath,
        '-vn',
        '-acodec',
        'libmp3lame',
        '-q:a',
        '2',
        audioPath,
    ]);
}

async function muxLocal(videoPath, srtPath, outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        videoPath,
        '-i',
        srtPath,
        '-c:v',
        'copy',
        '-c:a',
        'copy',
        '-c:s',
        'mov_text',
        '-map',
        '0',
        '-map',
        '1',
        outputPath,
    ]);
}

async function postFfmpegService(urlPath, body) {
    const base = (process.env.FFMPEG_SERVICE_URL || '').replace(/\/+$/, '');
    if (!base) {
        throw new Error('FFMPEG_SERVICE_URL не задан');
    }
    const url = `${base}${urlPath}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`FFmpeg service ${String(res.status)}: ${text}`);
    }
    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
}

async function main() {
    const { key: mediaKey, outputKey: outputKeyArg } = parseArgs(process.argv);
    if (!mediaKey) {
        console.error(
            'Укажите --key <путь/относительно/MEDIA_LOCAL_PATH>, например: --key folder/video.MOV',
        );
        process.exit(1);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.length === 0) {
        console.error('Задайте OPENAI_API_KEY в .env');
        process.exit(1);
    }

    const videoPath = resolveKeyPath(mediaKey);
    await fs.access(videoPath);

    const wo = getKeyWithoutExtension(mediaKey);
    const defaultOut = `${wo}_subs.mp4`;
    const outputMediaKey = outputKeyArg || defaultOut;
    const outputPath = resolveKeyPath(outputMediaKey);

    const useService = Boolean(
        process.env.FFMPEG_SERVICE_URL &&
            process.env.FFMPEG_SERVICE_URL.length > 0,
    );

    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'whisper-subs-'));
    const tempAudio = path.join(tempDir, 'audio.mp3');

    let audioKeyRelative = `${wo}_whisper_audio.mp3`;

    const srtKey = `${wo}_whisper.srt`;
    const srtPath = resolveKeyPath(srtKey);

    try {
        if (useService) {
            console.log('Извлечение аудио через FFMPEG_SERVICE_URL...');
            const r = await postFfmpegService('/extract-audio', {
                mediaKey,
                audioKey: audioKeyRelative,
            });
            if (r && typeof r.audioKey === 'string') {
                audioKeyRelative = r.audioKey;
            }
            const audioOnDisk = resolveKeyPath(audioKeyRelative);
            await fs.copyFile(audioOnDisk, tempAudio);
        } else {
            console.log('Извлечение аудио (локальный ffmpeg)...');
            await extractAudioLocal(videoPath, tempAudio);
        }

        console.log('Транскрипция Whisper (SRT)...');
        const client = new OpenAI({ apiKey });
        const transcription = await client.audio.transcriptions.create({
            file: createReadStream(tempAudio),
            model: 'whisper-1',
            response_format: 'srt',
        });
        await fs.mkdir(path.dirname(srtPath), { recursive: true });
        await fs.writeFile(srtPath, transcription, 'utf8');
        console.log('SRT сохранён:', srtKey);

        if (useService) {
            console.log('Сборка MP4 с субтитрами через FFMPEG_SERVICE_URL...');
            await postFfmpegService('/mux-subtitles', {
                videoKey: mediaKey,
                srtKey,
                outputKey: outputMediaKey,
            });
        } else {
            console.log('Сборка MP4 с субтитрами (локальный ffmpeg)...');
            await muxLocal(videoPath, srtPath, outputPath);
        }

        console.log('Готово:', outputMediaKey);
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

main().catch((err) => {
    console.error('Ошибка:', err instanceof Error ? err.message : err);
    process.exit(1);
});
