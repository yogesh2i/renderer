# Video Converter SDK - GitHub Actions Integration

This directory contains GitHub Actions workflows that can run the Video Converter SDK as automated jobs.

## 🚀 Available Workflows

### 1. Basic Video Converter (`video-converter.yml`)
- Simple workflow for manual triggering
- Takes JSON input via GitHub UI
- Outputs converted videos as artifacts

### 2. Video Converter API (`video-converter-api.yml`)
- Advanced workflow with API support
- Configurable SDK settings
- Enhanced job tracking and metadata
- Supports webhook triggering

## 📖 Usage Examples

### Manual Trigger (GitHub UI)

1. Go to your repository's Actions tab
2. Select "Video Converter SDK Job"
3. Click "Run workflow"
4. Paste your JSON input:

```json
{
  "base_url": "https://example.com/original-video.mp4",
  "videos": [
    {
      "media_url": "https://your-animation-site.com/",
      "start_frame": 1,
      "end_frame": 90
    }
  ]
}
```

### API Trigger (Webhook)

```bash
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/dispatches \
  -d '{
    "event_type": "video-conversion-api",
    "client_payload": {
      "job_id": "custom-job-123",
      "config": {
        "fps": 30,
        "duration": 10,
        "timeout": 300000
      },
      "input": {
        "base_url": "https://example.com/original-video.mp4",
        "videos": [
          {
            "media_url": "https://your-animation-site.com/",
            "start_frame": 1,
            "end_frame": 90
          }
        ]
      }
    }
  }'
```

### CLI Usage (Local)

```bash
# Navigate to SDK directory
cd video-converter-sdk

# Run with JSON file
node cli.js input.json

# Run with stdin
echo '{"base_url":"...","videos":[...]}' | node cli.js

# Using npm script
npm run cli input.json
```

## 📁 Output Structure

The workflows produce these outputs:

### Artifacts
- `converted-videos/` - Generated MP4 files
- `output.json` - Complete results in JSON format

### JSON Output Format
```json
{
  "base_url": "https://example.com/original-video.mp4",
  "videos": [
    {
      "media_url": "https://your-site.com/",
      "start_frame": 1,
      "end_frame": 90,
      "converted_url": "https://github.com/.../artifacts/.../video_0.mp4"
    }
  ],
  "metadata": {
    "job_id": "job-20231201-123456",
    "duration_seconds": 45.67,
    "processed_videos": 1,
    "timestamp": "2023-12-01T12:34:56.789Z",
    "github_run_id": "123456789",
    "github_run_url": "https://github.com/user/repo/actions/runs/123456789"
  }
}
```

## ⚙️ Configuration Options

### SDK Configuration
```json
{
  "fps": 30,                    // Video frame rate
  "duration": 10,               // Video duration in seconds
  "timeout": 300000,            // Timeout in milliseconds (5 minutes)
  "budgetMultiplier": 1,        // Frame budget multiplier
  "outputDir": "./public/converted-videos",
  "tempDir": "./temp",
  "screenshotDir": "./temp/screenshots"
}
```

## 🔧 Requirements

### System Dependencies (Auto-installed)
- Node.js 18+
- Chromium browser
- FFmpeg
- System libraries for headless browsing

### Environment Variables
- `GITHUB_ACTIONS=true` - Enables GitHub Actions mode
- `OUTPUT_FILE` - Path for JSON output file
- `JOB_ID` - Custom job identifier

## 📊 Monitoring

### Job Status
- Check the Actions tab for real-time progress
- Download artifacts for results and debug info
- View job summaries for quick status overview

### Error Handling
- Failed jobs upload debug logs as artifacts
- Error details included in JSON output
- Timeout protection (30-45 minutes max)

## 🚨 Limitations

- Maximum job runtime: 45 minutes
- Artifact retention: 7-14 days
- Concurrent job limits apply per repository
- Network-dependent operations may timeout

## 🔗 Integration Examples

### Node.js Integration
```javascript
const axios = require('axios');

async function triggerVideoConversion(videos) {
  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      event_type: 'video-conversion-api',
      client_payload: {
        job_id: `job-${Date.now()}`,
        input: {
          base_url: 'https://example.com/original.mp4',
          videos: videos
        }
      }
    },
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  
  return response.data;
}
```

### Python Integration
```python
import requests
import json

def trigger_video_conversion(github_token, owner, repo, videos):
    url = f"https://api.github.com/repos/{owner}/{repo}/dispatches"
    
    payload = {
        "event_type": "video-conversion-api",
        "client_payload": {
            "job_id": f"job-{int(time.time())}",
            "input": {
                "base_url": "https://example.com/original.mp4",
                "videos": videos
            }
        }
    }
    
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```
