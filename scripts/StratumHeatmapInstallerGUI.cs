using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace StratumHeatmapInstaller
{
    public class InstallerForm : Form
    {
        private TextBox txtSupersetPath;
        private TextBox txtPluginPath;
        private Button btnBrowseSuperset;
        private Button btnBrowsePlugin;
        private CheckBox chkCleanCache;
        private CheckBox chkBuildPlugin;
        private Button btnInstall;
        private Button btnRollback;
        private ProgressBar progressBar;
        private Label lblStatus;
        private RichTextBox txtLog;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }

        public InstallerForm()
        {
            InitializeComponent();
            AutoDetectPaths();
        }

        private void InitializeComponent()
        {
            this.Text = "StratumHeatmap — Apache Superset Plugin Installer";
            this.Size = new Size(720, 720);
            this.MinimumSize = new Size(680, 680);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // 1. Header Panel
            Panel headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 85,
                BackColor = Color.FromArgb(15, 23, 42) // Dark Navy
            };
            headerPanel.Paint += (s, e) =>
            {
                using (LinearGradientBrush brush = new LinearGradientBrush(headerPanel.ClientRectangle,
                    Color.FromArgb(15, 23, 42), Color.FromArgb(30, 41, 59), LinearGradientMode.Horizontal))
                {
                    e.Graphics.FillRectangle(brush, headerPanel.ClientRectangle);
                }
            };

            Label lblTitle = new Label
            {
                Text = "StratumHeatmap Plugin Installer",
                Font = new Font("Segoe UI", 15f, FontStyle.Bold),
                ForeColor = Color.FromArgb(248, 250, 252),
                Location = new Point(24, 16),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            Label lblSubtitle = new Label
            {
                Text = "Installatore e gestore dinamico per Apache Superset (ECharts Matrix Grid Chart)",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(25, 48),
                AutoSize = true,
                BackColor = Color.Transparent
            };

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSubtitle);
            this.Controls.Add(headerPanel);

            // 2. Main Content Panel
            Panel mainPanel = new Panel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(24, 20, 24, 20),
                AutoScroll = true
            };
            this.Controls.Add(mainPanel);

            int currentY = 15;

            // --- SEZIONE 1: PATH SUPERSET ---
            Label lblSuperset = new Label
            {
                Text = "1. Percorso Cartella Radice di Apache Superset:",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(0, currentY),
                AutoSize = true
            };
            mainPanel.Controls.Add(lblSuperset);
            currentY += 26;

            txtSupersetPath = new TextBox
            {
                Location = new Point(0, currentY),
                Size = new Size(540, 28),
                Font = new Font("Segoe UI", 10f),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };
            mainPanel.Controls.Add(txtSupersetPath);

            btnBrowseSuperset = CreateStyledButton("Sfoglia...", Color.FromArgb(71, 85, 105), Color.White);
            btnBrowseSuperset.Location = new Point(550, currentY - 1);
            btnBrowseSuperset.Size = new Size(110, 30);
            btnBrowseSuperset.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnBrowseSuperset.Click += (s, e) => BrowseFolder(txtSupersetPath, "Seleziona la cartella radice di Apache Superset");
            mainPanel.Controls.Add(btnBrowseSuperset);
            currentY += 40;

            // --- SEZIONE 2: PATH PLUGIN ---
            Label lblPlugin = new Label
            {
                Text = "2. Percorso Cartella del Plugin StratumHeatmap:",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(0, currentY),
                AutoSize = true
            };
            mainPanel.Controls.Add(lblPlugin);
            currentY += 26;

            txtPluginPath = new TextBox
            {
                Location = new Point(0, currentY),
                Size = new Size(540, 28),
                Font = new Font("Segoe UI", 10f),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };
            mainPanel.Controls.Add(txtPluginPath);

            btnBrowsePlugin = CreateStyledButton("Sfoglia...", Color.FromArgb(71, 85, 105), Color.White);
            btnBrowsePlugin.Location = new Point(550, currentY - 1);
            btnBrowsePlugin.Size = new Size(110, 30);
            btnBrowsePlugin.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnBrowsePlugin.Click += (s, e) => BrowseFolder(txtPluginPath, "Seleziona la cartella del Plugin StratumHeatmap");
            mainPanel.Controls.Add(btnBrowsePlugin);
            currentY += 40;

            // --- OPZIONI ---
            chkCleanCache = new CheckBox
            {
                Text = "Pulisci automaticamente la cache Webpack (node_modules/.cache e dist)",
                Checked = true,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 65, 85)
            };
            mainPanel.Controls.Add(chkCleanCache);
            currentY += 26;

            chkBuildPlugin = new CheckBox
            {
                Text = "Esegui compilazione TypeScript preliminare del plugin (npm run build)",
                Checked = true,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 65, 85)
            };
            mainPanel.Controls.Add(chkBuildPlugin);
            currentY += 35;

            // --- PULSANTI AZIONE ---
            btnInstall = CreateStyledButton("🚀 Installa / Aggiorna in Superset", Color.FromArgb(2, 132, 199), Color.White);
            btnInstall.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnInstall.Location = new Point(0, currentY);
            btnInstall.Size = new Size(340, 42);
            btnInstall.Click += async (s, e) => await ExecuteInstallation(false);
            mainPanel.Controls.Add(btnInstall);

            btnRollback = CreateStyledButton("🔄 Rollback / Disinstalla", Color.FromArgb(225, 29, 72), Color.White);
            btnRollback.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btnRollback.Location = new Point(355, currentY);
            btnRollback.Size = new Size(200, 42);
            btnRollback.Click += async (s, e) => await ExecuteInstallation(true);
            mainPanel.Controls.Add(btnRollback);
            currentY += 52;

            // Progress Bar & Status
            progressBar = new ProgressBar
            {
                Location = new Point(0, currentY),
                Size = new Size(660, 8),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
                Style = ProgressBarStyle.Continuous
            };
            mainPanel.Controls.Add(progressBar);
            currentY += 14;

            lblStatus = new Label
            {
                Text = "Pronto per l'installazione.",
                Font = new Font("Segoe UI", 9f, FontStyle.Italic),
                ForeColor = Color.FromArgb(100, 116, 139),
                Location = new Point(0, currentY),
                AutoSize = true
            };
            mainPanel.Controls.Add(lblStatus);
            currentY += 24;

            // --- LOG CONSOLE ---
            Label lblLogTitle = new Label
            {
                Text = "Console Log di Operazione:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(0, currentY),
                AutoSize = true
            };
            mainPanel.Controls.Add(lblLogTitle);
            currentY += 22;

            txtLog = new RichTextBox
            {
                Location = new Point(0, currentY),
                Size = new Size(660, 180),
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.FromArgb(248, 250, 252),
                Font = new Font("Consolas", 9.5f),
                ReadOnly = true,
                BorderStyle = BorderStyle.None,
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right
            };
            mainPanel.Controls.Add(txtLog);
        }

        private Button CreateStyledButton(string text, Color backColor, Color foreColor)
        {
            Button btn = new Button
            {
                Text = text,
                BackColor = backColor,
                ForeColor = foreColor,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btn.FlatAppearance.BorderSize = 0;
            return btn;
        }

        private void BrowseFolder(TextBox targetTextBox, string title)
        {
            using (FolderBrowserDialog dlg = new FolderBrowserDialog())
            {
                dlg.Description = title;
                dlg.ShowNewFolderButton = false;
                if (!string.IsNullOrEmpty(targetTextBox.Text) && Directory.Exists(targetTextBox.Text))
                {
                    dlg.SelectedPath = targetTextBox.Text;
                }
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    targetTextBox.Text = dlg.SelectedPath;
                    AppendLog("Cartella selezionata: " + dlg.SelectedPath, Color.FromArgb(56, 189, 248));
                }
            }
        }

        private void AutoDetectPaths()
        {
            // 1. Auto-detect Plugin Path (cartella corrente o parent)
            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            string detectedPlugin = null;
            if (File.Exists(Path.Combine(appDir, "package.json")) && Directory.Exists(Path.Combine(appDir, "src")))
            {
                detectedPlugin = appDir;
            }
            else
            {
                DirectoryInfo parentInfo = Directory.GetParent(appDir);
                string parent = parentInfo != null ? parentInfo.FullName : null;
                if (parent != null && File.Exists(Path.Combine(parent, "package.json")) && Directory.Exists(Path.Combine(parent, "src")))
                {
                    detectedPlugin = parent;
                }
            }
            if (detectedPlugin == null)
            {
                string defaultUsb = @"D:\Sviluppo\superset-plugin-chart-stratum-heatmap";
                if (Directory.Exists(defaultUsb)) detectedPlugin = defaultUsb;
            }
            txtPluginPath.Text = detectedPlugin ?? appDir;

            // 2. Auto-detect Superset Path
            string[] candidates = new string[]
            {
                @"C:\Users\admmaps\superset_6_1_0\superset",
                @"D:\Sviluppo\superset",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "superset_6_1_0", "superset"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Desktop", "superset"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "superset")
            };

            string detectedSuperset = null;
            foreach (string c in candidates)
            {
                if (Directory.Exists(c) && File.Exists(Path.Combine(c, "superset-frontend", "package.json")))
                {
                    detectedSuperset = c;
                    break;
                }
            }

            if (detectedSuperset != null)
            {
                txtSupersetPath.Text = detectedSuperset;
                AppendLog("Percorso Superset rilevato automaticamente: " + detectedSuperset, Color.FromArgb(74, 222, 128));
            }
            else
            {
                AppendLog("Nessun Superset rilevato automaticamente. Seleziona la cartella con 'Sfoglia...'", Color.FromArgb(250, 204, 21));
            }
            AppendLog("Cartella Plugin configurata: " + txtPluginPath.Text, Color.FromArgb(56, 189, 248));
        }

        private void AppendLog(string message, Color color)
        {
            if (txtLog.InvokeRequired)
            {
                txtLog.Invoke(new Action(() => AppendLog(message, color)));
                return;
            }
            string timeStamp = DateTime.Now.ToString("HH:mm:ss");
            txtLog.SelectionStart = txtLog.TextLength;
            txtLog.SelectionLength = 0;
            txtLog.SelectionColor = Color.FromArgb(148, 163, 184);
            txtLog.AppendText("[" + timeStamp + "] ");
            txtLog.SelectionColor = color;
            txtLog.AppendText(message + "\r\n");
            txtLog.ScrollToCaret();
        }

        private async Task ExecuteInstallation(bool isRollback)
        {
            string supersetPath = txtSupersetPath.Text.Trim();
            string pluginPath = txtPluginPath.Text.Trim();

            if (string.IsNullOrEmpty(supersetPath) || !Directory.Exists(supersetPath))
            {
                MessageBox.Show("Percorso Superset non valido o inesistente!", "Errore Percorso", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string frontendDir = Path.Combine(supersetPath, "superset-frontend");
            if (!Directory.Exists(frontendDir) || !File.Exists(Path.Combine(frontendDir, "package.json")))
            {
                MessageBox.Show("Impossibile trovare 'superset-frontend/package.json' all'interno di:\n" + supersetPath, "Superset non valido", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (!isRollback)
            {
                if (string.IsNullOrEmpty(pluginPath) || !Directory.Exists(pluginPath))
                {
                    MessageBox.Show("Percorso del Plugin non valido o inesistente!", "Errore Percorso", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }

            btnInstall.Enabled = false;
            btnRollback.Enabled = false;
            progressBar.Style = ProgressBarStyle.Marquee;

            try
            {
                if (isRollback)
                {
                    lblStatus.Text = "Esecuzione Rollback / Disinstallazione in corso...";
                    await Task.Run(() => PerformRollback(supersetPath, frontendDir));
                    lblStatus.Text = "Rollback completato con successo.";
                    MessageBox.Show("Plugin rimosso e MainPreset ripristinato con successo!", "Rollback Completato", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    lblStatus.Text = "Installazione e registrazione in corso...";
                    await Task.Run(() => PerformInstall(supersetPath, frontendDir, pluginPath));
                    lblStatus.Text = "Installazione completata con successo!";
                    MessageBox.Show("StratumHeatmap è stato installato e registrato con successo in Apache Superset!\r\n\r\nPer visualizzarlo:\r\n- In Dev: npm run dev-server (in superset-frontend)\r\n- In Docker: docker compose -f docker-compose-non-dev.yml up -d --build superset", "Installazione Riuscita", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                AppendLog("ERRORE: " + ex.Message, Color.FromArgb(248, 113, 113));
                lblStatus.Text = "Errore durante l'operazione.";
                MessageBox.Show("Si è verificato un errore:\n" + ex.Message, "Errore Operazione", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = 100;
                btnInstall.Enabled = true;
                btnRollback.Enabled = true;
            }
        }

        private void PerformInstall(string supersetPath, string frontendDir, string pluginPath)
        {
            AppendLog("=== INIZIO INSTALLAZIONE STRATUMHEATMAP ===", Color.FromArgb(56, 189, 248));
            AppendLog("Superset Root: " + supersetPath, Color.White);
            AppendLog("Plugin Source: " + pluginPath, Color.White);

            // 1. Build preliminare se abilitata
            if (chkBuildPlugin.Checked && File.Exists(Path.Combine(pluginPath, "package.json")))
            {
                AppendLog("Esecuzione npm run build nel plugin...", Color.FromArgb(250, 204, 21));
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c npm run build")
                    {
                        WorkingDirectory = pluginPath,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };
                    using (Process p = Process.Start(psi))
                    {
                        p.WaitForExit(60000);
                    }
                    AppendLog("Build TypeScript del plugin completata.", Color.FromArgb(74, 222, 128));
                }
                catch (Exception ex)
                {
                    AppendLog("Avviso durante build del plugin: " + ex.Message, Color.FromArgb(250, 204, 21));
                }
            }

            // 2. Copia dei file in plugins/superset-plugin-chart-stratum-heatmap
            string targetPluginDir = Path.Combine(frontendDir, "plugins", "superset-plugin-chart-stratum-heatmap");
            if (Directory.Exists(targetPluginDir))
            {
                AppendLog("Rimozione versione precedente in plugins/...", Color.FromArgb(148, 163, 184));
                Directory.Delete(targetPluginDir, true);
            }
            Directory.CreateDirectory(targetPluginDir);

            AppendLog("Copia file sorgenti, dist e configurazioni...", Color.FromArgb(56, 189, 248));
            string[] itemsToCopy = new string[] { "src", "dist", "package.json", "tsconfig.json", "README.md" };
            foreach (string item in itemsToCopy)
            {
                string src = Path.Combine(pluginPath, item);
                string dst = Path.Combine(targetPluginDir, item);
                if (Directory.Exists(src))
                {
                    CopyDirectory(src, dst);
                }
                else if (File.Exists(src))
                {
                    File.Copy(src, dst, true);
                }
            }
            AppendLog("File del plugin copiati in: " + targetPluginDir, Color.FromArgb(74, 222, 128));

            // 3. Patch di MainPreset
            PatchMainPreset(frontendDir, false);

            // 4. Pulizia Cache Webpack se richiesta
            if (chkCleanCache.Checked)
            {
                AppendLog("Pulizia cache Webpack e dist obsolete...", Color.FromArgb(56, 189, 248));
                string[] cacheTargets = new string[]
                {
                    Path.Combine(frontendDir, "node_modules", ".cache"),
                    Path.Combine(frontendDir, ".temp_cache"),
                    Path.Combine(frontendDir, "dist")
                };
                foreach (string c in cacheTargets)
                {
                    if (Directory.Exists(c))
                    {
                        try { Directory.Delete(c, true); AppendLog("Eliminata cache: " + Path.GetFileName(c), Color.FromArgb(74, 222, 128)); }
                        catch { }
                    }
                }
            }

            AppendLog("=== INSTALLAZIONE STRATUMHEATMAP COMPLETATA CON SUCCESSO! ===", Color.FromArgb(74, 222, 128));
        }

        private void PerformRollback(string supersetPath, string frontendDir)
        {
            AppendLog("=== INIZIO ROLLBACK / DISINSTALLAZIONE ===", Color.FromArgb(244, 63, 94));
            string targetPluginDir = Path.Combine(frontendDir, "plugins", "superset-plugin-chart-stratum-heatmap");
            if (Directory.Exists(targetPluginDir))
            {
                Directory.Delete(targetPluginDir, true);
                AppendLog("Rimossa cartella plugin: " + targetPluginDir, Color.FromArgb(74, 222, 128));
            }

            PatchMainPreset(frontendDir, true);

            if (chkCleanCache.Checked)
            {
                string cacheDir = Path.Combine(frontendDir, "node_modules", ".cache");
                if (Directory.Exists(cacheDir))
                {
                    try { Directory.Delete(cacheDir, true); } catch { }
                }
            }
            AppendLog("=== ROLLBACK COMPLETATO CON SUCCESSO ===", Color.FromArgb(74, 222, 128));
        }

        private void PatchMainPreset(string frontendDir, bool isRollback)
        {
            string[] candidates = new string[]
            {
                Path.Combine(frontendDir, "src", "visualizations", "presets", "MainPreset.ts"),
                Path.Combine(frontendDir, "src", "visualizations", "presets", "MainPreset.js")
            };

            string presetFile = null;
            foreach (string f in candidates)
            {
                if (File.Exists(f)) { presetFile = f; break; }
            }

            if (presetFile == null)
            {
                throw new FileNotFoundException("Impossibile trovare MainPreset.ts/js nel frontend!");
            }

            string bakFile = presetFile + ".bak";
            if (!File.Exists(bakFile))
            {
                File.Copy(presetFile, bakFile, true);
                AppendLog("Backup di sicurezza creato: " + Path.GetFileName(bakFile), Color.FromArgb(148, 163, 184));
            }

            string content = File.ReadAllText(presetFile, Encoding.UTF8);

            // Rimuovi vecchie iniezioni
            content = Regex.Replace(content, @"import\s*\{[^}]*StratumHeatmap(?:Chart)?Plugin[^}]*\}\s*from\s*['""][^'""]*superset-plugin-chart-stratum-heatmap[^'""]*['""];?\r?\n?", "");
            content = Regex.Replace(content, @"[ \t]*new\s+StratumHeatmap(?:Chart)?Plugin\(\)\.configure\(\{[\s\S]*?\}\)(\.register\(\))?,?\r?\n?", "");

            if (!isRollback)
            {
                string importLine = "import { StratumHeatmapChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';\r\n";
                string registerLine = "        new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register(),\r\n";

                content = importLine + content;
                content = Regex.Replace(content, @"(plugins\s*:\s*\[)", "$1\r\n" + registerLine);
                AppendLog("Registrato StratumHeatmapChartPlugin in " + Path.GetFileName(presetFile), Color.FromArgb(74, 222, 128));
            }
            else
            {
                AppendLog("Rimosso StratumHeatmapChartPlugin da " + Path.GetFileName(presetFile), Color.FromArgb(74, 222, 128));
            }

            File.WriteAllText(presetFile, content, Encoding.UTF8);
        }

        private void CopyDirectory(string sourceDir, string destDir)
        {
            Directory.CreateDirectory(destDir);
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                File.Copy(file, Path.Combine(destDir, Path.GetFileName(file)), true);
            }
            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string name = Path.GetFileName(subDir);
                if (name == "node_modules" || name == ".git" || name == ".turbo") continue;
                CopyDirectory(subDir, Path.Combine(destDir, name));
            }
        }
    }
}
