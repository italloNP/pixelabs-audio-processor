/**
 * Main Application Logic for Pixelabs Audio Processor
 * Handles UI interactions and orchestrates transcription and transformation
 */

// Initialize transcriber
const transcriber = new AudioTranscriber();

// DOM Elements
const openRouterKeyInput = document.getElementById('openRouterKey');
const audioFileInput = document.getElementById('audioFile');
const fileStatus = document.getElementById('fileStatus');
const transcribeBtn = document.getElementById('transcribeBtn');
const transformBtn = document.getElementById('transformBtn');
const promptDropdown = document.getElementById('promptDropdown');
const customPrompt = document.getElementById('customPrompt');
const transcriptionOutput = document.getElementById('transcriptionOutput');
const finalResult = document.getElementById('finalResult');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// --- Cache Functions ---

function saveApiKeyToCache(key) {
  localStorage.setItem('openai_api_key', key);
  console.log('✅ API key salva no cache');
}

function loadApiKeyFromCache() {
  const cachedKey = localStorage.getItem('openai_api_key');
  return cachedKey;
}

function clearApiKeyCache() {
  localStorage.removeItem('openai_api_key');
  console.log('✅ Cache limpo');
}

// --- Configuration Section ---

// Load cached API key on startup
window.addEventListener('DOMContentLoaded', () => {
  const cachedKey = loadApiKeyFromCache();
  if (cachedKey) {
    openRouterKeyInput.value = cachedKey;
    try {
      transcriber.setApiKey(cachedKey);
      transcribeBtn.disabled = false;
      console.log('✅ API key carregada do cache');
    } catch (error) {
      console.error('❌ Chave em cache inválida:', error.message);
      clearApiKeyCache();
    }
  }
});

openRouterKeyInput.addEventListener('input', (e) => {
  const key = e.target.value;
  try {
    if (key) {
      transcriber.setApiKey(key);
      saveApiKeyToCache(key); // Save to cache
      transcribeBtn.disabled = false;
      console.log('✅ API key configured and cached');
    }
  } catch (error) {
    transcribeBtn.disabled = true;
    console.error('❌ Invalid API key:', error.message);
    clearApiKeyCache();
  }
});

// --- Audio File Section ---

audioFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      fileStatus.className = 'file-status error';
      fileStatus.textContent = '❌ Arquivo muito grande. Máximo: 100MB';
      transcribeBtn.disabled = true;
      return;
    }

    fileStatus.className = 'file-status success';
    fileStatus.textContent = `✅ Arquivo selecionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    transcribeBtn.disabled = !openRouterKeyInput.value;
  } else {
    fileStatus.className = 'file-status';
    fileStatus.textContent = '';
    transcribeBtn.disabled = true;
  }
});

// --- Transcription Section ---

transcribeBtn.addEventListener('click', async () => {
  const file = audioFileInput.files[0];
  if (!file) {
    alert('Selecione um arquivo de áudio');
    return;
  }

  transcribeBtn.disabled = true;
  transcriptionOutput.className = 'output-box loading';
  transcriptionOutput.textContent = '⏳ Transcrevendo áudio... Por favor, aguarde...';

  try {
    const text = await transcriber.transcribeAudio(file);
    transcriptionOutput.className = 'output-box success';
    transcriptionOutput.textContent = text;

    // Enable transformation button
    transformBtn.disabled = false;
    console.log('✅ Transcrição concluída');
  } catch (error) {
    transcriptionOutput.className = 'output-box error';
    transcriptionOutput.textContent = `❌ Erro na transcrição: ${error.message}`;
    transformBtn.disabled = true;
    console.error('Transcription error:', error);
  } finally {
    transcribeBtn.disabled = false;
  }
});

// --- Prompt Transformation Section ---

promptDropdown.addEventListener('change', (e) => {
  const selectedValue = e.target.value;
  const predefinedPrompts = transcriber.getPredefinedPrompts();

  if (selectedValue === 'custom') {
    customPrompt.value = '';
    customPrompt.placeholder = 'Descreva como você quer transformar a transcrição...';
  } else if (predefinedPrompts[selectedValue]) {
    customPrompt.value = predefinedPrompts[selectedValue];
  }
});

customPrompt.addEventListener('input', (e) => {
  // Enable/disable transform button based on prompt content
  transformBtn.disabled = !e.target.value.trim() || !transcriber.getTranscription();
});

transformBtn.addEventListener('click', async () => {
  const prompt = customPrompt.value.trim();
  if (!prompt) {
    alert('Escreva um prompt para transformação');
    return;
  }

  transformBtn.disabled = true;
  finalResult.className = 'output-box loading';
  finalResult.textContent = '⏳ Transformando com IA... Por favor, aguarde...';

  try {
    const result = await transcriber.transformTranscription(prompt);

    // Update final result and show copy/download buttons
    finalResult.className = 'output-box success';
    finalResult.textContent = result;
    copyBtn.style.display = 'inline-block';
    downloadBtn.style.display = 'inline-block';

    console.log('✅ Transformação concluída');
  } catch (error) {
    finalResult.className = 'output-box error';
    finalResult.textContent = `❌ Erro na transformação: ${error.message}`;
    console.error('Transformation error:', error);
  } finally {
    transformBtn.disabled = !transcriber.getTranscription();
  }
});

// --- Results Section ---

copyBtn.addEventListener('click', () => {
  const text = finalResult.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copiado!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    alert('Erro ao copiar para clipboard');
  });
});

downloadBtn.addEventListener('click', () => {
  const text = finalResult.textContent;
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', `resultado-${new Date().toISOString().split('T')[0]}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  console.log('✅ Arquivo baixado');
});

// Initialize
console.log('🚀 Pixelabs Audio Processor iniciado');
console.log('Predefined prompts available:', transcriber.getPredefinedPrompts());
