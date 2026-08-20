import * as tf from '@tensorflow/tfjs';

export const MODEL_READY = true; 

// Exact labels from your metadata.json
const MODEL_CLASSES = [
  "Ashwagandha",
  "Brahmi",
  "Tulsi",
  "Neem",
  "Lookalike (non-medicinal)"
];

// The Translation Dictionary
const SPECIES_MAPPING: Record<string, string> = {
  "Ashwagandha": "Withania somnifera (Ashwagandha)",
  "Brahmi": "Bacopa monnieri (Brahmi)",
  "Tulsi": "Ocimum tenuiflorum (Tulsi)",
  "Neem": "Azadirachta indica (Neem)",
  "Lookalike (non-medicinal)": "Unverified / Lookalike (Reject)",
};

let model: tf.LayersModel | null = null;

export async function loadModel() {
  if (model) return model;
  try {
    model = await tf.loadLayersModel('/models/model.json');
    return model;
  } catch (e) {
    console.error("Failed to load model:", e);
    return null;
  }
}

export async function predictSpecies(imageElement: HTMLImageElement | null, fallbackSpecies: string) {
  if (!imageElement) return null;

  if (!MODEL_READY) {
    return {
      name: fallbackSpecies,
      score: Number((0.72 + Math.random() * 0.26).toFixed(2)),
    };
  }

  const loadedModel = await loadModel();
  if (!loadedModel) throw new Error("Model not loaded");

  // Preprocess the image for Teachable Machine (MobileNet expects values from -1 to 1)
  const tensor = tf.browser.fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(tf.scalar(127.5))
    .sub(tf.scalar(1))
    .expandDims();

  const predictions = await loadedModel.predict(tensor) as tf.Tensor;
  const data = await predictions.data();

  const maxConfidence = Math.max(...Array.from(data));
  const classIndex = data.indexOf(maxConfidence);
  
  // FIX IS HERE: Added || "Unknown" to satisfy TypeScript
  const predictedCommonName = MODEL_CLASSES[classIndex] || "Unknown";

  tf.dispose([tensor, predictions]);

  return {
    // FIX IS HERE: No quotes around predictedCommonName
    name: SPECIES_MAPPING[predictedCommonName] || predictedCommonName,
    score: Number(maxConfidence.toFixed(2))
  };
}