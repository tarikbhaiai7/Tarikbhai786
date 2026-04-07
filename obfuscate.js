import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const distDir = path.join(process.cwd(), 'dist', 'assets');

if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir);
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(distDir, file);
      const code = fs.readFileSync(filePath, 'utf8');
      
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.5,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 2,
        stringArrayWrappersType: 'variable',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
      });
      
      fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
      console.log(`Obfuscated: ${file}`);
    }
  });
} else {
  console.log('No dist/assets directory found. Skipping obfuscation.');
}
