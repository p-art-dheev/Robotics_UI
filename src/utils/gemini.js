import { GoogleGenerativeAI } from "@google/generative-ai";

// Access API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to generate waste analysis from detected objects
export async function generateWasteAnalysis(detectedObjects) {
  // Create prompt for the AI
  const prompt = `Analyze this waste data and provide detailed information about it:
                
  Waste Data:
  ${JSON.stringify(detectedObjects, null, 2)}

  Please provide a comprehensive analysis including:
  1. Waste type classification (biodegradable, non-biodegradable, recyclable, hazardous, etc.)
  2. Material composition (plastic, metal, paper, etc.)
  3. Detailed disposal methods for each type
  4. Environmental impact assessment
  5. Recycling possibilities and processes
  6. Eco-friendly alternatives or reduction strategies
  7. Potential contamination issues
  8. Special handling requirements if any
  
  Format the response in clear, well-structured markdown with appropriate headings and bullet points.`;

  try {
    // Generate content using Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate waste analysis");
  }
}

// Function to classify a single waste item using AI
export async function classifyWasteItem(itemLabel) {
  // Create prompt for the AI
  const prompt = `You are an environmental science expert specializing in waste classification.

Please classify this waste item: "${itemLabel}"

Format your response exactly as shown in this JSON format:
{
  "type": "[biodegradable or non-biodegradable]",
  "material": "[primary material, e.g., plastic, paper, wood, metal, glass, etc.]",
  "disposal": "[SPECIFIC ACTIONABLE disposal recommendation with concrete steps - NEVER use 'Check local guidelines']", 
  "recyclable": "[yes, no, or potentially]",
  "hazardous": "[yes or no]"
}

IMPORTANT: For disposal recommendation, provide specific, actionable steps like "Rinse thoroughly, remove labels, place in recycling bin" instead of generic advice like "Check local guidelines".

Provide accurate classification based on environmental science. If you're unsure, make the best determination based on similar items. Always provide a complete response with all fields filled in.`;

  try {
    // Generate content using Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Parse the JSON response
    try {
      const data = JSON.parse(response.text());
      return data;
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      // Fallback with a specific disposal recommendation if parsing fails
      const lowerLabel = itemLabel.toLowerCase();
      let disposal = '';
      
      if (lowerLabel.includes('plastic')) {
        disposal = 'Rinse thoroughly, remove labels if possible, place in plastic recycling';
      } else if (lowerLabel.includes('paper') || lowerLabel.includes('cardboard')) {
        disposal = 'Remove tape/staples, flatten, place in paper recycling';
      } else if (lowerLabel.includes('metal')) {
        disposal = 'Clean, crush if possible, place in metal recycling';
      } else if (lowerLabel.includes('glass')) {
        disposal = 'Rinse, remove caps and lids, place in glass recycling';
      } else if (lowerLabel.includes('organic') || lowerLabel.includes('food')) {
        disposal = 'Place in compost bin or food waste collection';
      } else {
        disposal = 'Separate by material type and recycle accordingly';
      }

      return {
        type: lowerLabel.includes('plastic') ? 'non-biodegradable' : 'biodegradable',
        material: 'unknown',
        disposal: disposal,
        recyclable: 'unknown',
        hazardous: 'no'
      };
    }
  } catch (error) {
    console.error("Error classifying waste item:", error);
    // Return a fallback classification with specific disposal
    const lowerLabel = itemLabel.toLowerCase();
    let disposal = '';
    
    if (lowerLabel.includes('plastic')) {
      disposal = 'Rinse thoroughly, remove labels if possible, place in plastic recycling';
    } else if (lowerLabel.includes('paper') || lowerLabel.includes('cardboard')) {
      disposal = 'Remove tape/staples, flatten, place in paper recycling';
    } else if (lowerLabel.includes('metal')) {
      disposal = 'Clean, crush if possible, place in metal recycling';
    } else if (lowerLabel.includes('glass')) {
      disposal = 'Rinse, remove caps and lids, place in glass recycling';
    } else if (lowerLabel.includes('organic') || lowerLabel.includes('food')) {
      disposal = 'Place in compost bin or food waste collection';
    } else {
      disposal = 'Separate by material type and recycle accordingly';
    }
    
    return {
      type: 'unknown',
      material: 'unknown',
      disposal: disposal,
      recyclable: 'unknown',
      hazardous: 'no'
    };
  }
}

