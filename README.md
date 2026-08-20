Markdown
# RootCode 🌿

> Transparent, AI-Verified Supply Chain Provenance for Ayurvedic Herbs.

RootCode is a modern web application designed to bring trust and traceability to the Ayurvedic supply chain. By combining client-side machine learning, strict geolocation tagging, and cryptographic ledger entries, RootCode ensures that raw medicinal herbs are accurately identified and immutably tracked from the moment they are harvested in the field.

## ✨ Key Features

* **Real-Time AI Species Verification:** Utilizes a custom-trained machine learning model via TensorFlow.js to verify plant species (e.g., *Withania somnifera*, *Ocimum tenuiflorum*) directly in the browser, flagging human data-entry errors instantly.
* **Geo-Tagged Origin:** Captures precise GPS coordinates of the harvest location to ensure geographical authenticity.
* **Immutable Ledger State:** Generates cryptographic hashes for each batch, creating a tamper-proof audit trail of the herb's journey.
* **Automated Scientific Translation:** Seamlessly maps common ML classification labels to their verified scientific taxonomic names.
* **Exportable Provenance:** Generates downloadable certificates for verified batches to be used in downstream manufacturing or QA processes.

## 🛠️ Tech Stack

* **Frontend:** React, Next.js / Vite, TypeScript, TanStack Router
* **Styling:** Tailwind CSS, Shadcn UI, Lucide Icons
* **Machine Learning:** TensorFlow.js (@tensorflow/tfjs), Teachable Machine
* **Backend / Database:** Supabase (Data Provider & Storage)

## 🚀 Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine. 

### Installation

1. **Clone the repository:**
   ```
   git clone [https://github.com/your-username/rootcode-trace.git](https://github.com/your-username/rootcode-trace.git)
   cd rootcode-trace
   ```
Install dependencies:
```
npm install
```
Configure the AI Model:
Ensure your trained Teachable Machine model files are placed in the public directory so the client-side router can fetch them:

* public/models/model.json
* public/models/metadata.json
* public/models/weights.bin

Run the development server:
```
npm run dev
```
Open the local URL provided in your terminal (usually http://localhost:5173 or http://localhost:3000) to view the application.

🧠 How the AI Verification Works
RootCode runs inference entirely on the client side for maximum privacy and offline capability.

* The user uploads a harvest photo via the browser.
* The image is preprocessed into a multi-dimensional tensor.
* The TensorFlow.js model predicts the class index.
* A custom mapping dictionary translates the raw model output into its scientific nomenclature before evaluating it against the user's claimed species

## 🤖 Development Process & Acknowledgments
To maximize efficiency during the hackathon, the initial UI boilerplate and styling were rapidly prototyped using [Lovable](https://lovable.dev/). This allowed the core engineering focus to remain entirely on writing the custom TensorFlow.js machine learning integration, building the translation dictionary bridge, and managing the complex React state for the ledger data flow.
