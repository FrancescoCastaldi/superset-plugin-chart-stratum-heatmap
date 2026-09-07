#!/usr/bin/env node

/**
 * StratumHeatmap — Automated Chart Plugin Installer for Apache Superset
 * Author: Francesco Castaldi
 * Description: Cross-platform zero-dependency Node.js installer for integrating
 * the StratumHeatmap (ECharts Matrix Grid) Chart Plugin into an existing Superset repository.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[94m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const UI = {
  banner: () => {
    try {
      console.clear();
    } catch (e) {}
    console.log(`${colors.cyan}${colors.bright}====================================================================`);
    console.log('   🔥  STRATUM HEATMAP CHART PLUGIN FOR APACHE SUPERSET  🔥');
    console.log('       Interactive ECharts Matrix Grid & Density Visualizer       ');
    console.log('====================================================================');
    console.log('      ___ _             _                 _   _            _   ');
    console.log('     / __| |_ _ _ __ _ | |_ _  _ _ __    | | | |___ __ _ _| |_ ');
    console.log('     \\__ \\  _| \'_/ _` ||  _| || | \'  \\   | |_| / -_) _` |_   _|');
    console.log('     |___/\\__|_| \\__,_| \\__|\\_,_|_|_|_|   \\___/\\___\\__,_|  \\__| ');
    console.log('                                                               ');
    console.log('                🚀  AUTOMATED ZERO-DEP INSTALLER  🚀           ');
    console.log(`====================================================================${colors.reset}\n`);
  },
  step: (num, title) => {
    console.log(`\n${colors.cyan}${colors.bright}▶ Step ${num}: ${title}${colors.reset}`);
    console.log(`${colors.dim}--------------------------------------------------------------------${colors.reset}`);
  },
  success: (msg) => {
    console.log(`  ${colors.green}✔ ${msg}${colors.reset}`);
  },
  info: (msg) => {
    console.log(`  ${colors.blue}ℹ ${msg}${colors.reset}`);
  },
  warn: (msg) => {
    console.log(`  ${colors.yellow}⚠ ${msg}${colors.reset}`);
  },
  error: (msg) => {
    console.log(`  ${colors.red}✘ ${msg}${colors.reset}`);
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pluginDir = path.resolve(__dirname, '..');
let supersetDir = '';

UI.banner();

function findSupersetCandidates() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const candidates = [
    'C:\\Users\\admmaps\\superset_6_1_0\\superset',
    path.join(home, 'superset_6_1_0', 'superset'),
    path.resolve('D:\\Sviluppo\\superset'),
    path.resolve(pluginDir, '..', 'superset'),
    path.resolve(pluginDir, '..', 'apache-superset'),
    path.resolve(pluginDir, '..', 'superset-6.1.0'),
    path.join(home, 'Desktop', 'superset'),
    path.join(home, 'OneDrive - mapsengineering.com', 'superset-6.1.0'),
    path.join(home, 'superset'),
    path.join(home, 'Projects', 'superset'),
    path.join(home, 'dev', 'superset'),
    path.join(home, 'repos', 'superset'),
  ];

  if (home && fs.existsSync(home)) {
    try {
      const homeDirs = fs.readdirSync(home);
      for (const d of homeDirs) {
        if (d.toLowerCase().startsWith('onedrive')) {
          candidates.push(path.join(home, d, 'superset'));
          candidates.push(path.join(home, d, 'superset-6.1.0'));
        }
      }
    } catch (e) {}
  }

  const validCandidates = [];
  for (const cand of candidates) {
    try {
      if (fs.existsSync(path.join(cand, 'superset-frontend', 'package.json'))) {
        const resolved = path.resolve(cand);
        if (!validCandidates.includes(resolved)) {
          validCandidates.push(resolved);
        }
      }
    } catch (e) {}
  }
  return validCandidates;
}

function startInstallation() {
  const frontendDir = path.join(supersetDir, 'superset-frontend');
  if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
    UI.error(`Impossibile trovare 'superset-frontend/package.json' in ${supersetDir}`);
    rl.close();
    process.exit(1);
  }

  UI.info(`Cartella Plugin:   ${colors.bright}${pluginDir}${colors.reset}`);
  UI.info(`Cartella Superset: ${colors.bright}${supersetDir}${colors.reset}`);
  UI.info(`Frontend Superset: ${colors.bright}${frontendDir}${colors.reset}`);

  try {
    // Step 1: Clean previous installations & conflicts
    step1CleanPrevious(frontendDir);

    // Step 2: Build plugin
    step2BuildPlugin();

    // Step 3: Copy plugin files
    step3CopyPlugin(frontendDir);

    // Step 4: Patch MainPreset
    step4PatchPreset(frontendDir);

    // Step 5: Frontend Safety Cleanup
    step5SafetyCleanup(frontendDir);

    // Step 6: Instructions
    step6PrintInstructions();

    rl.close();
  } catch (err) {
    UI.error(`Installazione interrotta per errore: ${err.message}`);
    rl.close();
    process.exit(1);
  }
}

function step1CleanPrevious(frontendDir) {
  UI.step(1, 'Pulizia installazioni precedenti e conflitti');

  const targetPluginDir = path.join(frontendDir, 'plugins', 'superset-plugin-chart-stratum-heatmap');
  if (fs.existsSync(targetPluginDir)) {
    try {
      fs.rmSync(targetPluginDir, { recursive: true, force: true });
      UI.info('Rimossa cartella plugin preesistente per garantire una copia pulita.');
    } catch (e) {
      UI.warn(`Impossibile rimuovere completamente ${targetPluginDir}: ${e.message}`);
    }
  }

  // Pulizia vecchi import/registrazioni da MainPreset per evitare duplicazioni
  const presetCandidates = [
    path.join(frontendDir, 'src', 'visualizations', 'presets', 'MainPreset.ts'),
    path.join(frontendDir, 'src', 'visualizations', 'presets', 'MainPreset.js'),
    path.join(frontendDir, 'src', 'setup', 'setupPlugins.ts'),
    path.join(frontendDir, 'src', 'setup', 'setupPlugins.js'),
  ];

  for (const presetFile of presetCandidates) {
    if (fs.existsSync(presetFile)) {
      try {
        let content = fs.readFileSync(presetFile, 'utf8');
        const originalContent = content;

        // Rimuove eventuali vecchi import
        content = content.replace(/import\s*\{[^}]*StratumHeatmap(?:Chart)?Plugin[^}]*\}\s*from\s*['"][^'"]*superset-plugin-chart-stratum-heatmap[^'"]*['"];?\r?\n?/g, '');
        // Rimuove eventuali registrazioni duplicate
        content = content.replace(/[ \t]*new\s+StratumHeatmap(?:Chart)?Plugin\(\)\.configure\(\{[\s\S]*?\}\)(?:\.register\(\))?,?\r?\n?/g, '');

        if (content !== originalContent) {
          fs.writeFileSync(presetFile, content, 'utf8');
          UI.info(`Rimossa registrazione obsoleta da ${path.basename(presetFile)} per re-iniezione pulita.`);
        }
      } catch (e) {
        UI.warn(`Impossibile verificare ${path.basename(presetFile)}: ${e.message}`);
      }
    }
  }

  UI.success('Fase di pulizia completata.');
}

function step2BuildPlugin() {
  UI.step(2, 'Compilazione del Plugin (TypeScript build)');

  const distDir = path.join(pluginDir, 'dist');
  UI.info('Esecuzione build locale del plugin per rigenerare dist/...');
  try {
    execSync('npm run build', { cwd: pluginDir, stdio: 'inherit' });
    if (fs.existsSync(distDir)) {
      UI.success('Compilazione plugin completata con successo (dist/ presente).');
    } else {
      UI.warn('Build terminata ma dist/ non rilevata. Si procederà con i sorgenti.');
    }
  } catch (err) {
    UI.warn(`npm run build ha riscontrato un avviso: ${err.message}. Verificare dist/.`);
  }
}

function step3CopyPlugin(frontendDir) {
  UI.step(3, 'Copia ordinata del plugin in superset-frontend/plugins');

  const targetPluginDir = path.join(frontendDir, 'plugins', 'superset-plugin-chart-stratum-heatmap');
  fs.mkdirSync(targetPluginDir, { recursive: true });

  const itemsToCopy = ['src', 'dist', 'package.json', 'tsconfig.json', 'README.md'];
  for (const item of itemsToCopy) {
    const srcPath = path.join(pluginDir, item);
    const destPath = path.join(targetPluginDir, item);

    if (fs.existsSync(srcPath)) {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
        UI.info(`Copiata cartella '${item}' -> plugins/superset-plugin-chart-stratum-heatmap/${item}`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        UI.info(`Copiato file '${item}' -> plugins/superset-plugin-chart-stratum-heatmap/${item}`);
      }
    }
  }

  // Copia facoltativa cartella images se presente
  const imagesSrc = path.join(pluginDir, 'src', 'images');
  if (fs.existsSync(imagesSrc)) {
    const imagesDest = path.join(targetPluginDir, 'src', 'images');
    fs.mkdirSync(imagesDest, { recursive: true });
    fs.cpSync(imagesSrc, imagesDest, { recursive: true });
  }

  UI.success(`Plugin installato con successo in: ${targetPluginDir}`);
}

function step4PatchPreset(frontendDir) {
  UI.step(4, 'Patch di MainPreset e registrazione StratumHeatmap');

  const candidates = [
    path.join(frontendDir, 'src', 'visualizations', 'presets', 'MainPreset.ts'),
    path.join(frontendDir, 'src', 'visualizations', 'presets', 'MainPreset.js'),
    path.join(frontendDir, 'src', 'setup', 'setupPlugins.ts'),
    path.join(frontendDir, 'src', 'setup', 'setupPlugins.js'),
  ];

  let presetFile = candidates.find(f => fs.existsSync(f));
  if (!presetFile) {
    throw new Error('Impossibile trovare MainPreset o setupPlugins nel frontend di Superset.');
  }

  // Backup file di sicurezza
  const backupPath = `${presetFile}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(presetFile, backupPath);
    UI.info(`Creato backup di sicurezza: ${path.basename(backupPath)}`);
  }

  let content = fs.readFileSync(presetFile, 'utf8');

  const importStmt = "import { StratumHeatmapChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';\n";
  const registerStmt = "        new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register(),\n";

  const importMatches = content.match(/from\s*['"][^'"]*superset-plugin-chart-stratum-heatmap/g) || [];
  const registerMatches = content.match(/new\s+StratumHeatmap(?:Chart)?Plugin/g) || [];

  if (
    content.includes('StratumHeatmapChartPlugin') &&
    content.includes("new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register()") &&
    importMatches.length === 1 &&
    registerMatches.length === 1
  ) {
    UI.info(`StratumHeatmapChartPlugin già registrato correttamente in ${path.basename(presetFile)} (idempotente).`);
    return;
  }

  // Rimuove eventuali registrazioni/import obsolete prima di riapplicare
  content = content.replace(/import\s*\{[^}]*StratumHeatmap(?:Chart)?Plugin[^}]*\}\s*from\s*['"][^'"]*superset-plugin-chart-stratum-heatmap[^'"]*['"];?\r?\n?/g, '');
  content = content.replace(/[ \t]*new\s+StratumHeatmap(?:Chart)?Plugin\(\)\.configure\(\{[\s\S]*?\}\)(?:\.register\(\))?,?\r?\n?/g, '');

  // Iniezione import in cima o dopo l'ultimo import
  const lines = content.split(/\r?\n/);
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import { StratumHeatmapChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';");
    content = lines.join('\n');
  } else {
    content = importStmt + content;
  }

  // Iniezione registrazione nel blocco plugins: [ ... ]
  const pluginsMatch = content.match(/plugins\s*:\s*\[/);
  if (pluginsMatch && pluginsMatch.index !== undefined) {
    const insertPos = pluginsMatch.index + pluginsMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + registerStmt + content.slice(insertPos);
  } else {
    content += `\nnew StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register();\n`;
  }

  fs.writeFileSync(presetFile, content, 'utf8');
  UI.success(`Registrato StratumHeatmapChartPlugin (key: 'stratum_heatmap') in ${path.basename(presetFile)}`);
}

function step5SafetyCleanup(frontendDir) {
  UI.step(5, 'Frontend Safety Cleanup (Rimozione cache stale Webpack/Babel)');

  const cacheItems = [
    { target: path.join(frontendDir, 'node_modules', '.cache'), label: 'superset-frontend/node_modules/.cache' },
    { target: path.join(frontendDir, '.temp_cache'), label: 'superset-frontend/.temp_cache' },
    { target: path.join(frontendDir, 'dist'), label: 'superset-frontend/dist' },
  ];

  for (const item of cacheItems) {
    if (fs.existsSync(item.target)) {
      try {
        fs.rmSync(item.target, { recursive: true, force: true });
        UI.success(`Eliminata cache: ${item.label}`);
      } catch (e) {
        UI.warn(`Impossibile rimuovere ${item.label}: ${e.message}`);
      }
    } else {
      UI.info(`Nessuna cache trovata in ${item.label} (pulito).`);
    }
  }
}

function step6PrintInstructions() {
  UI.step(6, 'Installazione completata — Istruzioni Docker Compose');

  console.log(`\n${colors.green}${colors.bright}====================================================================`);
  console.log('    🎉   STRATUM HEATMAP INSTALLATO CON SUCCESSO!   🎉');
  console.log(`====================================================================${colors.reset}\n`);

  console.log(`${colors.bright}Per attivare il plugin in Apache Superset:${colors.reset}\n`);

  console.log(`${colors.yellow}${colors.bright}A) MODALITÀ DOCKER COMPOSE STANDARD / NON-DEV (Consigliata):${colors.reset}`);
  console.log(`   cd ${supersetDir}`);
  console.log(`   ${colors.green}docker compose -f docker-compose-non-dev.yml up -d --build superset${colors.reset}\n`);

  console.log(`${colors.yellow}${colors.bright}B) MODALITÀ DOCKER COMPOSE DEV (Frontend hot reload su superset-node):${colors.reset}`);
  console.log(`   cd ${supersetDir}`);
  console.log(`   ${colors.green}docker compose restart superset-node${colors.reset}`);
  console.log(`   oppure:`);
  console.log(`   ${colors.green}docker compose up -d --build superset-node${colors.reset}\n`);

  console.log(`${colors.yellow}${colors.bright}C) MODALITÀ FRONTEND LOCALE / HOST (Senza Docker Frontend):${colors.reset}`);
  console.log(`   cd ${path.join(supersetDir, 'superset-frontend')}`);
  console.log(`   ${colors.green}npm run dev-server${colors.reset}\n`);

  console.log(`${colors.cyan}Accedi a Superset su http://localhost:8088 e crea un nuovo grafico selezionando "StratumHeatmap"!${colors.reset}\n`);
}

// Inizializzazione interattiva o da argomenti
const args = process.argv.slice(2);
let argSupersetPath = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--superset-path' && args[i + 1]) {
    argSupersetPath = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--') && !argSupersetPath) {
    argSupersetPath = args[i];
  }
}

if (argSupersetPath) {
  supersetDir = path.resolve(argSupersetPath);
  startInstallation();
} else {
  const detected = findSupersetCandidates();
  if (detected.length > 0) {
    const defaultCand = detected[0];
    rl.question(`Rilevata installazione Superset in [${colors.bright}${defaultCand}${colors.reset}]. Utilizzare questo percorso? (Y/n): `, (answer) => {
      if (answer.trim().toLowerCase() === 'n') {
        promptSupersetDir();
      } else {
        supersetDir = defaultCand;
        startInstallation();
      }
    });
  } else {
    promptSupersetDir();
  }
}

function promptSupersetDir() {
  rl.question('Inserisci il percorso assoluto della cartella radice di Apache Superset: ', (ans) => {
    const chosen = ans.trim();
    if (!chosen) {
      UI.error('Il percorso non può essere vuoto.');
      promptSupersetDir();
      return;
    }
    supersetDir = path.resolve(chosen);
    if (!fs.existsSync(supersetDir)) {
      UI.error(`La directory specificata non esiste: ${supersetDir}`);
      promptSupersetDir();
      return;
    }
    startInstallation();
  });
}
