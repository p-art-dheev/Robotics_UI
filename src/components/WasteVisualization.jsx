import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { classifyWasteItems, simulateWasteItemClassification } from '../utils/gemini';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Updated waste type classification mapping with more detailed information
const wasteTypeMap = {
  "Plastic cup": {
    type: "non-biodegradable",
    material: "plastic",
    disposal: "Recycle if clean, otherwise landfill",
    icon: "fas fa-wine-glass-alt"
  },
  "Sponge": {
    type: "non-biodegradable",
    material: "synthetic",
    disposal: "General waste (landfill)",
    icon: "fas fa-soap"
  },
  "Plastic bottle": {
    type: "non-biodegradable",
    material: "plastic",
    disposal: "Clean and recycle",
    icon: "fas fa-wine-bottle"
  },
  "Paper bag": {
    type: "biodegradable",
    material: "paper",
    disposal: "Recycle or compost",
    icon: "fas fa-shopping-bag"
  },
  "Jute bag": {
    type: "biodegradable",
    material: "natural-fiber",
    disposal: "Reuse, then compost",
    icon: "fas fa-shopping-bag"
  },
  "Coconut shell": {
    type: "biodegradable",
    material: "natural-fiber",
    disposal: "Compost or garden waste",
    icon: "fas fa-egg"
  },
  "Wooden block": {
    type: "biodegradable",
    material: "wood",
    disposal: "Compost or garden waste",
    icon: "fas fa-cube"
  },
  
  // Added items from waste.json
  "Cardboard": {
    type: "biodegradable",
    material: "paper",
    disposal: "Recycle or compost",
    icon: "fas fa-box"
  },
  "Textile": {
    type: "biodegradable",
    material: "fabric",
    disposal: "Donate if usable, textile recycling if not",
    icon: "fas fa-tshirt"
  },
  "Paper": {
    type: "biodegradable",
    material: "paper",
    disposal: "Recycle or compost",
    icon: "fas fa-scroll"
  },
  "E-waste": {
    type: "non-biodegradable",
    material: "electronic",
    disposal: "Electronics recycling center, don't dispose in regular trash",
    icon: "fas fa-laptop"
  }
};

// Default material icons for UI representation when AI hasn't classified yet
const materialIcons = {
  "plastic": "fas fa-wine-bottle",
  "paper": "fas fa-scroll",
  "cardboard": "fas fa-box",
  "wood": "fas fa-tree",
  "textile": "fas fa-tshirt", 
  "fabric": "fas fa-tshirt",
  "metal": "fas fa-utensils",
  "glass": "fas fa-wine-glass",
  "electronic": "fas fa-laptop",
  "e-waste": "fas fa-laptop-code",
  "organic": "fas fa-apple-alt",
  "food": "fas fa-utensils",
  "hazardous": "fas fa-exclamation-triangle",
  "unknown": "fas fa-question-circle"
};

// Replace with softer, more intuitive color palette
const wasteColorPalette = {
  // Main classification colors (soft, intuitive palette)
  "biodegradable": "#8BC34A",    // Soft green
  "non-biodegradable": "#FF9E80", // Soft orange-red
  
  // Material colors (soft tones)
  "plastic": "#FFB74D",          // Soft amber
  "paper": "#AED581",            // Light green
  "cardboard": "#A5D6A7",        // Soft mint
  "wood": "#BCAAA4",             // Soft brown
  "metal": "#B0BEC5",            // Soft blue-gray
  "glass": "#B2EBF2",            // Soft cyan
  "synthetic": "#CE93D8",        // Soft purple
  "natural-fiber": "#FFE082",    // Soft yellow
  "electronic": "#EF9A9A",       // Soft pink-red
  "fabric": "#C5CAE9",           // Soft indigo
  "e-waste": "#F48FB1",          // Soft pink
  
  // Other categories
  "recyclable": "#80CBC4",       // Soft teal
  "hazardous": "#FFCC80",        // Soft orange
  "reusable": "#9FA8DA",         // Soft blue-purple
  "unknown": "#E0E0E0",          // Light grey
  "mixed": "#BDBDBD"             // Medium grey
};

