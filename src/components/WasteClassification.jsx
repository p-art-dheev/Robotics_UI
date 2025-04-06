import React, { useEffect, useState } from 'react';
import { classifyWasteItems } from '../utils/gemini';

const WasteClassification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [wasteData, setWasteData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setIsVisible(true);
    
    // Load waste data from waste.json
    const fetchWasteData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the waste.json file
        const response = await fetch('/waste.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch waste data: ${response.status}`);
        }
        
        const wasteJson = await response.json();
        
        // Extract unique labels from waste.json
        const uniqueLabels = [...new Set(wasteJson.map(item => {
          return item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase();
        }))];
        
        console.log("Unique waste labels found:", uniqueLabels);
        
        // Call Gemini AI to classify these items with specific instructions
        try {
          // Enhanced prompt to include reusable instead of hazardous
          const enhancedPrompt = `You are an environmental science expert specializing in waste classification.

Please classify these waste items:
${uniqueLabels.map((label, index) => `${index + 1}. ${label}`).join('\n')}

Format your response exactly as shown in this JSON format:
{
  "classifications": [
    {
      "label": "[exact item label]",
      "type": "[must be either 'biodegradable' or 'non-biodegradable', never 'unknown']",
      "material": "[specific material description, never 'unknown']",
      "disposal": "[specific disposal recommendation, never 'unknown']",
      "recyclable": "[must be 'yes', 'no', or 'potentially', never 'unknown']",
      "reusable": "[must be 'yes', 'no', or 'potentially', never 'unknown']"
    },
    ...
  ]
}

IMPORTANT: Never use generic terms like "Unknown". If you are uncertain about any classification:
- For material, provide the most likely material based on the item name
- For type, infer whether it's more likely biodegradable or non-biodegradable
- For recyclable/reusable, make an educated assumption based on similar items
- For reusable, 'yes' means the item can be reused multiple times without significant degradation, 'potentially' means limited reuse possible, 'no' means single-use
- Always provide specific, detailed information even when making educated guesses

Provide accurate classifications based on environmental science. Ensure every item has a complete classification with all fields filled in with specific values.`;

          const aiClassifications = await classifyWasteItems(uniqueLabels, enhancedPrompt);
          
          // Process AI results into the format needed for the table
          const processedData = uniqueLabels.map(label => {
            const aiData = aiClassifications.find(
              item => item.label.toLowerCase() === label.toLowerCase()
            );
            
            if (aiData) {
              // Determine recyclability based on the specified rules
              let recyclability;
              if (aiData.recyclable === "yes" || aiData.recyclable.includes("yes")) {
                recyclability = "Yes";
              } else if (aiData.recyclable === "no" || aiData.recyclable.includes("no")) {
                recyclability = "No";
              } else if (aiData.recyclable === "potentially" || aiData.recyclable.includes("potential") || 
                        aiData.recyclable.includes("possible") || aiData.recyclable.includes("maybe")) {
                recyclability = "Potentially";
              } else {
                // If completely unsure or ambiguous, default to "No"
                recyclability = "No";
              }
              
              // Ensure we never have "unknown" in material description
              let material = aiData.material;
              
              // Check if material is missing, contains "unknown", or is too generic
              if (!material || 
                  material.toLowerCase().includes('unknown') || 
                  material.toLowerCase() === "plastic" ||
                  material.toLowerCase() === "metal" ||
                  material.toLowerCase() === "paper" ||
                  material.toLowerCase() === "glass" ||
                  material.toLowerCase() === "textile" ||
                  material.toLowerCase() === "wood" ||
                  material.length < 10) {
                // Replace with detailed technical description
                material = ensureSpecificMaterial(label);
              }
              
              return {
                label: label,
                material: material,
                biodegradable: aiData.type === "biodegradable" ? "Yes" : 
                              aiData.type === "non-biodegradable" ? "No" : "Partially",
                recyclable: recyclability,
                reusable: aiData.reusable === "yes" ? "Yes" : 
                          aiData.reusable === "potentially" ? "Potentially" : "No"
              };
            } else {
              // Improved fallback with more specific info
              return enhancedFallbackClassification(label);
            }
          });
          
          setWasteData(processedData);
          console.log("AI-classified waste data:", processedData);
        } catch (aiError) {
          console.error("AI classification failed:", aiError);
          
          // If AI fails, create basic classifications based on waste labels
          const basicClassifications = uniqueLabels.map(label => fallbackClassification(label));
          setWasteData(basicClassifications);
        }
      } catch (fetchError) {
        console.error("Error fetching waste data:", fetchError);
        setError("Failed to load waste data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWasteData();
  }, []);
  
  // Fallback function to classify waste based on label
  const fallbackClassification = (label) => {
    const lowerLabel = label.toLowerCase();
    
    // Basic classification logic based on common waste types
    const isBiodegradable = 
      lowerLabel.includes('paper') || 
      lowerLabel.includes('cardboard') || 
      lowerLabel.includes('textile') || 
      lowerLabel.includes('organic') || 
      lowerLabel.includes('food') || 
      lowerLabel.includes('wood');
      
    const isRecyclable = 
      lowerLabel.includes('paper') || 
      lowerLabel.includes('cardboard') || 
      lowerLabel.includes('metal') || 
      lowerLabel.includes('glass') ||
      lowerLabel.includes('plastic');
      
    // Determine material type
    let material = "Unknown";
    if (lowerLabel.includes('paper')) material = "Paper";
    else if (lowerLabel.includes('cardboard')) material = "Cardboard";
    else if (lowerLabel.includes('plastic')) material = "Plastic";
    else if (lowerLabel.includes('textile')) material = "Textile";
    else if (lowerLabel.includes('glass')) material = "Glass";
    else if (lowerLabel.includes('metal')) material = "Metal";
    else if (lowerLabel.includes('e-waste')) material = "Electronic components";
    else material = lowerLabel;
    
    return {
      label: label,
      material: material,
      biodegradable: isBiodegradable ? "Yes" : "No",
      recyclable: isRecyclable ? "Yes" : "Potentially",
      reusable: lowerLabel.includes('e-waste') ? "Potentially" : "No"
    };
  };

  // Enhanced fallback function with improved recyclability logic
  const enhancedFallbackClassification = (label) => {
    const lowerLabel = label.toLowerCase();
    
    // More detailed classification logic
    const isBiodegradable = 
      lowerLabel.includes('paper') || 
      lowerLabel.includes('cardboard') || 
      lowerLabel.includes('textile') || 
      lowerLabel.includes('organic') || 
      lowerLabel.includes('food') || 
      lowerLabel.includes('wood');
      
    // Updated recyclability logic based on the specified rules
    let recyclability;
    if (lowerLabel.includes('paper') || 
        lowerLabel.includes('cardboard') || 
        lowerLabel.includes('metal') || 
        lowerLabel.includes('glass') ||
        (lowerLabel.includes('plastic') && !lowerLabel.includes('bag'))) {
      // These materials are commonly recyclable
      recyclability = "Yes";
    } else if (lowerLabel.includes('e-waste') || 
               lowerLabel.includes('electronic')) {
      // E-waste might be recyclable at special facilities
      recyclability = "Potentially";
    } else if (lowerLabel.includes('textile') || 
               lowerLabel.includes('fabric')) {
      // Textiles could be recycled in some programs
      recyclability = "Potentially";
    } else if (lowerLabel.includes('food') || 
               lowerLabel.includes('organic') || 
               lowerLabel.includes('soiled')) {
      // Food waste and soiled items typically aren't recyclable
      recyclability = "No";
    } else {
      // For anything else we're unsure about, default to "No"
      recyclability = "No";
    }
    
    // Detailed material determination
    let material;
    if (lowerLabel.includes('paper')) material = "Paper fiber";
    else if (lowerLabel.includes('cardboard')) material = "Processed paper pulp";
    else if (lowerLabel.includes('plastic')) material = "Synthetic polymer";
    else if (lowerLabel.includes('textile')) material = "Woven fabric fibers";
    else if (lowerLabel.includes('glass')) material = "Silica-based material";
    else if (lowerLabel.includes('metal')) material = "Metallic alloy";
    else if (lowerLabel.includes('e-waste')) material = "Electronic components and circuitry";
    else if (lowerLabel.includes('wood')) material = "Processed timber";
    else material = ensureSpecificMaterial(label);
    
    // Determine reusability based on material and item type
    let reusability = "No"; // Default to "No" for most items
    
    if (lowerLabel.includes('e-waste')) {
      reusability = "Potentially";
    } else if (lowerLabel.includes('glass') || lowerLabel.includes('metal')) {
      reusability = "Yes"; // Glass and metal containers are typically reusable
    } else if (lowerLabel.includes('textile') || lowerLabel.includes('fabric')) {
      reusability = "Yes"; // Textiles can often be reused
    } else if (lowerLabel.includes('cardboard') || lowerLabel.includes('paper')) {
      reusability = "No"; // Paper products generally not reusable
    } else if (lowerLabel.includes('wood')) {
      reusability = "Potentially"; // Wood can sometimes be reused
    } else if (lowerLabel.includes('plastic')) {
      if (lowerLabel.includes('bottle') || lowerLabel.includes('container')) {
        reusability = "Potentially"; // Some plastic containers can be reused
      } else {
        reusability = "No"; // Most other plastic items aren't reusable
      }
    }
    
    return {
      label: label,
      material: material,
      biodegradable: isBiodegradable ? "Yes" : "No",
      recyclable: recyclability,
      reusable: reusability
    };
  };

  // Enhanced function to ensure specific material description with detailed technical names
  function ensureSpecificMaterial(label) {
    const lowerLabel = label.toLowerCase();
    
    // Natural/organic items that need specific handling
    if (lowerLabel.includes('banana') || lowerLabel.includes('fruit peel') || lowerLabel.includes('vegetable peel')) {
      return "Plant-based cellulose and organic fibers";
    }
    
    if (lowerLabel.includes('coconut') || lowerLabel.includes('nut shell')) {
      return "Lignin and cellulose plant fibers";
    }
    
    if (lowerLabel.includes('jute') || lowerLabel.includes('hemp') || lowerLabel.includes('cotton bag')) {
      return "Natural plant-based fibers";
    }
    
    // Detailed material mapping for common waste types
    if (lowerLabel.includes('paper')) {
      if (lowerLabel.includes('magazine') || lowerLabel.includes('glossy')) {
        return "Coated paper with clay and binding agents";
      } else if (lowerLabel.includes('newspaper')) {
        return "Low-grade recycled cellulose fiber";
      } else {
        return "Processed cellulose fiber";
      }
    }
    
    if (lowerLabel.includes('cardboard') || lowerLabel.includes('card')) {
      if (lowerLabel.includes('corrugated')) {
        return "Corrugated paper pulp with fluted medium";
      } else {
        return "Compressed paper pulp fibers";
      }
    }
    
    if (lowerLabel.includes('plastic')) {
      if (lowerLabel.includes('bottle') || lowerLabel.includes('pet')) {
        return "Polyethylene terephthalate (PET)";
      } else if (lowerLabel.includes('bag')) {
        return "Low-density polyethylene (LDPE)";
      } else if (lowerLabel.includes('container') || lowerLabel.includes('tub')) {
        return "High-density polyethylene (HDPE)";
      } else if (lowerLabel.includes('wrap')) {
        return "Polyvinyl chloride (PVC) film";
      } else if (lowerLabel.includes('pipe')) {
        return "Polyvinyl chloride (PVC)";
      } else {
        return "Thermoplastic polymer";
      }
    }
    
    if (lowerLabel.includes('textile') || lowerLabel.includes('cloth') || lowerLabel.includes('fabric')) {
      if (lowerLabel.includes('cotton')) {
        return "Cotton cellulose fibers";
      } else if (lowerLabel.includes('polyester')) {
        return "Polyester synthetic fibers";
      } else if (lowerLabel.includes('wool')) {
        return "Keratin protein fibers";
      } else if (lowerLabel.includes('jute')) {
        return "Jute plant bast fibers";
      } else {
        return "Woven textile fiber composite";
      }
    }
    
    if (lowerLabel.includes('glass')) {
      return "Amorphous silica with sodium and calcium oxides";
    }
    
    if (lowerLabel.includes('metal')) {
      if (lowerLabel.includes('aluminum') || lowerLabel.includes('can')) {
        return "Aluminum alloy";
      } else if (lowerLabel.includes('steel')) {
        return "Carbon steel alloy";
      } else if (lowerLabel.includes('tin')) {
        return "Tin-plated steel";
      } else {
        return "Metal alloy composite";
      }
    }
    
    if (lowerLabel.includes('e-waste') || lowerLabel.includes('electronic')) {
      return "Circuit boards with copper, gold, and polymer substrate";
    }
    
    if (lowerLabel.includes('wood')) {
      if (lowerLabel.includes('plywood')) {
        return "Layered wood veneer with adhesive";
      } else if (lowerLabel.includes('particleboard')) {
        return "Compressed wood particles with resin binder";
      } else {
        return "Cellulose and lignin composite";
      }
    }
    
    if (lowerLabel.includes('organic') || lowerLabel.includes('food')) {
      if (lowerLabel.includes('fruit') || lowerLabel.includes('vegetable')) {
        return "Plant-based cellulose and carbohydrates";
      } else if (lowerLabel.includes('meat')) {
        return "Protein and fat-based organic matter";
      } else {
        return "Biodegradable organic compounds";
      }
    }
    
    // For items not explicitly matched, determine 2-3 closest materials based on common objects
    // instead of using the generic "Multi-material composite"
    if (lowerLabel.includes('toy')) {
      return "Plastic, metal, and fabric components";
    } else if (lowerLabel.includes('furniture')) {
      return "Wood, metal, and textile materials";
    } else if (lowerLabel.includes('packaging')) {
      return "Paper and plastic laminate";
    } else if (lowerLabel.includes('container')) {
      return "Plastic polymer with metal components";
    } else if (lowerLabel.includes('device')) {
      return "Electronic components and plastic housing";
    } else if (lowerLabel.includes('bag')) {
      if (lowerLabel.includes('plastic') || lowerLabel.includes('poly')) {
        return "Low-density polyethylene film";
      } else {
        return "Woven natural or synthetic fibers";
      }
    } else if (lowerLabel.includes('box')) {
      return "Pressed paper fibers and adhesive";
    } else if (lowerLabel.includes('bottle')) {
      return "PET plastic with polymer label";
    } else if (lowerLabel.includes('can')) {
      return "Aluminum with polymer coating";
    } else if (lowerLabel.includes('wrapper')) {
      return "Plastic film and metallic foil";
    } else if (lowerLabel.includes('cup') || lowerLabel.includes('plate')) {
      return "Molded paper pulp or polymer";
    } else if (lowerLabel.includes('clothing')) {
      return "Natural and synthetic textile fibers";
    } else if (lowerLabel.includes('shell')) {
      return "Natural calcium carbonate and protein matrix";
    }
    
    // Last resort - choose materials that make sense based on word analysis
    // Try to identify 2-3 likely components rather than using "Multi-material composite"
    const materialKeywords = {
      'plastic': 'Synthetic polymer',
      'wood': 'Processed timber',
      'paper': 'Cellulose fiber',
      'metal': 'Metal alloy',
      'glass': 'Silica-based material',
      'fabric': 'Textile fibers',
      'organic': 'Biodegradable material',
      'ceramic': 'Clay-based ceramic',
      'rubber': 'Vulcanized elastomer',
      'leather': 'Processed animal hide',
      'plant': 'Cellulose-based organic material',
      'leaf': 'Plant cellulose and fiber',
      'bamboo': 'Natural cellulose fibers',
      'cotton': 'Natural plant fibers',
      'food': 'Organic biodegradable material'
    };
    
    // Find the most likely materials based on keywords
    const likelyMaterials = [];
    for (const [keyword, material] of Object.entries(materialKeywords)) {
      if (lowerLabel.includes(keyword)) {
        likelyMaterials.push(material);
      }
    }
    
    // Return 2-3 most likely materials or a default if none match
    if (likelyMaterials.length > 0) {
      return likelyMaterials.slice(0, 3).join(" and ");
    }
    
    // Better fallback logic for natural items vs. manufactured items
    if (lowerLabel.includes('peel') || 
        lowerLabel.includes('seed') || 
        lowerLabel.includes('fruit') || 
        lowerLabel.includes('vegetable') || 
        lowerLabel.includes('leaf') || 
        lowerLabel.includes('food')) {
      return "Organic biodegradable material";
    }
    
    // Ultimate fallback - only use for truly unidentifiable items
    if (lowerLabel.length > 0) {
      return "Composite materials";
    }
    
    return "Unidentified material";
  }

  return (
    <section className="w-full">
      <div className="card w-full transform transition-all duration-500 ease-in-out hover:shadow-xl">
        <h3 className="card-title flex items-center group">
          <i className="fas fa-recycle mr-2 text-emerald-500 transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-125"></i>
          <span className="transition-all duration-300 group-hover:text-emerald-600">Waste Type Classification & Material Composition</span>
        </h3>
        
        <div className={`w-full p-4 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
              <span className="ml-3 text-emerald-600">Loading waste classification data...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          ) : (
            <div className="overflow-hidden border-2 border-gray-600 rounded-lg shadow-lg w-full max-w-full transition-all duration-300 hover:shadow-2xl hover:border-emerald-600">
              <table className="w-full border-collapse bg-white table-auto rounded-lg overflow-hidden">
                <colgroup>
                  <col style={{ width: '250px' }} />
                  <col style={{ width: '500px' }} />
                  <col style={{ width: '168px' }} />
                  <col style={{ width: '168px' }} />
                  <col style={{ width: '168px' }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: '#4cb454', height: '35px' }} className="transition-colors duration-300 hover:bg-gray-600">
                    <th className="py-6 px-4 text-center font-bold text-white border-2 border-gray-600 first:rounded-tl-lg transition-all duration-300 hover:bg-emerald-700" style={{ verticalAlign: 'middle' }}>Item</th>
                    <th className="py-6 px-4 text-center font-bold text-white border-2 border-gray-600 transition-all duration-300 hover:bg-emerald-700" style={{ verticalAlign: 'middle' }}>Material Composition</th>
                    <th className="py-6 px-4 text-center font-bold text-white border-2 border-gray-600 transition-all duration-300 hover:bg-emerald-700" style={{ verticalAlign: 'middle' }}>Biodegradable</th>
                    <th className="py-6 px-4 text-center font-bold text-white border-2 border-gray-600 transition-all duration-300 hover:bg-emerald-700" style={{ verticalAlign: 'middle' }}>Recyclable</th>
                    <th className="py-6 px-4 text-center font-bold text-white border-2 border-gray-600 last:rounded-tr-lg transition-all duration-300 hover:bg-emerald-700" style={{ verticalAlign: 'middle' }}>Reusable</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteData.map((item, index) => (
                    <tr 
                      key={index} 
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#ecf9cd' : '#c5f1be',
                        transitionDelay: `${index * 100}ms`,
                      }}
                      className={`
                        hover:bg-gray-200 
                        ${index === wasteData.length - 1 ? 'last-row' : ''} 
                        transform transition-all duration-300 hover:scale-[1.01]
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                      `}
                    >
                      <td className={`py-3 px-4 text-center border-2 border-gray-400 ${index === wasteData.length - 1 ? 'rounded-bl-lg' : ''} transition-all duration-300`} style={{ verticalAlign: 'middle' }}>
                        <div className="flex items-center justify-center h-full">
                          <span className="text-blue-700 font-semibold transition-all duration-300 hover:text-blue-900 hover:scale-110 break-words w-full">{item.label}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-center border-2 border-gray-400 transition-all duration-300`} style={{ verticalAlign: 'middle' }}>
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-800 font-medium transition-all duration-300 hover:font-semibold break-words w-full max-w-[300px]">{item.material}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-center border-2 border-gray-400 transition-all duration-300`} style={{ verticalAlign: 'middle' }}>
                        <div className="flex justify-center items-center h-full">
                          <span className={`
                            inline-block min-w-[90px] text-center font-semibold
                            ${item.biodegradable === "Yes" 
                              ? "text-white bg-green-600 border-2 border-green-800 hover:bg-green-700" 
                              : item.biodegradable === "No" 
                                ? "text-white bg-red-600 border-2 border-red-800 hover:bg-red-700" 
                                : "text-gray-800 bg-yellow-400 border-2 border-yellow-600 hover:bg-yellow-500"
                            } px-3 py-1 rounded-md transition-all duration-300 hover:shadow-md hover:scale-105
                          `}>
                            {item.biodegradable}
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-center border-2 border-gray-400 transition-all duration-300`} style={{ verticalAlign: 'middle' }}>
                        <div className="flex justify-center items-center h-full">
                          <span className={`
                            inline-block min-w-[90px] text-center font-semibold
                            ${item.recyclable === "Yes" 
                              ? "text-white bg-green-600 border-2 border-green-800 hover:bg-green-700" 
                              : item.recyclable.includes("No") 
                                ? "text-white bg-red-600 border-2 border-red-800 hover:bg-red-700" 
                                : "text-gray-800 bg-yellow-400 border-2 border-yellow-600 hover:bg-yellow-500"
                            } px-3 py-1 rounded-md transition-all duration-300 hover:shadow-md hover:scale-105
                          `}>
                            {item.recyclable}
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-center border-2 border-gray-400 ${index === wasteData.length - 1 ? 'rounded-br-lg' : ''} transition-all duration-300`} style={{ verticalAlign: 'middle' }}>
                        <div className="flex justify-center items-center h-full">
                          <span className={`
                            inline-block min-w-[90px] text-center font-semibold
                            ${item.reusable === "Yes" 
                              ? "text-white bg-green-600 border-2 border-green-800 hover:bg-green-700" 
                              : item.reusable === "No" 
                                ? "text-white bg-red-600 border-2 border-red-800 hover:bg-red-700" 
                                : "text-gray-800 bg-yellow-400 border-2 border-yellow-600 hover:bg-yellow-500"
                            } px-3 py-1 rounded-md transition-all duration-300 hover:shadow-md hover:scale-105
                          `}>
                            {item.reusable}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
    
  );
};

export default WasteClassification; 