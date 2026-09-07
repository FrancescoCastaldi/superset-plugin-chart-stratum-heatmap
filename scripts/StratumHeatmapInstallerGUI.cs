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
        private CheckBox chkCleanReinstall;
        private CheckBox chkCleanCache;
        private CheckBox chkBuildPlugin;
        private CheckBox chkBuildFrontend;
        private CheckBox chkRestartDocker;
        private Button btnInstall;
        private Button btnRollback;
        private Button btnQuickSync;
        private Button btnBuildWebpack;
        private Button btnRestartDockerOnly;
        private ProgressBar progressBar;
        private Label lblStatus;
        private RichTextBox txtLog;
        private Button btnOpenLog;
        private Button btnClearLog;
        private string logFilePath;

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
            InitLogFile();
            AutoDetectPaths();
        }

        private void InitializeComponent()
        {
            this.Text = "StratumHeatmap — Apache Superset Plugin Installer";
            this.Size = new Size(780, 840);
            this.MinimumSize = new Size(720, 720);
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
                Padding = new Padding(24, 16, 24, 16),
                AutoScroll = true
            };
            this.Controls.Add(mainPanel);

            int currentY = 14;

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
            currentY += 25;

            txtSupersetPath = new TextBox
            {
                Location = new Point(0, currentY),
                Size = new Size(580, 28),
                Font = new Font("Segoe UI", 10f),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };
            mainPanel.Controls.Add(txtSupersetPath);

            btnBrowseSuperset = CreateStyledButton("Sfoglia...", Color.FromArgb(71, 85, 105), Color.White);
            btnBrowseSuperset.Location = new Point(590, currentY - 1);
            btnBrowseSuperset.Size = new Size(110, 30);
            btnBrowseSuperset.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnBrowseSuperset.Click += (s, e) => BrowseFolder(txtSupersetPath, "Seleziona la cartella radice di Apache Superset");
            mainPanel.Controls.Add(btnBrowseSuperset);
            currentY += 38;

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
            currentY += 25;

            txtPluginPath = new TextBox
            {
                Location = new Point(0, currentY),
                Size = new Size(580, 28),
                Font = new Font("Segoe UI", 10f),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };
            mainPanel.Controls.Add(txtPluginPath);

            btnBrowsePlugin = CreateStyledButton("Sfoglia...", Color.FromArgb(71, 85, 105), Color.White);
            btnBrowsePlugin.Location = new Point(590, currentY - 1);
            btnBrowsePlugin.Size = new Size(110, 30);
            btnBrowsePlugin.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnBrowsePlugin.Click += (s, e) => BrowseFolder(txtPluginPath, "Seleziona la cartella del Plugin StratumHeatmap");
            mainPanel.Controls.Add(btnBrowsePlugin);
            currentY += 40;

            // --- SEZIONE 3: OPZIONI REINSTALLAZIONE DA ZERO ---
            Label lblOptions = new Label
            {
                Text = "3. Opzioni di Installazione / Reinstallazione da Zero:",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(0, currentY),
                AutoSize = true
            };
            mainPanel.Controls.Add(lblOptions);
            currentY += 25;

            chkCleanReinstall = new CheckBox
            {
                Text = "Rimuovi versione esistente e reinstalla completamente da zero (Clean Reinstall)",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Checked = true,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(15, 23, 42)
            };
            mainPanel.Controls.Add(chkCleanReinstall);
            currentY += 26;

            chkCleanCache = new CheckBox
            {
                Text = "Pulisci automaticamente la cache Webpack (node_modules/.cache, .temp_cache, dist)",
                Checked = true,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 65, 85)
            };
            mainPanel.Controls.Add(chkCleanCache);
            currentY += 26;

            chkBuildPlugin = new CheckBox
            {
                Text = "Compilazione TypeScript preliminare del plugin (npm run build nel plugin)",
                Checked = true,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 65, 85)
            };
            mainPanel.Controls.Add(chkBuildPlugin);
            currentY += 26;

            chkBuildFrontend = new CheckBox
            {
                Text = "Compilazione Webpack frontend di Superset (npm run build in superset-frontend)",
                Checked = true,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 65, 85)
            };
            mainPanel.Controls.Add(chkBuildFrontend);
            currentY += 26;

            chkRestartDocker = new CheckBox
            {
                Text = "Riavvia container Superset Docker (opzionale, NON necessario se Superset legge dist)",
                Checked = false,
                Location = new Point(2, currentY),
                AutoSize = true,
                ForeColor = Color.FromArgb(51, 65, 85)
            };
            mainPanel.Controls.Add(chkRestartDocker);
            currentY += 34;

            // --- PULSANTI AZIONE ---
            btnInstall = CreateStyledButton("⚡ Installazione Completa da Zero (Clean Reinstall)", Color.FromArgb(2, 132, 199), Color.White);
            btnInstall.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnInstall.Location = new Point(0, currentY);
            btnInstall.Size = new Size(440, 44);
            btnInstall.Click += async (s, e) => await ExecuteInstallation(false);
            mainPanel.Controls.Add(btnInstall);

            btnRollback = CreateStyledButton("🔄 Rollback / Disinstalla", Color.FromArgb(225, 29, 72), Color.White);
            btnRollback.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnRollback.Location = new Point(450, currentY);
            btnRollback.Size = new Size(220, 44);
            btnRollback.Click += async (s, e) => await ExecuteInstallation(true);
            mainPanel.Controls.Add(btnRollback);
            currentY += 50;

            // Seconda riga di azioni rapide
            btnQuickSync = CreateStyledButton("⚡ Aggiorna File Plugin (Sync Rapido)", Color.FromArgb(16, 185, 129), Color.White);
            btnQuickSync.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnQuickSync.Location = new Point(0, currentY);
            btnQuickSync.Size = new Size(220, 36);
            btnQuickSync.Click += async (s, e) => await ExecuteQuickSync();
            mainPanel.Controls.Add(btnQuickSync);

            btnBuildWebpack = CreateStyledButton("📦 Compila Solo Frontend (npm build)", Color.FromArgb(124, 58, 237), Color.White);
            btnBuildWebpack.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnBuildWebpack.Location = new Point(228, currentY);
            btnBuildWebpack.Size = new Size(230, 36);
            btnBuildWebpack.Click += async (s, e) => await ExecuteBuildWebpackOnly();
            mainPanel.Controls.Add(btnBuildWebpack);

            btnRestartDockerOnly = CreateStyledButton("🐳 Riavvia Docker Superset", Color.FromArgb(14, 116, 144), Color.White);
            btnRestartDockerOnly.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnRestartDockerOnly.Location = new Point(466, currentY);
            btnRestartDockerOnly.Size = new Size(204, 36);
            btnRestartDockerOnly.Click += async (s, e) => await ExecuteRestartDockerOnly();
            mainPanel.Controls.Add(btnRestartDockerOnly);
            currentY += 46;

            // Progress Bar & Status
            progressBar = new ProgressBar
            {
                Location = new Point(0, currentY),
                Size = new Size(700, 8),
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
                Text = "Console Log di Operazione (Streaming in Tempo Reale):",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Location = new Point(0, currentY + 3),
                AutoSize = true
            };
            mainPanel.Controls.Add(lblLogTitle);

            btnOpenLog = CreateStyledButton("📂 Apri File di Log", Color.FromArgb(71, 85, 105), Color.White);
            btnOpenLog.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            btnOpenLog.Location = new Point(480, currentY);
            btnOpenLog.Size = new Size(130, 26);
            btnOpenLog.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnOpenLog.Click += (s, e) => OpenLogFile();
            mainPanel.Controls.Add(btnOpenLog);

            btnClearLog = CreateStyledButton("🧹 Pulisci", Color.FromArgb(148, 163, 184), Color.FromArgb(15, 23, 42));
            btnClearLog.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            btnClearLog.Location = new Point(616, currentY);
            btnClearLog.Size = new Size(84, 26);
            btnClearLog.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnClearLog.Click += (s, e) => { txtLog.Clear(); AppendLog("Log a schermo ripulito.", Color.FromArgb(148, 163, 184)); };
            mainPanel.Controls.Add(btnClearLog);
            currentY += 30;

            txtLog = new RichTextBox
            {
                Location = new Point(0, currentY),
                Size = new Size(700, 200),
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.FromArgb(248, 250, 252),
                Font = new Font("Consolas", 9.2f),
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
                string defaultUsb = @"D:\Sviluppo\superset-plugins\superset-plugin-chart-stratum-heatmap";
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
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "OneDrive - mapsengineering.com", "superset-6.1.0"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "superset"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Projects", "superset"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "dev", "superset")
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
            AppendLog("File di log persistente: " + (logFilePath ?? "installer_log.txt"), Color.FromArgb(148, 163, 184));
        }

        private static readonly object _logLock = new object();

        private void InitLogFile()
        {
            try
            {
                string baseLog = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer_log.txt");
                File.AppendAllText(baseLog, string.Format("\r\n================================================================================\r\n[{0:yyyy-MM-dd HH:mm:ss}] Avvio StratumHeatmap Installer GUI\r\nCartella base: {1}\r\n================================================================================\r\n", DateTime.Now, AppDomain.CurrentDomain.BaseDirectory), Encoding.UTF8);
                logFilePath = baseLog;
            }
            catch
            {
                try
                {
                    string tempLog = Path.Combine(Path.GetTempPath(), "stratum_installer_log.txt");
                    File.AppendAllText(tempLog, string.Format("\r\n================================================================================\r\n[{0:yyyy-MM-dd HH:mm:ss}] Avvio StratumHeatmap Installer GUI\r\nCartella base: {1} (fallback su TEMP)\r\n================================================================================\r\n", DateTime.Now, AppDomain.CurrentDomain.BaseDirectory), Encoding.UTF8);
                    logFilePath = tempLog;
                }
                catch { }
            }
        }

        private void AppendLog(string message, Color color)
        {
            if (txtLog.InvokeRequired)
            {
                if (!txtLog.IsDisposed && txtLog.IsHandleCreated)
                {
                    txtLog.BeginInvoke(new Action(() => AppendLog(message, color)));
                }
                return;
            }

            // Evita crescita infinita di memoria nel RichTextBox
            if (txtLog.TextLength > 200000)
            {
                txtLog.Select(0, 50000);
                txtLog.SelectedText = "";
            }

            string timeStamp = DateTime.Now.ToString("HH:mm:ss");
            txtLog.SelectionStart = txtLog.TextLength;
            txtLog.SelectionLength = 0;
            txtLog.SelectionColor = Color.FromArgb(148, 163, 184);
            txtLog.AppendText("[" + timeStamp + "] ");
            txtLog.SelectionColor = color;
            txtLog.AppendText(message + "\r\n");
            txtLog.SelectionStart = txtLog.TextLength;
            txtLog.ScrollToCaret();

            // Scrittura persistente su file di log
            WriteToLogFile("[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] " + message);
        }

        private void WriteToLogFile(string text)
        {
            lock (_logLock)
            {
                try
                {
                    if (string.IsNullOrEmpty(logFilePath))
                    {
                        InitLogFile();
                    }
                    if (!string.IsNullOrEmpty(logFilePath))
                    {
                        File.AppendAllText(logFilePath, text + "\r\n", Encoding.UTF8);
                    }
                }
                catch
                {
                    try
                    {
                        string tempLog = Path.Combine(Path.GetTempPath(), "stratum_installer_log.txt");
                        File.AppendAllText(tempLog, text + "\r\n", Encoding.UTF8);
                        logFilePath = tempLog;
                    }
                    catch { }
                }
            }
        }

        private void OpenLogFile()
        {
            try
            {
                if (string.IsNullOrEmpty(logFilePath))
                {
                    logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer_log.txt");
                }

                if (!File.Exists(logFilePath))
                {
                    string tempLog = Path.Combine(Path.GetTempPath(), "stratum_installer_log.txt");
                    if (File.Exists(tempLog))
                    {
                        logFilePath = tempLog;
                    }
                }

                if (File.Exists(logFilePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "notepad.exe",
                        Arguments = "\"" + logFilePath + "\"",
                        UseShellExecute = true
                    });
                }
                else
                {
                    MessageBox.Show("Il file di log non esiste ancora o nessun evento è stato registrato.\nPercorso: " + logFilePath, "File di Log", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Impossibile aprire il file di log:\n" + ex.Message, "Errore", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private int RunProcessStreaming(string workingDir, string fileName, string arguments, string logPrefix)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    WorkingDirectory = workingDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using (Process proc = new Process())
                {
                    proc.StartInfo = psi;
                    proc.OutputDataReceived += (s, e) =>
                    {
                        if (e.Data != null)
                        {
                            string pfx = string.IsNullOrEmpty(logPrefix) ? "" : "[" + logPrefix + "] ";
                            AppendLog(pfx + e.Data, Color.FromArgb(226, 232, 240));
                        }
                    };
                    proc.ErrorDataReceived += (s, e) =>
                    {
                        if (e.Data != null)
                        {
                            string pfx = string.IsNullOrEmpty(logPrefix) ? "" : "[" + logPrefix + "] ";
                            AppendLog(pfx + e.Data, Color.FromArgb(251, 191, 36));
                        }
                    };

                    proc.Start();
                    proc.BeginOutputReadLine();
                    proc.BeginErrorReadLine();
                    proc.WaitForExit();
                    return proc.ExitCode;
                }
            }
            catch (Exception ex)
            {
                AppendLog("Errore durante esecuzione processo (" + fileName + " " + arguments + "): " + ex.Message, Color.FromArgb(248, 113, 113));
                return -1;
            }
        }

        private void SafeDeleteDirectory(string targetDir)
        {
            if (!Directory.Exists(targetDir)) return;

            for (int attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    foreach (string file in Directory.GetFiles(targetDir, "*", SearchOption.AllDirectories))
                    {
                        try
                        {
                            File.SetAttributes(file, FileAttributes.Normal);
                        }
                        catch { }
                    }
                    Directory.Delete(targetDir, true);
                    return;
                }
                catch (Exception ex)
                {
                    if (attempt == 3)
                    {
                        throw new IOException("Impossibile eliminare completamente la cartella '" + targetDir + "': " + ex.Message, ex);
                    }
                    System.Threading.Thread.Sleep(300);
                }
            }
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
            else
            {
                DialogResult confirm = MessageBox.Show(
                    "Sei sicuro di voler disinstallare StratumHeatmap da Superset e ripristinare MainPreset?",
                    "Conferma Rollback / Disinstallazione",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );
                if (confirm != DialogResult.Yes) return;
            }

            SetButtonsEnabled(false);
            progressBar.Style = ProgressBarStyle.Marquee;

            try
            {
                if (isRollback)
                {
                    lblStatus.Text = "Esecuzione Rollback / Disinstallazione in corso...";
                    await Task.Run(() => PerformRollback(supersetPath, frontendDir));
                    lblStatus.Text = "Rollback completato con successo.";
                    MessageBox.Show(
                        "StratumHeatmap è stato rimosso e MainPreset ripristinato con successo!",
                        "Rollback Completato",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information
                    );
                }
                else
                {
                    lblStatus.Text = "Installazione completa da zero in corso...";
                    await Task.Run(() => PerformInstall(supersetPath, frontendDir, pluginPath));
                    lblStatus.Text = "Installazione completata con successo!";

                    string successMsg =
                        "✅ Installazione da zero di StratumHeatmap completata con successo!\r\n\r\n" +
                        "Riepilogo operazioni eseguite:\r\n" +
                        "• Rimozione completa della versione precedente\r\n" +
                        "• Copia pulita dei file del plugin in superset-frontend/plugins/\r\n" +
                        "• Registrazione del plugin in MainPreset.ts (key: stratum_heatmap)\r\n" +
                        (chkCleanCache.Checked ? "• Pulizia totale cache Webpack/Babel (.cache, .temp_cache, dist)\r\n" : "") +
                        (chkBuildFrontend.Checked ? "• Ricompilazione Webpack frontend di Superset (npm run build)\r\n" : "") +
                        (chkRestartDocker.Checked ? "• Comando di riavvio container Superset Docker\r\n" : "") +
                        "\r\n" +
                        "COME VISUALIZZARE IL GRAFICO NEL BROWSER:\r\n" +
                        "1. Apri Apache Superset nel browser (es. http://localhost:8088 o https://...)\r\n" +
                        "2. FONDAMENTALE: Esegui un Hard Refresh premendo CTRL + F5 (oppure apri una finestra in Incognito) per forzare lo svuotamento della cache del browser e caricare i nuovi bundle JavaScript.\r\n" +
                        "3. Crea o modifica un grafico e cerca 'Stratum Heatmap' nella galleria!";

                    MessageBox.Show(successMsg, "StratumHeatmap — Installazione Riuscita!", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                AppendLog("ERRORE CRITICO: " + ex.Message, Color.FromArgb(248, 113, 113));
                lblStatus.Text = "Errore durante l'operazione.";
                MessageBox.Show("Si è verificato un errore:\n" + ex.Message, "Errore Operazione", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = 100;
                SetButtonsEnabled(true);
            }
        }

        private void SetButtonsEnabled(bool enabled)
        {
            btnInstall.Enabled = enabled;
            btnRollback.Enabled = enabled;
            if (btnQuickSync != null) btnQuickSync.Enabled = enabled;
            if (btnBuildWebpack != null) btnBuildWebpack.Enabled = enabled;
            if (btnRestartDockerOnly != null) btnRestartDockerOnly.Enabled = enabled;
        }

        private async Task ExecuteQuickSync()
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

            if (string.IsNullOrEmpty(pluginPath) || !Directory.Exists(pluginPath))
            {
                MessageBox.Show("Percorso del Plugin non valido o inesistente!", "Errore Percorso", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            SetButtonsEnabled(false);
            progressBar.Style = ProgressBarStyle.Marquee;

            try
            {
                lblStatus.Text = "Sincronizzazione rapida del plugin in corso...";
                await Task.Run(() =>
                {
                    AppendLog("=== AVVIO AGGIORNAMENTO RAPIDO STRATUMHEATMAP ===", Color.FromArgb(56, 189, 248));
                    BuildPluginTypeScript(pluginPath);
                    string targetPluginDir = Path.Combine(frontendDir, "plugins", "superset-plugin-chart-stratum-heatmap");
                    if (!Directory.Exists(targetPluginDir)) Directory.CreateDirectory(targetPluginDir);
                    string[] itemsToCopy = new string[] { "src", "dist", "package.json", "tsconfig.json", "README.md" };
                    foreach (string item in itemsToCopy)
                    {
                        string src = Path.Combine(pluginPath, item);
                        string dst = Path.Combine(targetPluginDir, item);
                        if (Directory.Exists(src))
                        {
                            CopyDirectory(src, dst);
                            AppendLog("  [+] Sincronizzata cartella: " + item, Color.FromArgb(148, 163, 184));
                        }
                        else if (File.Exists(src))
                        {
                            File.Copy(src, dst, true);
                            AppendLog("  [+] Sincronizzato file:     " + item, Color.FromArgb(148, 163, 184));
                        }
                    }
                    PatchMainPreset(frontendDir, false);
                    AppendLog("Sincronizzazione file plugin completata!", Color.FromArgb(74, 222, 128));
                });
                lblStatus.Text = "Aggiornamento file completato!";
                MessageBox.Show("File del plugin aggiornati e sincronizzati in Superset con successo!\nSe Superset è in esecuzione con Webpack dev-server, le modifiche sono già attive (Hard Refresh CTRL+F5).\nSe Superset è in produzione, esegui 'Compila Solo Frontend' o 'Riavvia Docker'.", "Sync Completato", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                AppendLog("ERRORE: " + ex.Message, Color.FromArgb(248, 113, 113));
                MessageBox.Show("Errore durante la sincronizzazione: " + ex.Message, "Errore", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = 100;
                SetButtonsEnabled(true);
            }
        }

        private async Task ExecuteBuildWebpackOnly()
        {
            string supersetPath = txtSupersetPath.Text.Trim();
            if (string.IsNullOrEmpty(supersetPath) || !Directory.Exists(supersetPath))
            {
                MessageBox.Show("Percorso Superset non valido o inesistente!", "Errore Percorso", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string frontendDir = Path.Combine(supersetPath, "superset-frontend");
            if (!Directory.Exists(frontendDir))
            {
                MessageBox.Show("Impossibile trovare 'superset-frontend'!", "Errore", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            SetButtonsEnabled(false);
            progressBar.Style = ProgressBarStyle.Marquee;

            try
            {
                lblStatus.Text = "Compilazione Webpack frontend in corso (npm run build)...";
                await Task.Run(() => BuildSupersetFrontend(frontendDir));
                lblStatus.Text = "Compilazione Webpack completata!";
                MessageBox.Show("Compilazione Webpack frontend completata con successo!\nEsegui un Hard Refresh (CTRL+F5) nel browser per caricare i nuovi bundle.", "Webpack Completato", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                AppendLog("ERRORE WEBPACK: " + ex.Message, Color.FromArgb(248, 113, 113));
                MessageBox.Show("Errore durante Webpack: " + ex.Message, "Errore", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = 100;
                SetButtonsEnabled(true);
            }
        }

        private async Task ExecuteRestartDockerOnly()
        {
            string supersetPath = txtSupersetPath.Text.Trim();
            if (string.IsNullOrEmpty(supersetPath) || !Directory.Exists(supersetPath))
            {
                MessageBox.Show("Percorso Superset non valido o inesistente!", "Errore Percorso", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            SetButtonsEnabled(false);
            progressBar.Style = ProgressBarStyle.Marquee;

            try
            {
                lblStatus.Text = "Riavvio container Docker Superset in corso...";
                await Task.Run(() => RestartDockerContainers(supersetPath));
                lblStatus.Text = "Operazione Docker completata!";
                MessageBox.Show("Comando Docker completato!\nControlla il log di console sopra per verificare lo stato dei container.", "Docker Completato", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                AppendLog("ERRORE DOCKER: " + ex.Message, Color.FromArgb(248, 113, 113));
                MessageBox.Show("Errore durante operazione Docker: " + ex.Message, "Errore", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = 100;
                SetButtonsEnabled(true);
            }
        }

        private void PerformInstall(string supersetPath, string frontendDir, string pluginPath)
        {
            AppendLog("=== INIZIO INSTALLAZIONE / REINSTALLAZIONE DA ZERO STRATUMHEATMAP ===", Color.FromArgb(56, 189, 248));
            AppendLog("Superset Root: " + supersetPath, Color.White);
            AppendLog("Frontend Dir:  " + frontendDir, Color.White);
            AppendLog("Plugin Source: " + pluginPath, Color.White);

            // 1. Build preliminare del plugin se abilitata
            if (chkBuildPlugin.Checked && File.Exists(Path.Combine(pluginPath, "package.json")))
            {
                BuildPluginTypeScript(pluginPath);
            }

            // 2. Rimozione versione precedente e reinstallazione da zero
            string targetPluginDir = Path.Combine(frontendDir, "plugins", "superset-plugin-chart-stratum-heatmap");
            if (Directory.Exists(targetPluginDir))
            {
                AppendLog("Rilevata versione precedente in 'plugins/superset-plugin-chart-stratum-heatmap'.", Color.FromArgb(250, 204, 21));
                if (chkCleanReinstall.Checked)
                {
                    AppendLog("Rimozione totale versione esistente in corso (Clean Reinstall)...", Color.FromArgb(250, 204, 21));
                    SafeDeleteDirectory(targetPluginDir);
                    AppendLog("Versione precedente eliminata con successo.", Color.FromArgb(74, 222, 128));
                }
            }

            if (!Directory.Exists(targetPluginDir))
            {
                Directory.CreateDirectory(targetPluginDir);
            }

            // 3. Copia pulita da zero
            AppendLog("Copia file sorgenti, dist e configurazioni da zero...", Color.FromArgb(56, 189, 248));
            string[] itemsToCopy = new string[] { "src", "dist", "package.json", "tsconfig.json", "README.md" };
            foreach (string item in itemsToCopy)
            {
                string src = Path.Combine(pluginPath, item);
                string dst = Path.Combine(targetPluginDir, item);
                if (Directory.Exists(src))
                {
                    CopyDirectory(src, dst);
                    AppendLog("  [+] Copiata cartella: " + item, Color.FromArgb(148, 163, 184));
                }
                else if (File.Exists(src))
                {
                    File.Copy(src, dst, true);
                    AppendLog("  [+] Copiato file:     " + item, Color.FromArgb(148, 163, 184));
                }
            }
            AppendLog("File del plugin copiati in: " + targetPluginDir, Color.FromArgb(74, 222, 128));

            // 4. Patch di MainPreset
            PatchMainPreset(frontendDir, false);

            // 5. Pulizia Cache Webpack se richiesta
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
                        try
                        {
                            SafeDeleteDirectory(c);
                            AppendLog("Eliminata cache: " + Path.GetFileName(c), Color.FromArgb(74, 222, 128));
                        }
                        catch (Exception ex)
                        {
                            AppendLog("Avviso eliminazione cache " + Path.GetFileName(c) + ": " + ex.Message, Color.FromArgb(250, 204, 21));
                        }
                    }
                }
            }

            // 6. Build Webpack frontend di Superset se richiesta
            if (chkBuildFrontend.Checked)
            {
                BuildSupersetFrontend(frontendDir);
            }

            // 7. Riavvio Docker se richiesto
            if (chkRestartDocker.Checked)
            {
                RestartDockerContainers(supersetPath);
            }

            AppendLog("=== INSTALLAZIONE STRATUMHEATMAP COMPLETATA CON SUCCESSO! ===", Color.FromArgb(74, 222, 128));
        }

        private void BuildPluginTypeScript(string pluginPath)
        {
            AppendLog("Esecuzione compilazione TypeScript del plugin...", Color.FromArgb(56, 189, 248));
            string tscLib = Path.Combine(pluginPath, "node_modules", "typescript", "lib", "tsc.js");
            int exitCode = -1;
            if (File.Exists(tscLib))
            {
                exitCode = RunProcessStreaming(pluginPath, "cmd.exe", "/c node \"" + tscLib + "\" --build", "PLUGIN-BUILD");
            }
            else
            {
                exitCode = RunProcessStreaming(pluginPath, "cmd.exe", "/c npm run build", "PLUGIN-BUILD");
            }

            if (exitCode == 0)
            {
                AppendLog("Compilazione TypeScript del plugin completata con successo.", Color.FromArgb(74, 222, 128));
            }
            else
            {
                AppendLog("Avviso durante compilazione TypeScript plugin (codice " + exitCode + "). Si prosegue con i file presenti.", Color.FromArgb(250, 204, 21));
            }
        }

        private void BuildSupersetFrontend(string frontendDir)
        {
            AppendLog("--- AVVIO COMPILAZIONE WEBPACK SUPERSET (npm run build) ---", Color.FromArgb(56, 189, 248));
            AppendLog("Cartella frontend: " + frontendDir, Color.White);
            AppendLog("Attendere: la compilazione dei bundle Webpack di Superset richiede generalmente 1-3 minuti...", Color.FromArgb(250, 204, 21));

            int exitCode = RunProcessStreaming(frontendDir, "cmd.exe", "/c npm run build", "WEBPACK");
            if (exitCode == 0)
            {
                AppendLog("Compilazione Webpack frontend completata con successo!", Color.FromArgb(74, 222, 128));
            }
            else
            {
                AppendLog("Avviso: 'npm run build' frontend terminato con codice " + exitCode + ". Controlla i dettagli nel log sopra.", Color.FromArgb(250, 204, 21));
            }
        }

        private void RestartDockerContainers(string supersetPath)
        {
            AppendLog("--- GESTIONE E RIAVVIO CONTAINER DOCKER SUPERSET ---", Color.FromArgb(56, 189, 248));

            int checkDocker = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker --version", "DOCKER-CHECK");
            if (checkDocker != 0)
            {
                AppendLog("Docker CLI non trovato nel PATH di sistema. Riavvio container ignorato.", Color.FromArgb(250, 204, 21));
                return;
            }

            bool hasNonDevCompose = File.Exists(Path.Combine(supersetPath, "docker-compose-non-dev.yml"));
            bool hasStandardCompose = File.Exists(Path.Combine(supersetPath, "docker-compose.yml"));

            int exitCode = -1;
            if (hasNonDevCompose)
            {
                AppendLog("Trovato docker-compose-non-dev.yml. Tentativo restart superset...", Color.FromArgb(56, 189, 248));
                exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose -f docker-compose-non-dev.yml restart superset", "DOCKER");
                if (exitCode != 0)
                {
                    AppendLog("Restart rapido non riuscito. Tentativo up -d --build superset...", Color.FromArgb(250, 204, 21));
                    exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose -f docker-compose-non-dev.yml up -d --build superset", "DOCKER");
                }
            }
            else if (hasStandardCompose)
            {
                AppendLog("Trovato docker-compose.yml. Tentativo restart superset_app...", Color.FromArgb(56, 189, 248));
                exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose restart superset_app", "DOCKER");
                if (exitCode != 0)
                {
                    AppendLog("Tentativo alternativo: docker compose restart superset...", Color.FromArgb(250, 204, 21));
                    exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose restart superset", "DOCKER");
                }
                if (exitCode != 0)
                {
                    AppendLog("Tentativo alternativo: docker compose up -d --build superset...", Color.FromArgb(250, 204, 21));
                    exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose up -d --build superset", "DOCKER");
                }
            }
            else
            {
                AppendLog("Tentativo riavvio standard: docker compose restart superset_app...", Color.FromArgb(56, 189, 248));
                exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose restart superset_app", "DOCKER");
                if (exitCode != 0)
                {
                    exitCode = RunProcessStreaming(supersetPath, "cmd.exe", "/c docker compose restart superset", "DOCKER");
                }
            }

            if (exitCode == 0)
            {
                AppendLog("Container Superset Docker riavviato e aggiornato con successo!", Color.FromArgb(74, 222, 128));
            }
            else
            {
                AppendLog("Avviso Docker: comando terminato con codice " + exitCode + ". Il daemon Docker potrebbe non essere attivo o i container non avviati.", Color.FromArgb(250, 204, 21));
                AppendLog("Puoi avviare manualmente Superset quando desideri con:", Color.White);
                AppendLog("  cd \"" + supersetPath + "\" && docker compose -f docker-compose-non-dev.yml up -d --build superset", Color.FromArgb(56, 189, 248));
            }
        }

        private void PerformRollback(string supersetPath, string frontendDir)
        {
            AppendLog("=== INIZIO ROLLBACK / DISINSTALLAZIONE ===", Color.FromArgb(244, 63, 94));
            string targetPluginDir = Path.Combine(frontendDir, "plugins", "superset-plugin-chart-stratum-heatmap");
            if (Directory.Exists(targetPluginDir))
            {
                SafeDeleteDirectory(targetPluginDir);
                AppendLog("Rimossa cartella plugin: " + targetPluginDir, Color.FromArgb(74, 222, 128));
            }

            PatchMainPreset(frontendDir, true);

            if (chkCleanCache.Checked)
            {
                string cacheDir = Path.Combine(frontendDir, "node_modules", ".cache");
                if (Directory.Exists(cacheDir))
                {
                    try { SafeDeleteDirectory(cacheDir); } catch { }
                }
            }
            AppendLog("=== ROLLBACK COMPLETATO CON SUCCESSO ===", Color.FromArgb(74, 222, 128));
        }

        private void PatchMainPreset(string frontendDir, bool isRollback)
        {
            string[] candidates = new string[]
            {
                Path.Combine(frontendDir, "src", "visualizations", "presets", "MainPreset.ts"),
                Path.Combine(frontendDir, "src", "visualizations", "presets", "MainPreset.js"),
                Path.Combine(frontendDir, "src", "setup", "setupPlugins.ts"),
                Path.Combine(frontendDir, "src", "setup", "setupPlugins.js")
            };

            string presetFile = null;
            foreach (string f in candidates)
            {
                if (File.Exists(f)) { presetFile = f; break; }
            }

            if (presetFile == null)
            {
                throw new FileNotFoundException("Impossibile trovare MainPreset.ts/js o setupPlugins.ts/js nel frontend!");
            }

            string bakFile = presetFile + ".bak";
            if (!File.Exists(bakFile))
            {
                File.Copy(presetFile, bakFile, true);
                AppendLog("Backup di sicurezza creato: " + Path.GetFileName(bakFile), Color.FromArgb(148, 163, 184));
            }

            string content = File.ReadAllText(presetFile, Encoding.UTF8);

            // Rimuovi vecchie iniezioni di import e registrazione
            content = Regex.Replace(content, @"import\s*\{[^}]*StratumHeatmap(?:Chart)?Plugin[^}]*\}\s*from\s*['""][^'""]*superset-plugin-chart-stratum-heatmap[^'""]*['""];?\r?\n?", "");
            content = Regex.Replace(content, @"[ \t]*new\s+StratumHeatmap(?:Chart)?Plugin\(\)\.configure\(\{[\s\S]*?\}\)(\.register\(\))?,?\r?\n?", "");

            if (!isRollback)
            {
                string targetImport = "import { StratumHeatmapChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';";
                string targetRegister = "        new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register(),";

                string[] lines = content.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None);
                string nl = content.Contains("\r\n") ? "\r\n" : "\n";
                var lineList = new System.Collections.Generic.List<string>(lines);

                int lastImportIdx = -1;
                for (int i = 0; i < lineList.Count; i++)
                {
                    if (lineList[i].TrimStart().StartsWith("import "))
                    {
                        lastImportIdx = i;
                    }
                }

                if (lastImportIdx >= 0)
                {
                    lineList.Insert(lastImportIdx + 1, targetImport);
                }
                else
                {
                    lineList.Insert(0, targetImport);
                }

                int pluginsIdx = -1;
                for (int i = 0; i < lineList.Count; i++)
                {
                    if (Regex.IsMatch(lineList[i], @"plugins\s*:\s*\["))
                    {
                        pluginsIdx = i;
                        break;
                    }
                }

                if (pluginsIdx >= 0)
                {
                    lineList.Insert(pluginsIdx + 1, targetRegister);
                }
                else
                {
                    lineList.Add(targetRegister);
                }

                content = string.Join(nl, lineList.ToArray());
                AppendLog("Registrato StratumHeatmapChartPlugin in " + Path.GetFileName(presetFile), Color.FromArgb(74, 222, 128));
            }
            else
            {
                AppendLog("Rimosso StratumHeatmapChartPlugin da " + Path.GetFileName(presetFile), Color.FromArgb(74, 222, 128));
            }

            File.WriteAllText(presetFile, content, new UTF8Encoding(false));
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
                if (name == "node_modules" || name == ".git" || name == ".turbo" || name == ".cache") continue;
                CopyDirectory(subDir, Path.Combine(destDir, name));
            }
        }
    }
}
