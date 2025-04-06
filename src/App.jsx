import { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import WasteVisualization from './components/WasteVisualization';
import WasteAnalysis from './components/WasteAnalysis';
import WasteClassification from './components/WasteClassification';
import { generateWasteAnalysis } from './utils/gemini';

function App() {
  const [wasteData, setWasteData] = useState([]);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Load waste data on component mount
  useEffect(() => {
    fetch('/waste.json')
      .then(response => response.json())
      .then(data => {
        setWasteData(data);
        console.log('Loaded waste data:', data);
      })
      .catch(error => {
        console.error('Error loading waste data:', error);
      });
  }, []);

  // Function to handle analyze button click
  const handleAnalyzeClick = async () => {
    setShowVisualization(true);
    setShowAnalysis(true);
    setIsLoading(true);
    
    // Scroll to visualization section
    setTimeout(() => {
      const sections = document.querySelectorAll('section');
      if (sections.length > 1) {
        sections[1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    try {
      // Always use the real API instead of simulation
      const response = await generateWasteAnalysis(wasteData);
      
      console.log("Using real Gemini API response");
      
      setAiResponse(response);
    } catch (error) {
      console.error('Error analyzing waste:', error);
      setAiResponse(`<div class="text-red-500 p-4 bg-red-50 rounded-lg">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Error analyzing waste: ${error.message}
      </div>`);
    } finally {
      setIsLoading(false);
      
      // Scroll to analysis section after loading is complete
      setTimeout(() => {
        const sections = document.querySelectorAll('section');
        if (sections.length > 2) {
          sections[2].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 600);
    }
  };

  return (
    <div>
      <Header />
      
      <main className="container">
        <HeroSection onAnalyzeClick={handleAnalyzeClick} />
        
        {showVisualization && wasteData.length > 0 && (
          <WasteVisualization wasteData={wasteData} />
        )}
        
        {showVisualization && wasteData.length > 0 && (
          <WasteClassification />
        )}
        
        {showAnalysis && (
          <WasteAnalysis isLoading={isLoading} aiResponse={aiResponse} />
        )}
      </main>
    </div>
  );
}

export default App;
