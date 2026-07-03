import { AnalysisEngine } from './src/engine/analyzer';
import { readFileSync } from 'fs';

const fileContent = readFileSync('./components/UploadArea.tsx', 'utf-8');
const result = AnalysisEngine.analyze({ fileName: 'UploadArea.tsx', fileContent });
console.log(JSON.stringify(result.suggestions, null, 2));
