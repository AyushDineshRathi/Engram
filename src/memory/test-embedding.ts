import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../config/env/.env") });

import { EmbeddingService } from "./embeddingService";

const svc = new EmbeddingService();
const results = await svc.generateEmbeddings(["Hello world", "Resume text snippet"]);
console.log(results);