// Function for batch classification of multiple waste items
export async function classifyWasteItems(itemLabels) {
  if (!itemLabels || !Array.isArray(itemLabels) || itemLabels.length === 0) {
    return [];
  }
  
  // Create prompt for the AI to classify multiple items at once
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
      "disposal": "[SPECIFIC ACTIONABLE disposal recommendation with concrete steps - NEVER use 'Check local guidelines']",
      "recyclable": "[yes, no, or potentially]",
      "hazardous": "[yes or no]"
    },
    {
      "label": "[item2]",
      "type": "[biodegradable or non-biodegradable]",
      "material": "[primary material]",
      "disposal": "[SPECIFIC ACTIONABLE disposal recommendation with concrete steps]",
      "recyclable": "[yes, no, or potentially]",
      "hazardous": "[yes or no]"
    }
    // and so on for each item
  ]
}

IMPORTANT: For disposal recommendations, ALWAYS provide specific, actionable steps like "Rinse thoroughly, remove labels, place in recycling bin" instead of generic advice like "Check local guidelines".

Provide accurate classifications based on environmental science. Ensure every item has a complete classification with all fields filled in.`;

  try {
    // Generate content using Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Parse the JSON response
    try {
      const data = JSON.parse(response.text());
      return data.classifications;
    } catch (parseError) {
      console.error("Error parsing LLM batch response:", parseError);
      // Fallback - classify each item with basic logic and specific disposal methods
      return itemLabels.map(label => {
        const lowerLabel = label.toLowerCase();
        let disposal = '';
        
        if (lowerLabel.includes('plastic')) {
          disposal = 'Rinse thoroughly, remove labels if possible, place in plastic recycling';
        } else if (lowerLabel.includes('paper') || lowerLabel.includes('cardboard')) {
          disposal = 'Remove tape/staples, flatten, place in paper recycling';
        } else if (lowerLabel.includes('metal')) {
          disposal = 'Clean, crush if possible, place in metal recycling';
        } else if (lowerLabel.includes('glass')) {
          disposal = 'Rinse, remove caps and lids, place in glass recycling';
        } else if (lowerLabel.includes('organic') || lowerLabel.includes('food')) {
          disposal = 'Place in compost bin or food waste collection';
        } else if (lowerLabel.includes('electronic') || lowerLabel.includes('e-waste')) {
          disposal = 'Take to electronics recycling center or retailer take-back program';
        } else {
          disposal = 'Separate by material type and dispose accordingly';
        }
        
        return {
          label,
          type: lowerLabel.includes('plastic') || lowerLabel.includes('metal') ? 'non-biodegradable' : 'biodegradable',
          material: lowerLabel,
          disposal: disposal,
          recyclable: lowerLabel.includes('plastic') || lowerLabel.includes('paper') || lowerLabel.includes('metal') || lowerLabel.includes('glass') ? 'yes' : 'unknown',
          hazardous: 'no'
        };
      });
    }
  } catch (error) {
    console.error("Error batch classifying waste items:", error);
    // Return fallback classifications with specific disposal instructions
    return itemLabels.map(label => {
      const lowerLabel = label.toLowerCase();
      let disposal = '';
      
      if (lowerLabel.includes('plastic')) {
        disposal = 'Rinse thoroughly, remove labels if possible, place in plastic recycling';
      } else if (lowerLabel.includes('paper') || lowerLabel.includes('cardboard')) {
        disposal = 'Remove tape/staples, flatten, place in paper recycling';
      } else if (lowerLabel.includes('metal')) {
        disposal = 'Clean, crush if possible, place in metal recycling';
      } else if (lowerLabel.includes('glass')) {
        disposal = 'Rinse, remove caps and lids, place in glass recycling';
      } else if (lowerLabel.includes('organic') || lowerLabel.includes('food')) {
        disposal = 'Place in compost bin or food waste collection';
      } else if (lowerLabel.includes('electronic') || lowerLabel.includes('e-waste')) {
        disposal = 'Take to electronics recycling center or retailer take-back program';
      } else {
        disposal = 'Separate by material type and dispose accordingly';
      }
      
      return {
        label,
        type: 'unknown',
        material: 'unknown',
        disposal: disposal,
        recyclable: 'unknown',
        hazardous: 'no'
      };
    });
  }
}

// Function to simulate API call (for development/testing)
export async function simulateGeminiAPICall() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Return simulated response
  return `## Waste Analysis Report

