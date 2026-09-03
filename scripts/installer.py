#!/usr/bin/env python3
"""
Apache Superset - Automated Chart Plugin Installer for StratumHeatmap
Author: Francesco Castaldi
Description: Cross-platform installer for integrating the StratumHeatmap (ECharts Matrix Grid) Chart Plugin
into an existing Superset repository (Docker Compose non-dev / dev / Local).
"""

import os
import sys
import shutil
import json
import re
import argparse
import subprocess
from pathlib import Path


COMMON_SUPERSET_CANDIDATES = [
    Path(r"D:\Sviluppo\superset"),
    Path(r"C:\Users\fracas\Desktop\superset"),
    Path(r"C:\Users\fracas\OneDrive - mapsengineering.com\superset-6.1.0"),
    Path(r"..\superset").resolve(),
]


def log_info(msg: str):
    print(f"\033[94m[INFO]\033[0m {msg}")


def log_success(msg: str):
    print(f"\033[92m[SUCCESS]\033[0m {msg}")


def log_warn(msg: str):
    print(f"\033[93m[WARNING]\033[0m {msg}")


def log_error(msg: str):
    print(f"\033[91m[ERROR]\033[0m {msg}")


def auto_detect_superset_path() -> Path | None:
    for candidate in COMMON_SUPERSET_CANDIDATES:
        try:
            if candidate.is_dir() and (candidate / "superset-frontend" / "package.json").is_file():
                return candidate
        except Exception:
            continue
    return None


def find_superset_frontend(superset_root: Path) -> Path:
    frontend_dir = superset_root / "superset-frontend"
    if frontend_dir.is_dir() and (frontend_dir / "package.json").is_file():
        return frontend_dir
    raise FileNotFoundError(
        f"Could not find 'superset-frontend/package.json' inside '{superset_root}'. "
        "Please ensure the path points to the root of the Apache Superset repository."
    )


