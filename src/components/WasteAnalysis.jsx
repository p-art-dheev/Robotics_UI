import React, { useState, useEffect } from 'react';

function WasteAnalysis({ isLoading, aiResponse }) {
  const [wasteCardVisible, setWasteCardVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && aiResponse) {
      // Animate the card after loading is complete
      const timer = setTimeout(() => {
        setWasteCardVisible(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading, aiResponse]);

  // Function to convert markdown to HTML with icons and styling
  const formatMarkdown = (text) => {
    if (!text) return '';

    // Enhanced markdown to HTML conversion
    let htmlContent = text
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3 border-b pb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">$1</h2>')
      .replace(/^\* (.*$)/gm, '<li class="mb-2 pl-4">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/♻/g, '<i class="fas fa-recycle text-green-500 mr-1"></i>')
      .replace(/⚠/g, '<i class="fas fa-exclamation-triangle text-yellow-500 mr-1"></i>')
      .replace(/🚫/g, '<i class="fas fa-ban text-red-500 mr-1"></i>')
      .replace(/🏭/g, '<i class="fas fa-industry text-blue-500 mr-1"></i>')
      .replace(/🧼/g, '<i class="fas fa-soap text-blue-300 mr-1"></i>')
      .replace(/🔍/g, '<i class="fas fa-search text-purple-500 mr-1"></i>')
      .replace(/🗑/g, '<i class="fas fa-trash text-gray-500 mr-1"></i>');

    // Convert ordered lists (numbers)
    htmlContent = htmlContent.replace(/^\d+\. (.*$)/gm, '<li class="mb-2 pl-4">$1</li>');
    
    // Convert unordered lists
    htmlContent = htmlContent.replace(/<li/g, '<li class="list-disc ml-5"');

    // Add some additional styling
    htmlContent = htmlContent.replace(/<p>/g, '<p class="mb-4 leading-relaxed">');

    return htmlContent;
  };

  // Check if this is an API response or simulated response 
  const isApiResponse = true; // This is now always true due to our App.jsx modification

  return (
    <section className="waste-analysis-section">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="card-title mb-0">
            <i className="fas fa-microscope mr-2"></i>
            Detailed Waste Analysis
          </h3>
          {!isLoading && aiResponse && (
            <div className="api-indicator">
              <span className={`status-dot ${isApiResponse ? 'status-dot-api' : 'status-dot-simulated'}`}></span>
              <span>{isApiResponse ? 'API Response' : 'Simulated Response'}</span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="loading-spinner"></div>
            <p>Analyzing waste composition<span className="loading-dots"></span></p>
          </div>
        )}

        {!isLoading && aiResponse && (
          <div className={`waste-card ${wasteCardVisible ? 'show' : ''}`}>
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(aiResponse) }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default WasteAnalysis; 