// Replace with VIBGYOR (rainbow) color palette
const vibgyorColorPalette = {
  // Primary waste types with VIBGYOR colors
  "Plastic cup": "#9C27B0",      // Violet
  "Plastic bottle": "#3F51B5",   // Indigo
  "Sponge": "#2196F3",           // Blue
  "Paper bag": "#4CAF50",        // Green
  "Jute bag": "#FFEB3B",         // Yellow
  "Coconut shell": "#FF9800",    // Orange
  "Wooden block": "#F44336",     // Red

  // Added items from waste.json
  "Cardboard": "#8BC34A",        // Light Green
  "Textile": "#673AB7",          // Deep Purple
  "Paper": "#009688",            // Teal
  "E-waste": "#F50057",          // Pink

  // Fallback colors by type
  "biodegradable": "#4CAF50",    // Green
  "non-biodegradable": "#F44336", // Red

  // Material fallbacks using VIBGYOR colors
  "plastic": "#3F51B5",          // Indigo
  "paper": "#4CAF50",            // Green
  "wood": "#F44336",             // Red
  "metal": "#2196F3",            // Blue
  "glass": "#00BCD4",            // Cyan
  "synthetic": "#9C27B0",        // Violet
  "natural-fiber": "#FFEB3B",    // Yellow
  "electronic": "#F50057",       // Pink
  "fabric": "#673AB7",           // Deep Purple

  // Other categories
  "recyclable": "#2196F3",       // Blue
  "hazardous": "#FF9800",        // Orange
  "unknown": "#9E9E9E",          // Grey
  "mixed": "#607D8B"             // Blue Grey
};