def find_main_preset(frontend_dir: Path) -> Path:
    candidates = [
        frontend_dir / "src" / "visualizations" / "presets" / "MainPreset.ts",
        frontend_dir / "src" / "visualizations" / "presets" / "MainPreset.js",
        frontend_dir / "src" / "setup" / "setupPlugins.ts",
        frontend_dir / "src" / "setup" / "setupPlugins.js",
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError(
        f"Could not locate MainPreset or setupPlugins file in '{frontend_dir}/src'."
    )


def backup_file(file_path: Path):
    bak_path = file_path.with_suffix(file_path.suffix + ".bak")
    if not bak_path.exists():
        shutil.copy2(file_path, bak_path)
        log_info(f"Creato backup di sicurezza: {bak_path.name}")


def copy_plugin_files(plugin_root: Path, frontend_dir: Path) -> tuple[str, bool]:
    plugins_target_dir = frontend_dir / "plugins"
    plugins_target_dir.mkdir(parents=True, exist_ok=True)

    dest_plugin_dir = plugins_target_dir / "superset-plugin-chart-stratum-heatmap"
    is_update = dest_plugin_dir.exists()

    if is_update:
        log_info(f"Pulizia e rimozione forzata cartella plugin esistente: {dest_plugin_dir.name}...")
        shutil.rmtree(dest_plugin_dir, ignore_errors=True)

    log_info(f"Copia sorgenti di StratumHeatmap in '{dest_plugin_dir.name}'...")
    shutil.copytree(
        plugin_root,
        dest_plugin_dir,
        ignore=shutil.ignore_patterns("node_modules", "dist", ".git", ".turbo", "*.log", "scripts")
    )
    log_success(f"Sorgenti plugin aggiornati con successo in {dest_plugin_dir}")
    return "./plugins/superset-plugin-chart-stratum-heatmap", is_update


def patch_main_preset(preset_file: Path):
    backup_file(preset_file)

    with open(preset_file, "r", encoding="utf-8") as f:
        content = f.read()

    import_stmt = "import { StratumHeatmapPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';\n"
    register_stmt = "        new StratumHeatmapPlugin().configure({ key: 'stratum_heatmap' }).register(),\n"

    if "StratumHeatmapPlugin" in content:
        log_warn(f"StratumHeatmapPlugin è già presente in {preset_file.name}. Registrazione saltata.")
        return

    content = import_stmt + content
    plugins_match = re.search(r"plugins\s*:\s*\[", content)
    if plugins_match:
        insert_pos = plugins_match.end()
        content = content[:insert_pos] + "\n" + register_stmt + content[insert_pos:]
    else:
        content += f"\nnew StratumHeatmapPlugin().configure({{ key: 'stratum_heatmap' }}).register();\n"

    with open(preset_file, "w", encoding="utf-8") as f:
        f.write(content)

    log_success(f"Registrato StratumHeatmapPlugin (key: 'stratum_heatmap') in {preset_file.name}")


def trigger_docker_build(superset_root: Path, compose_file: str = "docker-compose-non-dev.yml"):
    log_info(f"Avvio Docker Compose Build con file '{compose_file}'...")
    try:
        cmd = ["docker", "compose", "-f", compose_file, "up", "-d", "--build", "superset"]
        if not (superset_root / compose_file).exists():
            log_warn(f"File '{compose_file}' non trovato in {superset_root}, fallback su 'docker compose up -d --build superset'")
            cmd = ["docker", "compose", "up", "-d", "--build", "superset"]

        log_info(f"Esecuzione: {' '.join(cmd)}")
        subprocess.run(cmd, cwd=superset_root, check=True)
        log_success("Container Superset ricostruito e avviato con successo!")
    except Exception as e:
        log_warn(f"Avviso durante esecuzione Docker Compose: {e}")
        log_info(f"Puoi eseguire manualmente sul server: docker compose -f {compose_file} up -d --build superset")


def install_plugin(superset_root: Path, docker: bool = False, compose_file: str = "docker-compose-non-dev.yml", logger=None):
    def _log(msg, level="info"):
        if logger:
            logger(msg, level)
        elif level == "success":
            log_success(msg)
        elif level == "warn":
            log_warn(msg)
        elif level == "error":
            log_error(msg)
        else:
            log_info(msg)

    script_dir = Path(__file__).resolve().parent
    plugin_root = script_dir.parent

    if not superset_root.is_dir():
        raise FileNotFoundError(f"Cartella Superset non trovata: {superset_root}")

    _log(f"Cartella Target Superset: {superset_root}")
    _log(f"Cartella Plugin: {plugin_root}")

    frontend_dir = find_superset_frontend(superset_root)
    main_preset = find_main_preset(frontend_dir)

    _log(f"Frontend: {frontend_dir.name}")
    _log(f"MainPreset: {main_preset.name}")

    copy_plugin_files(plugin_root, frontend_dir)
    patch_main_preset(main_preset)

    if docker:
        trigger_docker_build(superset_root, compose_file)

    _log("Installazione di StratumHeatmap completata con successo!", "success")


def main():
    parser = argparse.ArgumentParser(
        description="Automated installer for StratumHeatmap Chart Plugin"
    )
    default_path = auto_detect_superset_path()
    parser.add_argument(
        "--superset-path",
        "-s",
        type=str,
        default=str(default_path) if default_path else None,
        help="Percorso della cartella radice di Apache Superset"
    )
    parser.add_argument(
        "--compose-file",
        "-c",
        type=str,
        default="docker-compose-non-dev.yml",
        help="Docker compose file da utilizzare"
    )
    parser.add_argument(
        "--docker",
        action="store_true",
        default=False,
        help="Ricostruisce e riavvia il container Docker compose"
    )
    parser.add_argument(
        "--no-docker",
        dest="docker",
        action="store_false",
        help="Non esegue comandi Docker"
    )

    args = parser.parse_args()

    if not args.superset_path:
        print("\033[93m[ATTENZIONE]\033[0m Nessun percorso Superset specificato o auto-rilevato.")
        path_input = input("Inserisci il percorso della cartella radice di Apache Superset: ").strip()
        if not path_input:
            print("\033[91m[ERRORE]\033[0m Percorso obbligatorio. Operazione annullata.")
            sys.exit(1)
        args.superset_path = path_input

    superset_root = Path(args.superset_path).resolve()

    try:
        install_plugin(superset_root, docker=args.docker, compose_file=args.compose_file)
    except Exception as e:
        log_error(f"Errore durante l'installazione: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
