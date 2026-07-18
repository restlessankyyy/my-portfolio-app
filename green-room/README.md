# Green Room: Senior SA Interview Practice

Green Room is a browser-based interview practice tool for Senior Solutions Architect prep.

It gives you:
- Track-based interview sessions
- Timed answers with target ranges
- Optional camera and mic recording
- Live browser speech-to-text (when supported)
- AI scoring and coaching with Anthropic or Google Gemini
- Session history and local progress tracking
- Exportable report view

## Tech Stack

- Plain HTML/CSS/JavaScript
- No build step
- Browser APIs:
  - MediaDevices and MediaRecorder
  - Web Speech API (SpeechRecognition or webkitSpeechRecognition)
  - IndexedDB for local recordings
  - localStorage for app data

## Project Structure

- `public/index.html`: UI layout and screens
- `public/styles.css`: visual styling
- `public/questions.js`: question bank, tracks, and timing targets
- `public/app.js`: app logic, recording, transcription, AI evaluation, reports
- `server.js`: tiny Express server that serves `public/` and a `/health` endpoint
- `lambda.js`: AWS Lambda handler wrapping the Express app (serverless-express)
- `terraform/`: AWS (Lambda + API Gateway) and `terraform/cloudflare/` (DNS) infra
- `scripts/build-lambda.sh`: builds the Lambda deployment package

## Quick Start

The app is static, but it is served through a small Express server so the same
code runs locally and on AWS Lambda.

```bash
cd green-room
npm install
npm start   # http://localhost:3000
```

You can still serve the static files directly for quick UI work:

```bash
python3 -m http.server 8000 --directory public   # http://localhost:8000
```

## AI Evaluator Setup

The app auto-detects provider from API key format:
- `sk-ant-...` -> Anthropic
- `AIza...` -> Google Gemini

### Gemini models

Use the Gemini model dropdown in the UI to pick a model.
Current options include:
- `gemini-3.5-flash`
- `gemini-3.1-pro-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`

### No API key mode

You can still run sessions without a key.
In that mode, timing, transcript, and recording features work, but AI feedback is skipped.

## Virtual interviewer

The session screen shows an animated interviewer avatar that asks each question out loud.

Two voice modes:
- Standard voice: browser speech synthesis (works everywhere, robotic).
- Realistic AI voice: Kokoro neural TTS running fully in your browser (natural human voice). Enable the "Realistic AI voice" checkbox. The model (~86MB) downloads once and is cached by the browser; WebGPU is used automatically when available, otherwise WASM.

When the realistic voice is on, the avatar's mouth moves in real time from the actual audio waveform, so it looks like the interviewer is speaking.

Controls (session sidebar):
- Interviewer voice on/off
- Realistic AI voice on/off
- Interviewer voice selector (American/British, male/female)
- Replay question, Stop voice
- Shortcut: press Q to replay the current question audio

### Making it look like a real live interview

For a photorealistic, lip-synced human face, the app can be extended with:
- A 3D talking-head avatar (for example the open-source TalkingHead library with a Ready Player Me avatar), driven by the same in-browser Kokoro audio for real lip-sync. Fully client-side, no paid API.
- Or a hosted talking-avatar video service (HeyGen, D-ID, Azure TTS Avatar) for a real human face, which requires an API key and network calls.


## Deployment (meet.ankitraj.cloud)

Green Room is a self-contained subproject of `my-portfolio-app`. It deploys to
`https://meet.ankitraj.cloud` on AWS Lambda + API Gateway and reuses the repo's
shared plumbing: the same Terraform state bucket and lock table, the same GitHub
OIDC deploy role (`AWS_ROLE_ARN`), and the same Cloudflare zone. The portfolio
app and its pipeline are untouched.

The pipeline is `.github/workflows/green-room.yml`, path-filtered to
`green-room/**`. On push to `main` it builds the Lambda package, applies the
Terraform, updates the function code (keyless via OIDC), and updates Cloudflare
DNS.

### One-time setup

1. Request a regional ACM certificate for `meet.ankitraj.cloud` in `eu-north-1`
   and validate it via the Cloudflare CNAME:

   ```bash
   aws acm request-certificate --domain-name meet.ankitraj.cloud \
     --validation-method DNS --region eu-north-1
   ```

2. Add repository secrets: `GREENROOM_CERT_ARN`, `GREENROOM_ACM_VALIDATION_NAME`,
   `GREENROOM_ACM_VALIDATION_VALUE` (reusing `AWS_ROLE_ARN`, `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ZONE_ID`, and optionally `CF_PROBE_SECRET`).

Infra config lives in `terraform/terraform.tfvars.example` and
`terraform/cloudflare/terraform.tfvars.example`.

## Data and Privacy

- API keys are stored only in this browser (localStorage).
- Session summaries and scores are stored only in this browser (localStorage).
- Recordings are stored locally in IndexedDB.
- Only question text and transcript are sent to the AI API for scoring.

## Browser Notes

- Best experience: latest Chrome or Edge.
- Safari and some browsers may not support live speech transcription.
- If camera or mic fails, you can still type answers manually.

## Typical Workflow

1. Select a track.
2. Choose session length and difficulty.
3. Optionally select Gemini model and add API key.
4. Start answering with recording and transcription.
5. Submit for feedback.
6. Review end-of-session report and history.

## Troubleshooting

- Camera or mic denied:
  - Enable permission in browser site settings.
  - Reload page and retry.
- No transcript appearing:
  - Use Chrome or Edge.
  - Confirm mic permission.
  - Type directly in transcript box as fallback.
- AI evaluation failed:
  - Verify key format and validity.
  - Check selected model name.
  - Retry evaluation from the feedback panel.

## License

No license file is currently included in this repository.
