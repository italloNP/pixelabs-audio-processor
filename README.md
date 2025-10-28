# 🎙️ Pixelabs Áudio Processor

A powerful desktop audio processing application built with **Electron** that transcribes audio files using AI and transforms the transcriptions with custom prompts powered by **OpenRouter API**.

## 🚀 Features

- **🎵 Audio Upload**: Support for all major audio formats (MP3, WAV, OGG, M4A, etc.)
- **🤖 AI Transcription**: Convert audio to text using OpenRouter API
- **✨ Smart Transformation**: Transform transcriptions with customizable AI prompts
- **📋 Predefined Prompts**:
  - Summarize transcription
  - Extract key points
  - Generate meeting notes
  - Create to-do lists
- **✏️ Custom Prompts**: Full control to personalize transformations
- **📋 Copy & Download**: Copy results to clipboard or download as text file
- **🎨 Modern UI**: Beautiful gradient interface with real-time feedback

## 📋 Project Structure

```
pixelabs-audio-processor/
├── main.js                 # Electron entry point
├── preload.js              # IPC bridge for secure communication
├── package.json            # Dependencies and scripts
├── src/
│   ├── index.html         # Main UI
│   ├── style.css          # Styling
│   ├── app.js             # Main application logic
│   └── audio-transcriber.js # AI transcription module
└── assets/                # Icons and resources
```

## 🛠️ Installation

### Prerequisites
- Node.js 16+ (download from https://nodejs.org/)
- OpenRouter API key (get one at https://openrouter.ai/keys)

### Quick Setup (Recommended)

#### macOS
```bash
# Clone the repository
git clone https://github.com/italloNP/pixelabs-audio-processor.git
cd pixelabs-audio-processor

# Run the setup script (installs dependencies and builds the .dmg)
./setup-macos.sh

# The .dmg file will be ready in the dist/ folder
```

#### Windows
```cmd
# Clone the repository
git clone https://github.com/italloNP/pixelabs-audio-processor.git
cd pixelabs-audio-processor

# Run the setup script (installs dependencies and builds the .exe)
setup-windows.bat

# The .exe file will be ready in the dist/ folder
```

### Manual Setup (Optional)

```bash
# Clone or navigate to project
git clone https://github.com/italloNP/pixelabs-audio-processor.git
cd pixelabs-audio-processor

# Install dependencies
npm install

# Start development
npm run dev

# Build application (creates .dmg on macOS or .exe on Windows)
npm run build
```

## 🔧 Configuration

### 1. Get OpenRouter API Key
1. Visit https://openrouter.ai/keys
2. Sign up or log in
3. Copy your API key (starts with `sk-or-`)

### 2. Configure in App
1. Open the application
2. Enter your API key in the **"Configuração da API"** section
3. The key is validated and stored locally in your browser's memory

## 📖 How to Use

### Step 1: Configure API
- Paste your OpenRouter API key in the configuration section
- The button will activate once a valid key is entered

### Step 2: Upload Audio
- Click on the file input and select an audio file
- Maximum file size: 100MB
- Supported formats: MP3, WAV, OGG, M4A, FLAC, etc.
- File status will confirm the upload

### Step 3: Transcribe
- Click **"Transcrever Áudio"** button
- The transcription will appear in the output box
- Processing time depends on audio length

### Step 4: Transform with AI
- Select a **predefined prompt** from the dropdown:
  - 📋 Resumir Transcrição (Summarize)
  - ⭐ Extrair Pontos-Chave (Extract Key Points)
  - 📌 Gerar Notas de Reunião (Generate Meeting Notes)
  - ✅ Criar Lista de Tarefas (Create To-Do List)
  - ✏️ Prompt Personalizado (Custom Prompt)
- Or write your own custom prompt in the textarea
- Click **"Transformar Transcrição"**

### Step 5: Save Results
- Copy the result to clipboard with **"Copiar Resultado"**
- Download as text file with **"Baixar como Texto"**

## 🔑 AI Models Used

- **Transcription**: GPT-4 Vision (handles audio context)
- **Transformation**: OpenAI GPT-4 Turbo (GPT-4.5 Mini equivalent)
- **API Provider**: OpenRouter (unified API access)

## 🛡️ Security & Privacy

- ✅ API key stored only in browser memory (not persisted)
- ✅ Audio files are processed directly via OpenRouter
- ✅ No local data storage or tracking
- ✅ Electron context isolation enabled
- ✅ No sensitive data in logs

## 📝 Available Prompts

### 1. Summarize
```
Please provide a concise summary of the following transcription in 3-5 sentences.
Focus on the main points and key takeaways.
```

### 2. Extract Key Points
```
Extract the 5-7 most important key points from this transcription.
List them as bullet points.
```

### 3. Generate Meeting Notes
```
Convert this transcription into professional meeting notes with sections for:
- Attendees
- Agenda
- Discussion Points
- Action Items
- Next Steps
```

### 4. Create To-Do List
```
Based on this transcription, create a prioritized to-do list with specific,
actionable items. Mark each item with priority level (High/Medium/Low).
```

## 🎨 Customization

You can easily add more predefined prompts by editing `src/audio-transcriber.js`:

```javascript
getPredefinedPrompts() {
  return {
    summarize: "...",
    extract_key_points: "...",
    // Add your custom prompts here:
    your_prompt: "Your prompt text here..."
  };
}
```

Then add the option to `src/index.html`:

```html
<option value="your_prompt">🎯 Your Prompt Label</option>
```

## 🐛 Troubleshooting

### "Invalid API key" error
- Check that your key starts with `sk-or-`
- Visit https://openrouter.ai/keys to verify your key is active
- Try generating a new key

### "File too large" error
- Maximum file size is 100MB
- Consider splitting large audio files or using a shorter audio

### "Transcription failed" error
- Check your API key is still valid
- Verify you have sufficient OpenRouter credits
- Check your internet connection
- Try with a different audio file

### App won't start
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Try `npm start` again

## 📦 Building for Distribution

Use the setup scripts to automatically build for your platform:

### macOS (.dmg)
```bash
./setup-macos.sh
# Output: dist/Pixelabs\ Áudio\ Processor-1.0.0.dmg
```

Or manually:
```bash
npm run build
```

### Windows (.exe)
```cmd
setup-windows.bat
# Output: dist/Pixelabs Áudio Processor Setup 1.0.0.exe
```

Or manually:
```bash
npm run build
```

### Cross-platform
To build for a different platform, use:
```bash
npm run build -- --win    # Windows
npm run build -- --mac    # macOS
npm run build -- --linux  # Linux
```

## 🔄 Development Workflow

### Start dev server with auto-reload
```bash
npm run dev
```

### Run with DevTools
The DevTools are automatically opened in development mode. Remove this line from `main.js:22` for production:
```javascript
mainWindow.webContents.openDevTools();
```

## 📚 Technologies

- **Desktop**: Electron 30+
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: OpenRouter API, GPT-4 Vision, GPT-4 Turbo
- **Build**: electron-builder

## 🤝 Contributing

Suggestions for improvements:
1. Add support for video files
2. Batch processing multiple files
3. Voice commands
4. Audio enhancement before transcription
5. History of transformations
6. Custom model selection

## 📄 License

ISC

## 🆘 Support

For issues with:
- **OpenRouter API**: https://openrouter.ai/
- **Electron**: https://www.electronjs.org/
- **This app**: Check the console logs in DevTools for error details

---

**Happy Audio Processing! 🎉**
