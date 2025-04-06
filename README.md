# EcoVision Waste Analyzer

EcoVision is a React application that analyzes waste composition using Google's Gemini API and provides detailed insights for proper disposal and recycling. This tool helps users understand the environmental impact of their waste and promotes better recycling practices.

## Features

- 📊 Interactive waste visualization
- 🤖 AI-powered waste analysis using Google Gemini API
- 📝 Detailed breakdown of waste types and disposal methods
- 🌱 Environmental impact assessment
- 📈 Charts and statistics for waste composition
- 📱 Responsive design for all devices

## Technology Stack

- React 19
- Vite 6
- TailwindCSS 4
- Chart.js 4
- Google Generative AI SDK
- React Router 7
- React Spring (for animations)

## Prerequisites

- Node.js >= 18.x
- npm >= 8.x

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/eco-vision.git
cd eco-vision
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Google Gemini API Key:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

You can obtain a Gemini API key from [Google AI Studio](https://makersuite.google.com/).

## Usage

### Development

To start the development server:

```bash
npm run dev
```

This will launch the application on `http://localhost:5173`.

### Building for Production

To build the application for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
eco-vision/
├── public/          # Static files
├── src/
│   ├── assets/      # Images and other assets
│   ├── components/  # React components
│   ├── utils/       # Utility functions
│   ├── App.jsx      # Main application component
│   └── main.jsx     # Application entry point
├── .env             # Environment variables
├── .gitignore       # Git ignore file
└── package.json     # Dependencies and scripts
```

## How It Works

1. The application loads waste data from a JSON file or user input
2. When the analyze button is pressed, it visualizes the waste items
3. The waste data is sent to the Google Gemini API for analysis
4. The AI response is parsed and displayed with detailed information about:
   - Waste composition
   - Recycling recommendations
   - Environmental impact
   - Sustainability suggestions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for providing the AI analysis capabilities
- The React community for the fantastic libraries and tools