function WasteVisualization({ wasteData }) {
  const [statsCardsVisible, setStatsCardsVisible] = useState(false);
  const [processedData, setProcessedData] = useState({
    counts: {},
    biodegradableCount: 0,
    nonBiodegradableCount: 0,
    unknownCount: 0,
    wasteItems: []
  });
  const [isClassifying, setIsClassifying] = useState(true);
  const [aiClassifications, setAiClassifications] = useState({});

  useEffect(() => {
    // Animate stats cards after a short delay
    const timer = setTimeout(() => {
      setStatsCardsVisible(true);
    }, 300);

    // Process waste data when component mounts or when wasteData changes
    if (wasteData && wasteData.length > 0) {
      classifyAndProcessWasteData();
    }

    return () => clearTimeout(timer);
  }, [wasteData]);

  // Classify waste items using LLM and then process the data
  const classifyAndProcessWasteData = async () => {
    setIsClassifying(true);
    
    try {
      // Get unique item labels
      const uniqueLabels = [...new Set(wasteData.map(item => {
        return item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase();
      }))];
      
      const classifications = {};
      
      // Always attempt to use the Gemini API first
      try {
        console.log("Attempting AI classification for:", uniqueLabels);
        
        // Modify the prompt to also get icon suggestions from the AI
        const results = await classifyWasteItemsWithIcons(uniqueLabels);
        
        if (results && Array.isArray(results)) {
          results.forEach(result => {
            if (result.label) {
              const formattedLabel = result.label.charAt(0).toUpperCase() + result.label.slice(1).toLowerCase();
              classifications[formattedLabel] = result;
            }
          });
          console.log("AI classifications successful:", classifications);
        }
      } catch (error) {
        console.error("Error getting AI classifications:", error);
        
        // Fall back to another attempt with a more basic prompt
        try {
          console.log("Attempting simplified AI classification as fallback...");
          const results = await classifyWasteItems(uniqueLabels);
          
          if (results && Array.isArray(results)) {
            results.forEach(result => {
              if (result.label) {
                const formattedLabel = result.label.charAt(0).toUpperCase() + result.label.slice(1).toLowerCase();
                // Add a suitable icon from FontAwesome based on item type
                result.icon = getAIGeneratedIcon(result.material, result.type);
                classifications[formattedLabel] = result;
              }
            });
          }
        } catch (secondError) {
          console.error("Even simplified AI classification failed:", secondError);
          // If all AI attempts fail, just create basic classifications with generic icons
          for (const label of uniqueLabels) {
            classifications[label] = {
              label: label,
              type: label.toLowerCase().includes('plastic') || 
                    label.toLowerCase().includes('e-waste') ? 'non-biodegradable' : 'biodegradable',
              material: label.toLowerCase(),
              disposal: 'Check local waste guidelines',
              recyclable: label.toLowerCase().includes('paper') || 
                         label.toLowerCase().includes('cardboard') ? 'yes' : 'unknown',
              hazardous: 'no',
              icon: 'fas fa-recycle' // Generic fallback icon
            };
          }
        }
      }
      
      // Save AI classifications
      setAiClassifications(classifications);
      
      // Now process the data with the classifications
      processWasteData(classifications);
    } catch (error) {
      console.error("Error in classification process:", error);
      // Process with empty classification and rely on fallback logic
      processWasteData({});
    } finally {
      setIsClassifying(false);
    }
  };

  // Helper function to request FontAwesome icon suggestions from AI
  async function classifyWasteItemsWithIcons(itemLabels) {
    if (!itemLabels || !Array.isArray(itemLabels) || itemLabels.length === 0) {
      return [];
    }
    
    // Enhanced prompt that also asks for FontAwesome icon suggestions
    const prompt = `You are an environmental science expert specializing in waste classification.

Please classify these waste items:
${itemLabels.map((label, index) => `${index + 1}. ${label}`).join('\n')}

Format your response exactly as shown in this JSON format:
{
  "classifications": [
    {
      "label": "[item1]",
      "type": "[biodegradable or non-biodegradable]",
      "material": "[primary material, e.g., plastic, paper, wood, metal, glass, etc.]",
      "disposal": "[brief disposal recommendation]",
      "recyclable": "[yes, no, or potentially]",
      "hazardous": "[yes or no]",
      "icon": "[FontAwesome 5 icon class name most suitable for this waste item, e.g. fas fa-box, fas fa-tshirt, etc.]"
    },
    {
      "label": "[item2]",
      "type": "[biodegradable or non-biodegradable]",
      "material": "[primary material]",
      "disposal": "[disposal recommendation]",
      "recyclable": "[yes, no, or potentially]",
      "hazardous": "[yes or no]",
      "icon": "[appropriate FontAwesome 5 icon class]"
    }
    // and so on for each item
  ]
}

Important: Use the EXACT following icon mappings for these waste types:
- cardboard: "fas fa-box"
- textile: "fas fa-tshirt"
- paper: "fas fa-scroll"
- e-waste: "fas fa-laptop"
- plastic: "fas fa-wine-bottle"
- glass: "fas fa-wine-glass"
- metal: "fas fa-utensils"
- organic: "fas fa-apple-alt"

Your icon suggestions should use proper FontAwesome 5 classes starting with 'fas fa-', 'far fa-', or 'fab fa-'.
Provide accurate classifications based on environmental science. Ensure every item has a complete classification with all fields filled in.`;

    try {
      // Generate content using Gemini API with modified prompt
      const result = await gemini.generateContent(prompt);
      const response = await result.response;
      
      // Parse the JSON response
      try {
        const data = JSON.parse(response.text());
        return data.classifications;
      } catch (parseError) {
        console.error("Error parsing LLM batch response:", parseError);
        throw new Error("Failed to parse AI response");
      }
    } catch (error) {
      console.error("Error batch classifying waste items with icons:", error);
      throw error;
    }
  }

  // Helper function to generate FontAwesome icon based on waste material and type
  function getAIGeneratedIcon(material, type) {
    // This is only used as a last resort if all AI attempts fail
    const lowerMaterial = (material || '').toLowerCase();
    const lowerType = (type || '').toLowerCase();
    
    // Exact mappings based on waste.json labels
    if (lowerMaterial.includes('cardboard')) return 'fas fa-box';
    if (lowerMaterial.includes('textile')) return 'fas fa-tshirt';
    if (lowerMaterial.includes('paper')) return 'fas fa-scroll';
    if (lowerMaterial.includes('e-waste') || lowerMaterial.includes('electronic')) return 'fas fa-laptop';
    if (lowerMaterial.includes('plastic')) return 'fas fa-wine-bottle';
    if (lowerMaterial.includes('glass')) return 'fas fa-wine-glass';
    if (lowerMaterial.includes('metal')) return 'fas fa-utensils';
    if (lowerMaterial.includes('organic')) return 'fas fa-apple-alt';
    
    // Fallbacks based on label instead of material
    const lowerLabel = type.toLowerCase();
    if (lowerLabel.includes('cardboard')) return 'fas fa-box';
    if (lowerLabel.includes('textile')) return 'fas fa-tshirt';
    if (lowerLabel.includes('paper')) return 'fas fa-scroll';
    if (lowerLabel.includes('e-waste')) return 'fas fa-laptop';
    
    // Fallbacks based on biodegradability type
    if (lowerType.includes('biodegradable')) return 'fas fa-leaf';
    if (lowerType.includes('non-biodegradable')) return 'fas fa-trash';
    
    return 'fas fa-question';
  }

  // Process and classify all waste data
  const processWasteData = (classifications = {}) => {
    const counts = {};
    let biodegradableCount = 0;
    let nonBiodegradableCount = 0;
    let unknownCount = 0;
    const wasteItems = [];

    // Ensure wasteData is an array before processing
    if (!wasteData || !Array.isArray(wasteData) || wasteData.length === 0) {
      console.warn("No waste data provided or invalid format");
      setProcessedData({
        counts,
        biodegradableCount,
        nonBiodegradableCount,
        unknownCount,
        wasteItems
      });
      return;
    }

    wasteData.forEach(item => {
      // Ensure the item has a label
      if (!item.label) {
        console.warn("Waste item missing label:", item);
        return;
      }

      // Format label properly for consistency
      const formattedLabel = item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase();
      
      // Get classification for this item
      let wasteInfo;
      
      // Try AI classification (which should now always include an icon)
      if (classifications[formattedLabel]) {
        wasteInfo = {
          ...classifications[formattedLabel]
        };
        
        // Ensure we have an icon, even if AI didn't provide one
        if (!wasteInfo.icon) {
          wasteInfo.icon = getAIGeneratedIcon(wasteInfo.material, wasteInfo.type);
        }
      } else {
        // If no AI classification available, create a placeholder
        console.warn(`No classification found for ${formattedLabel}, using placeholder`);
        wasteInfo = {
          type: 'unknown',
          material: formattedLabel.toLowerCase(),
          disposal: 'Check local waste guidelines',
          recyclable: 'unknown',
          hazardous: 'no',
          icon: 'fas fa-recycle' // Generic icon
        };
      }
      
      // Count by label
      counts[formattedLabel] = (counts[formattedLabel] || 0) + 1;
      
      // Count by biodegradability
      if (wasteInfo.type === 'biodegradable') {
        biodegradableCount++;
      } else if (wasteInfo.type === 'non-biodegradable') {
        nonBiodegradableCount++;
      } else {
        unknownCount++;
      }
      
      // Store processed item
      wasteItems.push({
        ...item,
        formattedLabel,
        wasteInfo
      });
    });

    setProcessedData({
      counts,
      biodegradableCount,
      nonBiodegradableCount,
      unknownCount,
      wasteItems
    });
  };

  // Get a color for a waste item based on its classification
  const getWasteItemColor = (label) => {
    // Get waste info for this label from AI classification
    const wasteInfo = aiClassifications[label] || { type: 'unknown', material: 'unknown' };
    const lowerLabel = label.toLowerCase();
    const lowerMaterial = wasteInfo.material ? wasteInfo.material.toLowerCase() : '';
    
    // First try to match by material colors
    if (lowerMaterial.includes('plastic')) return wasteColorPalette.plastic;
    if (lowerMaterial.includes('paper')) return wasteColorPalette.paper;
    if (lowerMaterial.includes('cardboard')) return wasteColorPalette.cardboard;
    if (lowerMaterial.includes('wood')) return wasteColorPalette.wood;
    if (lowerMaterial.includes('metal')) return wasteColorPalette.metal;
    if (lowerMaterial.includes('glass')) return wasteColorPalette.glass;
    if (lowerMaterial.includes('fabric') || lowerMaterial.includes('textile')) return wasteColorPalette['natural-fiber'];
    if (lowerMaterial.includes('electronic') || lowerLabel.includes('e-waste')) return wasteColorPalette.electronic;
    
    // Then by biodegradability type (most intuitive classification)
    if (wasteInfo.type === 'biodegradable') {
      return wasteColorPalette.biodegradable;
    } else if (wasteInfo.type === 'non-biodegradable') {
      return wasteColorPalette['non-biodegradable'];
    }
    
    // Match common materials in the label
    if (lowerLabel.includes('plastic')) return wasteColorPalette.plastic;
    if (lowerLabel.includes('paper')) return wasteColorPalette.paper;
    if (lowerLabel.includes('cardboard')) return wasteColorPalette.cardboard;
    if (lowerLabel.includes('wood')) return wasteColorPalette.wood;
    if (lowerLabel.includes('metal')) return wasteColorPalette.metal;
    if (lowerLabel.includes('glass')) return wasteColorPalette.glass;
    if (lowerLabel.includes('textile') || lowerLabel.includes('fabric')) return wasteColorPalette['natural-fiber'];
    if (lowerLabel.includes('electronic') || lowerLabel.includes('e-waste')) return wasteColorPalette.electronic;
    
    // Fallback to unknown
    return wasteColorPalette.unknown;
  };

  // Function to get appropriate icon for any waste item
  const getWasteIcon = (label, type, material) => {
    // Get icon directly from AI classification if available
    if (aiClassifications[label]?.icon) {
      return aiClassifications[label].icon;
    }
    
    // If no classification found, use the AI generated icon helper as fallback
    return getAIGeneratedIcon(material, type);
  };

  // Prepare enhanced chart data with custom colors per waste type
  const chartData = {
    labels: Object.keys(processedData.counts).map(label => `${label} (${processedData.counts[label]})`),
    datasets: [
      {
        data: Object.values(processedData.counts),
        backgroundColor: Object.keys(processedData.counts).map(label => getWasteItemColor(label)),
        borderColor: Object.keys(processedData.counts).map(label => getWasteItemColor(label)),
        borderWidth: 1,
        hoverBackgroundColor: Object.keys(processedData.counts).map(label => {
          // For hover, use the same color (soft colors look good as is)
          return getWasteItemColor(label);
        }),
        hoverBorderWidth: 2,
      },
    ],
  };

  // Enhanced chart options
  const chartOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: 'bold'
        },
        padding: 12,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.formattedValue;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);

            // Get the waste type if available
            const itemLabel = label.split(' (')[0];
            const wasteInfo = aiClassifications[itemLabel] || wasteTypeMap[itemLabel] || {
              type: 'Unknown',
              material: 'Unknown',
              disposal: 'Unknown'
            };

            return [
              `Count: ${value} (${percentage}%)`,
              `Type: ${wasteInfo.type.charAt(0).toUpperCase() + wasteInfo.type.slice(1)}`,
              `Material: ${wasteInfo.material.charAt(0).toUpperCase() + wasteInfo.material.slice(1)}`
            ];
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200,
      easing: 'easeOutBounce'
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Create a biodegradability pie chart with high contrast colors
  const biodegradabilityChartData = {
    labels: ['Biodegradable', 'Non-biodegradable', 'Unknown'],
    datasets: [
      {
        data: [
          processedData.biodegradableCount,
          processedData.nonBiodegradableCount,
          processedData.unknownCount
        ],
        backgroundColor: [
          wasteColorPalette.biodegradable,
          wasteColorPalette['non-biodegradable'],
          wasteColorPalette.unknown
        ],
        borderColor: [
          wasteColorPalette.biodegradable,
          wasteColorPalette['non-biodegradable'],
          wasteColorPalette.unknown
        ],
        borderWidth: 1,
      },
    ],
  };

  // Check if waste data is valid for visualization
  const hasValidPositionData = wasteData && wasteData.length > 0 && wasteData[0].box_2d;

  return (
    <section>
      <div className="card">
        <h3 className="card-title">
          <i className="fas fa-chart-pie mr-2"></i>
          Detected Waste Items Visualization
          {isClassifying && (
            <span className="ml-2 text-sm text-amber-600 animate-pulse">
              <i className="fas fa-brain mr-1"></i> AI Classifying...
            </span>
          )}
        </h3>

        {/* Skip visualization if position data is missing */}
        {hasValidPositionData && (
          <div className="waste-visualization">
            {processedData.wasteItems.map((item, index) => {
              // Find max coordinates to normalize positions
              const maxX = Math.max(...wasteData.map(i => i.box_2d[2]));
              const maxY = Math.max(...wasteData.map(i => i.box_2d[3]));

              const [x1, y1, x2, y2] = item.box_2d;

              // Normalize coordinates to fit canvas (90% of width/height to leave some margins)
              const left = (x1 / maxX) * 90 + '%';
              const top = (y1 / maxY) * 90 + '%';
              const width = ((x2 - x1) / maxX) * 90 + '%';
              const height = ((y2 - y1) / maxY) * 90 + '%';

              const wasteInfo = item.wasteInfo;
              const backgroundColor = getWasteItemColor(item.formattedLabel);
              const iconClass = getWasteIcon(item.formattedLabel, wasteInfo.type, wasteInfo.material || '');

              return (
                <div
                  key={index}
                  className={`waste-item ${item.label.replace(' ', '-')}`}
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: backgroundColor + 'E6', // Higher opacity for more contrast
                    border: `2px solid ${backgroundColor}`,
                    color: '#FFFFFF', // White text for better contrast on dark backgrounds
                    textShadow: '1px 1px 2px rgba(0,0,0,0.7)', // Text shadow for better visibility
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)' // Add shadow for depth
                  }}
                  title={`${item.formattedLabel} (${wasteInfo.type})`}
                >
                  <div className="text-center">
                    <i className={iconClass}></i>
                    <div className="text-xs">{item.formattedLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className={`waste-stats-card card-border-green ${statsCardsVisible ? 'show' : ''}`}>
            <h4>
              <i className="fas fa-chart-pie mr-2"></i>
              Waste Composition
            </h4>
            <div style={{ height: '280px' }}>
              {isClassifying ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
                  <span className="ml-3 text-emerald-600">Classifying waste...</span>
                </div>
              ) : (
                <Pie data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          <div className={`waste-stats-card card-border-blue ${statsCardsVisible ? 'show' : ''}`}>
            <h4>
              <i className="fas fa-recycle mr-2"></i>
              Disposal Methods
            </h4>
            <div className="space-y-3">
              {isClassifying ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
                  <span className="ml-3 text-blue-600">Loading disposal data...</span>
                </div>
              ) : (
                Object.keys(processedData.counts).map((label, index) => {
                  const wasteInfo = aiClassifications[label] || wasteTypeMap[label] || {
                    type: 'unknown',
                    material: 'unknown',
                    disposal: 'Check local waste guidelines'
                  };
                  const iconClass = getWasteIcon(label, wasteInfo.type, wasteInfo.material);
                  const backgroundColor = getWasteItemColor(label);

                  // Use white text on all colored backgrounds for better contrast
                  const textColor = '#FFFFFF';

                  return (
                    <div key={index} className="flex items-start mb-2 rounded-lg overflow-hidden">
                      <span
                        className="waste-type-tag mr-2 shadow-sm"
                        style={{
                          backgroundColor: backgroundColor,
                          color: textColor,
                          textShadow: '1px 1px 1px rgba(0,0,0,0.5)', // Text shadow for better readability
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        <i className={iconClass + " mr-1"}></i>
                        {label}
                      </span>
                      <span className="flex-1 text-sm">{wasteInfo.disposal}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={`waste-stats-card card-border-yellow ${statsCardsVisible ? 'show' : ''}`}>
            <h4>
              <i className="fas fa-clipboard-list mr-2"></i>
              Quick Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Total Items:</span>
                <span className="font-bold">{wasteData?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biodegradable:</span>
                <span className="font-bold" style={{ color: wasteColorPalette.biodegradable }}>
                  {processedData.biodegradableCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Non-Biodegradable:</span>
                <span className="font-bold" style={{ color: wasteColorPalette['non-biodegradable'] }}>
                  {processedData.nonBiodegradableCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biodegradable Rate:</span>
                <span className="font-bold" style={{
                  color: wasteData && wasteData.length > 0 &&
                    processedData.biodegradableCount / wasteData.length > 0.5
                    ? wasteColorPalette.biodegradable
                    : wasteColorPalette['non-biodegradable']
                }}>
                  {wasteData && wasteData.length > 0
                    ? Math.round((processedData.biodegradableCount / wasteData.length) * 100)
                    : 0}%
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Biodegradability:</div>
                {isClassifying ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-yellow-500"></div>
                    <span className="ml-3 text-yellow-600">Analyzing...</span>
                  </div>
                ) : (
                  <div style={{ height: '120px' }}>
                    <Pie
                      data={biodegradabilityChartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            ...chartOptions.plugins.legend,
                            position: 'bottom',
                            labels: {
                              ...chartOptions.plugins.legend.labels,
                              boxWidth: 12,
                              padding: 10
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WasteVisualization; 