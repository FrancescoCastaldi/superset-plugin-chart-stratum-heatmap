#!/usr/bin/env python3
"""
StratumHeatmap — Graphical Plugin Installer for Apache Superset
Author: Francesco Castaldi
"""

import sys
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk

# Import logica core dell'installer
from installer import (
    auto_detect_superset_path,
    install_plugin,
)

class StratumHeatmapInstallerGUI(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("StratumHeatmap — Apache Superset Plugin Installer")
        self.geometry("640x620")
        self.minsize(580, 560)
        self.configure(bg="#f8fafc")

        # Icona o stile
        self.style = ttk.Style(self)
        self.style.theme_use("clam")
        self.configure_styles()

        self.script_dir = Path(__file__).resolve().parent
        self.plugin_root = self.script_dir.parent

        self.create_widgets()
        self.auto_populate_path()

    def configure_styles(self):
        self.style.configure("TLabel", background="#f8fafc", font=("Segoe UI", 10))
        self.style.configure("Header.TLabel", font=("Segoe UI", 15, "bold"), foreground="#0f172a", background="#f8fafc")
        self.style.configure("SubHeader.TLabel", font=("Segoe UI", 9), foreground="#64748b", background="#f8fafc")
        self.style.configure("Primary.TButton", font=("Segoe UI", 11, "bold"), padding=8)
        self.style.map("Primary.TButton",
            background=[("active", "#0284c7"), ("!disabled", "#0369a1")],
            foreground=[("!disabled", "#ffffff")]
        )

    def create_widgets(self):
        # Header Frame
        header_frame = tk.Frame(self, bg="#ffffff", padx=20, pady=16, bd=1, relief="solid")
        header_frame.pack(fill="x")

        # Thumbnail Preview
        thumb_path = self.plugin_root / "src" / "images" / "thumbnail.png"
        if thumb_path.is_file():
            try:
                pil_img = Image.open(thumb_path)
                pil_img = pil_img.resize((80, 60), Image.Resampling.LANCZOS)
                self.thumb_tk = ImageTk.PhotoImage(pil_img)
                lbl_thumb = tk.Label(header_frame, image=self.thumb_tk, bg="#ffffff")
                lbl_thumb.pack(side="left", padx=(0, 16))
            except Exception:
                pass

        header_text_frame = tk.Frame(header_frame, bg="#ffffff")
        header_text_frame.pack(side="left", fill="both", expand=True)

        lbl_title = ttk.Label(header_text_frame, text="StratumHeatmap Installer", style="Header.TLabel")
        lbl_title.pack(anchor="w")

        lbl_desc = ttk.Label(
            header_text_frame,
            text="Installa e registra il plugin ECharts Matrix Grid in Apache Superset.",
            style="SubHeader.TLabel"
        )
        lbl_desc.pack(anchor="w", pady=(2, 0))

        # Main Body Frame
        body_frame = tk.Frame(self, bg="#f8fafc", padx=20, pady=16)
        body_frame.pack(fill="both", expand=True)

        # Path Selection
        lbl_path = ttk.Label(body_frame, text="Cartella Radice di Apache Superset:", font=("Segoe UI", 10, "bold"))
        lbl_path.pack(anchor="w", pady=(0, 4))

        path_input_frame = tk.Frame(body_frame, bg="#f8fafc")
        path_input_frame.pack(fill="x", pady=(0, 12))

        self.path_var = tk.StringVar()
        self.entry_path = ttk.Entry(path_input_frame, textvariable=self.path_var, font=("Segoe UI", 10))
        self.entry_path.pack(side="left", fill="x", expand=True, padx=(0, 8))

        btn_browse = ttk.Button(path_input_frame, text="Sfoglia...", command=self.browse_path)
        btn_browse.pack(side="right")

        # Checkboxes / Opzioni
        options_frame = tk.Frame(body_frame, bg="#f8fafc")
        options_frame.pack(fill="x", pady=(0, 16))

        self.docker_var = tk.BooleanVar(value=False)
        chk_docker = ttk.Checkbutton(
            options_frame,
            text="Esegui ricompilazione e riavvio automatico con Docker Compose (se attivo)",
            variable=self.docker_var
        )
        chk_docker.pack(anchor="w")

        # Action Button
        self.btn_install = ttk.Button(
            body_frame,
            text="🚀 Installa StratumHeatmap in Superset",
            style="Primary.TButton",
            command=self.start_installation
        )
        self.btn_install.pack(fill="x", pady=(0, 16))

        # Log Console
        lbl_log = ttk.Label(body_frame, text="Log Operazioni:", font=("Segoe UI", 9, "bold"))
        lbl_log.pack(anchor="w", pady=(0, 4))

        self.txt_log = tk.Text(
            body_frame,
            height=10,
            bg="#0f172a",
            fg="#f8fafc",
            insertbackground="#ffffff",
            font=("Consolas", 9),
            padx=10,
            pady=10,
            bd=0
        )
        self.txt_log.pack(fill="both", expand=True)

        # Configura tag colori console
        self.txt_log.tag_config("info", foreground="#38bdf8")
        self.txt_log.tag_config("success", foreground="#4ade80")
        self.txt_log.tag_config("warn", foreground="#facc15")
        self.txt_log.tag_config("error", foreground="#f87171")

    def auto_populate_path(self):
        detected = auto_detect_superset_path()
        if detected:
            self.path_var.set(str(detected))
            self.log(f"Percorso Superset rilevato automaticamente: {detected}", "success")
        else:
            self.log("Nessun percorso Superset rilevato automaticamente. Seleziona la cartella con 'Sfoglia...'.", "warn")

    def browse_path(self):
        folder = filedialog.askdirectory(
            title="Seleziona la cartella radice di Apache Superset",
            initialdir=self.path_var.get() or "D:\\Sviluppo"
        )
        if folder:
            self.path_var.set(folder)
            self.log(f"Cartella selezionata: {folder}", "info")

    def log(self, message: str, level: str = "info"):
        self.txt_log.insert("end", f"[{level.upper()}] {message}\n", level)
        self.txt_log.see("end")

    def start_installation(self):
        superset_path_str = self.path_var.get().strip()
        if not superset_path_str:
            messagebox.showwarning("Attenzione", "Inserisci il percorso di Apache Superset.")
            return

        superset_root = Path(superset_path_str).resolve()
        if not superset_root.is_dir():
            messagebox.showerror("Errore", f"La cartella specificata non esiste:\n{superset_root}")
            return

        self.btn_install.config(state="disabled")
        self.log("--- INIZIO INSTALLAZIONE ---", "info")

        def _worker():
            try:
                install_plugin(
                    superset_root=superset_root,
                    docker=self.docker_var.get(),
                    logger=lambda msg, lvl: self.after(0, self.log, msg, lvl)
                )
                self.after(0, lambda: messagebox.showinfo("Successo", "StratumHeatmap è stato installato e registrato con successo in Apache Superset!"))
            except Exception as e:
                self.after(0, self.log, f"Errore durante l'installazione: {e}", "error")
                self.after(0, lambda: messagebox.showerror("Errore", f"Installazione fallita:\n{e}"))
            finally:
                self.after(0, lambda: self.btn_install.config(state="normal"))

        thread = threading.Thread(target=_worker, daemon=True)
        thread.start()


if __name__ == "__main__":
    app = StratumHeatmapInstallerGUI()
    app.mainloop()
