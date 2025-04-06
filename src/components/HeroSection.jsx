import React from 'react';

function HeroSection({ onAnalyzeClick }) {
  return (
    <section className="hero-section">
      <div className="container">
        <h2>Smart Waste Identification System</h2>
        <p>
          Our AI-powered platform helps you identify and properly dispose of waste for a cleaner planet
        </p>
        <button
          onClick={onAnalyzeClick}
          className="btn btn-primary btn-large pulse"
        >
          <i className="fas fa-chart-bar"></i> Analyze Waste 
        </button>
      </div>
    </section>
  );
}

export default HeroSection; 