### 1. Waste Classification
- **Red Cubes (4 items)**
  - Type: Non-biodegradable plastic
  - Composition: Likely polystyrene or similar plastic polymer
  - Recyclability: Conditionally recyclable if clean

- **Yellow Cubes (3 items)**
  - Type: Recyclable plastic
  - Composition: Likely polyethylene or polypropylene
  - Recyclability: Highly recyclable

### 2. Disposal Methods
- **Red Cubes**
  - ♻ Clean items: Place in plastic recycling bin
  - 🗑 Contaminated items: Dispose in general waste
  - ⚠ Avoid mixing with food waste to prevent contamination

- **Yellow Cubes**
  - ♻ Always recyclable when clean
  - 🧼 Rinse if contaminated with food/liquids
  - 🔍 Check local guidelines for specific plastic codes

### 3. Environmental Impact
- **Plastic Waste Impact**
  - Non-recycled plastic can persist for 450+ years
  - Contributes to microplastic pollution
  - Recycling reduces energy use by 75% compared to new production

### 4. Recycling Process
1. Collection and sorting by material/color
2. Shredding and washing
3. Melting and pelletizing
4. Manufacturing into new products

### 5. Eco-Friendly Alternatives
- Replace disposable plastic items with:
  - Glass or metal containers
  - Biodegradable plant-based materials
  - Reusable silicone products

### 6. Special Considerations
- 🚫 Never burn plastic - releases toxic fumes
- ♻ Separate by color for better recycling quality
- 🏭 Support extended producer responsibility programs`;
}

// Simulate a waste item classification (for testing without API calls)
export function simulateWasteItemClassification(itemLabel) {
  const lowerLabel = itemLabel.toLowerCase();
  
  // Basic simulation rules
  if (lowerLabel.includes('plastic') || 
      lowerLabel.includes('bottle') || 
      lowerLabel.includes('cup') || 
      lowerLabel.includes('styrofoam') || 
      lowerLabel.includes('container')) {
    return {
      type: 'non-biodegradable',
      material: 'plastic',
      disposal: 'Recycle if clean and marked with recycling symbol',
      recyclable: 'yes',
      hazardous: 'no'
    };
  } else if (lowerLabel.includes('paper') || 
             lowerLabel.includes('cardboard') || 
             lowerLabel.includes('newspaper')) {
    return {
      type: 'biodegradable',
      material: 'paper',
      disposal: 'Recycle or compost if not contaminated',
      recyclable: 'yes',
      hazardous: 'no'
    };
  } else if (lowerLabel.includes('wood') || 
             lowerLabel.includes('bamboo') || 
             lowerLabel.includes('cork')) {
    return {
      type: 'biodegradable',
      material: 'wood',
      disposal: 'Compost or wood recycling',
      recyclable: 'potentially',
      hazardous: 'no'
    };
  } else if (lowerLabel.includes('metal') || 
             lowerLabel.includes('aluminum') || 
             lowerLabel.includes('tin') || 
             lowerLabel.includes('can')) {
    return {
      type: 'non-biodegradable',
      material: 'metal',
      disposal: 'Recycle in metal collection',
      recyclable: 'yes',
      hazardous: 'no'
    };
  } else if (lowerLabel.includes('glass') || 
             lowerLabel.includes('bottle glass')) {
    return {
      type: 'non-biodegradable',
      material: 'glass',
      disposal: 'Recycle in glass collection',
      recyclable: 'yes',
      hazardous: 'no'
    };
  } else if (lowerLabel.includes('food') || 
             lowerLabel.includes('organic') || 
             lowerLabel.includes('fruit') || 
             lowerLabel.includes('vegetable')) {
    return {
      type: 'biodegradable',
      material: 'organic',
      disposal: 'Compost or food waste collection',
      recyclable: 'compostable',
      hazardous: 'no'
    };
  } else if (lowerLabel.includes('battery') || 
             lowerLabel.includes('electronic') || 
             lowerLabel.includes('paint') || 
             lowerLabel.includes('chemical')) {
    return {
      type: 'non-biodegradable',
      material: 'hazardous',
      disposal: 'Special waste collection point',
      recyclable: 'special handling',
      hazardous: 'yes'
    };
  }
  
  // Default fallback
  return {
    type: 'unknown',
    material: 'mixed',
    disposal: 'Check local waste guidelines',
    recyclable: 'unknown',
    hazardous: 'no'
  };
} 