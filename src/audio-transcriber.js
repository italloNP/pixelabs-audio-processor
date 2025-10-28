/**
 * Audio Transcriber Module
 * Handles audio file processing and OpenRouter API calls for transcription
 * and prompt-based transformations
 */

class AudioTranscriber {
  constructor() {
    this.openaiKey = null;
    this.audioFile = null;
    this.transcription = null;
    this.transcriptionModel = 'whisper-1'; // Whisper for transcription
    this.transformationModel = 'gpt-4o-mini'; // GPT-5 Mini for transformation
  }

  // Predefined prompts for common tasks (in Portuguese)
  getPredefinedPrompts() {
    return {
      summarize: "Forneça um resumo conciso da seguinte transcrição em 3-5 frases. Foque nos pontos principais e aprendizados-chave.",
      extract_key_points: "Extraia os 5-7 pontos-chave mais importantes desta transcrição. Liste-os como tópicos.",
      generate_meeting_notes: "Converta esta transcrição em notas profissionais de reunião com seções para: Participantes, Pauta, Pontos Discutidos, Itens de Ação e Próximas Etapas.",
      create_todo: "Com base nesta transcrição, crie uma lista de tarefas priorizada com itens específicos e acionáveis. Marque cada item com nível de prioridade (Alto/Médio/Baixo).",
      extract_decisions: "Identifique todas as decisões tomadas durante esta conversa/reunião. Liste cada decisão com quem a tomou e qual era o contexto.",
      create_questions: "Formule 5-7 perguntas importantes que esta transcrição levanta ou que ainda precisam ser respondidas baseado no conteúdo.",
      professional_summary: "Resuma esta transcrição de forma profissional e executiva, como se fosse um relatório para um diretor. Máximo 200 palavras."
    };
  }

  // Validate OpenAI API key
  validateApiKey(key) {
    return key && key.trim().startsWith('sk-');
  }

  // Set OpenAI API key
  setApiKey(key) {
    if (!this.validateApiKey(key)) {
      throw new Error('Invalid OpenAI API key format. Should start with sk-');
    }
    this.openaiKey = key.trim();
  }

  // Convert audio file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  // Split audio into chunks and transcode to MP3-like compression
  async splitAndCompressAudio(audioFile) {
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Split into 25-second chunks (Whisper max recommended)
      const sampleRate = audioBuffer.sampleRate;
      const chunkDuration = 25; // seconds
      const chunkSamples = chunkDuration * sampleRate;
      const numberOfChunks = Math.ceil(audioBuffer.length / chunkSamples);

      const chunks = [];

      for (let i = 0; i < numberOfChunks; i++) {
        const startSample = i * chunkSamples;
        const endSample = Math.min(startSample + chunkSamples, audioBuffer.length);

        // Create offline context for this chunk with 2x speed (32kHz instead of 16kHz)
        const acceleratedSampleRate = 32000; // 2x speed from 16kHz
        const acceleratedLength = Math.floor((endSample - startSample) / 2);

        const offlineContext = new OfflineAudioContext(
          1, // mono
          acceleratedLength,
          acceleratedSampleRate
        );

        // Create buffer for chunk
        const chunkBuffer = audioContext.createBuffer(
          1,
          endSample - startSample,
          sampleRate
        );

        const sourceData = audioBuffer.getChannelData(0);
        const chunkData = chunkBuffer.getChannelData(0);
        chunkData.set(sourceData.slice(startSample, endSample));

        // Resample chunk with acceleration
        const source = offlineContext.createBufferSource();
        source.buffer = chunkBuffer;
        source.connect(offlineContext.destination);
        source.start();

        const resampledBuffer = await offlineContext.startRendering();
        const wavBlob = this.bufferToWav(resampledBuffer);
        chunks.push(new File([wavBlob], `audio_${i}.wav`, { type: 'audio/wav' }));
      }

      console.log(`Split audio into ${numberOfChunks} chunks (2x speed)`);
      return chunks;
    } catch (error) {
      console.warn('Audio split failed, using original file:', error);
      return [audioFile];
    }
  }

  // Convert AudioBuffer to WAV blob
  bufferToWav(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const channelData = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }

    const interleaved = new Float32Array(audioBuffer.length * numberOfChannels);
    let index = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        interleaved[index++] = channelData[channel][i];
      }
    }

    const dataLength = interleaved.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Transcribe single audio chunk using OpenAI Whisper API
  async transcribeChunk(audioFile, chunkIndex) {
    try {
      // Check if file is too small (less than 0.1 seconds)
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const duration = audioBuffer.duration;

        if (duration < 0.1) {
          console.warn(`Chunk ${chunkIndex} too short (${duration.toFixed(3)}s), skipping...`);
          return ''; // Return empty string for very short chunks
        }
      } catch (decodeError) {
        console.warn(`Could not decode chunk ${chunkIndex}, skipping...`);
        return '';
      }

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', this.transcriptionModel);
      formData.append('language', 'pt');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(`Whisper API error on chunk ${chunkIndex} (${response.status}): ${errorData.error?.message || 'Unknown'}`);
        return ''; // Return empty string instead of throwing, so we keep other chunks
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.warn(`Chunk ${chunkIndex} transcription error (non-fatal):`, error);
      return ''; // Return empty string on error, don't throw
    }
  }

  // Convert ArrayBuffer to base64
  arrayBufferToBase64(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Transcribe audio file using Whisper via OpenAI (with chunking)
  async transcribeAudio(audioFile) {
    if (!this.openaiKey) {
      throw new Error('API key not set. Please configure OpenAI API key.');
    }

    if (!audioFile) {
      throw new Error('No audio file provided.');
    }

    try {
      this.audioFile = audioFile;

      console.log(`Original file size: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`);

      // Split and compress audio into chunks
      const chunks = await this.splitAndCompressAudio(audioFile);
      console.log(`Total chunks to process: ${chunks.length}`);

      // Transcribe each chunk
      const transcriptions = [];
      let successfulChunks = 0;
      let failedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
        const chunkText = await this.transcribeChunk(chunks[i], i);

        if (chunkText && chunkText.trim().length > 0) {
          transcriptions.push(chunkText);
          successfulChunks++;
        } else {
          failedChunks++;
        }
      }

      // Combine all transcriptions
      this.transcription = transcriptions.join(' ').trim();

      // Warn if we lost some chunks but keep the result
      if (failedChunks > 0) {
        console.warn(`⚠️ ${failedChunks} chunks failed/skipped, but got ${successfulChunks} successful chunks`);
      }

      if (!this.transcription || this.transcription.length === 0) {
        throw new Error('No transcription could be extracted from the audio file. Please try again.');
      }

      return this.transcription;

    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  // Transform transcription using GPT-5 Mini with custom prompt
  async transformTranscription(customPrompt) {
    if (!this.openaiKey) {
      throw new Error('API key not set. Please configure OpenAI API key.');
    }

    if (!this.transcription) {
      throw new Error('No transcription available. Please transcribe audio first.');
    }

    if (!customPrompt || !customPrompt.trim()) {
      throw new Error('No prompt provided for transformation.');
    }

    try {
      const fullPrompt = `${customPrompt.trim()}\n\n---\n\nTranscription:\n${this.transcription}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: this.transformationModel, // GPT-5 Mini
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Transformation error:', error);
      throw error;
    }
  }

  // Get transcription
  getTranscription() {
    return this.transcription;
  }

  // Clear all data
  clear() {
    this.audioFile = null;
    this.transcription = null;
  }
}

// Export for use in app.js
window.AudioTranscriber = AudioTranscriber;
