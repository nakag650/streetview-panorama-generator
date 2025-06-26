# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js web application that generates 360-degree panorama images from Google Street View data. The application allows users to click on a map to select a location and generates a horizontal panorama by combining 8 directional Street View images.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Format code
npm run format

# Note: Linting not configured yet (returns exit 0)
npm run lint
```

## Environment Setup

1. Copy `env.example` to `.env` and configure API keys:
   - `GOOGLE_MAPS_API_KEY` - For Maps JavaScript API (frontend)
   - `GOOGLE_STREET_VIEW_API_KEY` - For Street View Static API (backend)
   - `PORT` - Server port (default: 3000)

2. Update API key in `public/index.html` for Google Maps JavaScript API

## Architecture

### Core Components

- **Express Server** (`server.js`): Main application server with static file serving
- **Street View Service** (`src/streetViewService.js`): Handles Google Street View Static API requests
- **Image Processor** (`src/imageProcessor.js`): Combines 8 directional images into panoramas using Sharp
- **API Routes** (`src/routes.js`): RESTful endpoints for panorama generation and image listing
- **Frontend** (`public/`): Pure HTML/CSS/JS interface with Google Maps integration

### Image Processing Pipeline

1. **Image Acquisition**: Fetches 8 images at 45-degree intervals (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
2. **Cropping**: Extracts center 320px width from each 640x640 image
3. **Panorama Generation**: Combines cropped images horizontally to create 2560x640 panorama
4. **Output**: Saves as PNG in `/output` directory with timestamp and coordinates

### API Endpoints

- `GET /api/maps-api-key` - Securely provides Google Maps API key to frontend
- `POST /api/generate-panorama` - Generates panorama from lat/lng coordinates
- `GET /api/panoramas` - Lists generated panorama images

## Key Technical Details

### API Limitations
- Street View Static API: 25,000 requests/day (free tier)
- Each panorama requires 8 API calls
- Maximum ~3,125 panoramas per day

### Image Specifications
- Input: 640x640px images from Street View Static API
- Processing: Center 320px width extraction for seamless panorama
- Output: 2560x640px horizontal panorama in PNG format

### Error Handling
- Graceful handling of locations without Street View coverage
- API rate limiting with 200ms delays between requests
- Network timeout handling (10 second limit)

## File Structure

```
src/
├── streetViewService.js  # Google Street View API integration
├── imageProcessor.js     # Sharp-based image processing
└── routes.js            # Express API routes

public/
├── index.html           # Main UI with Google Maps
├── script.js            # Frontend JavaScript
└── style.css           # Application styles

output/                  # Generated panorama images
```

## Dependencies

- **Sharp**: High-performance image processing
- **Axios**: HTTP client for API requests
- **Express**: Web framework
- **dotenv**: Environment variable management

## Security Notes

- API keys are managed server-side via environment variables
- Frontend receives Maps API key through secure endpoint
- Street View API key never exposed to client
- Generated images stored locally in `/output` directory