import threading
import queue
import io
import zipfile
import requests
import os
import sys
import json
from pathlib import Path
from tkinter import Tk, ttk, messagebox
from tkinter.scrolledtext import ScrolledText

# —— Configuration constants —— #

HOST_PATH = "https://setup.rbxcdn.com"

BINARY_TYPES = {
    "WindowsPlayer": {"blobDir": "/",    "versionFile": "/version"},
    "WindowsStudio64": {"blobDir": "/", "versionFile": "/versionQTStudio"},
    "MacPlayer": {"blobDir": "/mac/",  "versionFile": "/mac/version"},
    "MacStudio": {"blobDir": "/mac/",  "versionFile": "/mac/versionStudio"},
}

EXTRACT_ROOTS = {
    "player": {
        "RobloxApp.zip": "",
        "redist.zip": "",
        "shaders.zip": "shaders/",
        "ssl.zip": "ssl/",
        "WebView2.zip": "",
        "WebView2RuntimeInstaller.zip": "WebView2RuntimeInstaller/",
        "content-avatar.zip": "content/avatar/",
        "content-configs.zip": "content/configs/",
        "content-fonts.zip": "content/fonts/",
        "content-sky.zip": "content/sky/",
        "content-sounds.zip": "content/sounds/",
        "content-textures2.zip": "content/textures/",
        "content-models.zip": "content/models/",
        "content-platform-fonts.zip": "PlatformContent/pc/fonts/",
        "content-platform-dictionaries.zip": "PlatformContent/pc/shared_compression_dictionaries/",
        "content-terrain.zip": "PlatformContent/pc/terrain/",
        "content-textures3.zip": "PlatformContent/pc/textures/",
        "extracontent-luapackages.zip": "ExtraContent/LuaPackages/",
        "extracontent-translations.zip": "ExtraContent/translations/",
        "extracontent-models.zip": "ExtraContent/models/",
        "extracontent-textures.zip": "ExtraContent/textures/",
        "extracontent-places.zip": "ExtraContent/places/"
    },
    "studio": {
        "RobloxStudio.zip": "",
        "RibbonConfig.zip": "RibbonConfig/",
        "redist.zip": "",
        "Libraries.zip": "",
        "LibrariesQt5.zip": "",
        "WebView2.zip": "",
        "WebView2RuntimeInstaller.zip": "WebView2RuntimeInstaller/",
        "shaders.zip": "shaders/",
        "ssl.zip": "ssl/",
        "Qml.zip": "Qml/",
        "Plugins.zip": "Plugins/",
        "StudioFonts.zip": "StudioFonts/",
        "BuiltInPlugins.zip": "BuiltInPlugins/",
        "ApplicationConfig.zip": "ApplicationConfig/",
        "BuiltInStandalonePlugins.zip": "BuiltInStandalonePlugins/",
        "content-qt_translations.zip": "content/qt_translations/",
        "content-sky.zip": "content/sky/",
        "content-fonts.zip": "content/fonts/",
        "content-avatar.zip": "content/avatar/",
        "content-models.zip": "content/models/",
        "content-sounds.zip": "content/sounds/",
        "content-configs.zip": "content/configs/",
        "content-api-docs.zip": "content/api_docs/",
        "content-textures2.zip": "content/textures/",
        "content-studio_svg_textures.zip": "content/studio_svg_textures/",
        "content-platform-fonts.zip": "PlatformContent/pc/fonts/",
        "content-platform-dictionaries.zip": "PlatformContent/pc/shared_compression_dictionaries/",
        "content-terrain.zip": "PlatformContent/pc/terrain/",
        "content-textures3.zip": "PlatformContent/pc/textures/",
        "extracontent-translations.zip": "ExtraContent/translations/",
        "extracontent-luapackages.zip": "ExtraContent/LuaPackages/",
        "extracontent-textures.zip": "ExtraContent/textures/",
        "extracontent-scripts.zip": "ExtraContent/scripts/",
        "extracontent-models.zip": "ExtraContent/models/"
    }
}

PASTEBIN_URL = "https://pastebin.com/raw/vgqfphAY"

def normalize_version(v: str) -> str:
    v = v.strip().lower()
    if not v.startswith("version-"):
        v = "version-" + v
    return v

def get_downloads_folder() -> Path:
    home = Path.home()
    if sys.platform.startswith("win"):
        return Path(os.environ.get("USERPROFILE", home)) / "Downloads"
    else:
        return home / "Downloads"

def worker_task(log_q: queue.Queue, progress_q: queue.Queue, channel: str, binary_type: str, version: str):
    log = lambda msg="": log_q.put(msg)
    try:
        log("▶ Starting download…")
        version_norm = normalize_version(version)
        chan = channel.strip().upper() or "LIVE"
        base = HOST_PATH if chan == "LIVE" else f"{HOST_PATH}/channel/{chan.lower()}"
        manifest_url = f"{base}{BINARY_TYPES[binary_type]['blobDir']}{version_norm}-rbxPkgManifest.txt"
        log(f"⎙ Fetching manifest: {manifest_url}")
        resp = requests.get(manifest_url, timeout=30)
        resp.raise_for_status()
        lines = [ln.strip() for ln in resp.text.splitlines() if ln.strip().endswith(".zip")]

        kind = "player" if "Player" in binary_type else "studio"
        roots = EXTRACT_ROOTS[kind]

        downloads = get_downloads_folder()
        out_dir = downloads / version_norm
        out_dir.mkdir(parents=True, exist_ok=True)
        log(f"⎙ Created folder: {out_dir}")

        xml = '<?xml version="1.0" encoding="UTF-8"?><Settings><ContentFolder>content</ContentFolder><BaseUrl>http://www.roblox.com</BaseUrl></Settings>'
        (out_dir / "AppSettings.xml").write_text(xml, encoding="utf-8")

        for name in lines:
            blob_url = f"{base}{BINARY_TYPES[binary_type]['blobDir']}{version_norm}-{name}"
            log(f"↓ Downloading {name}")
            bresp = requests.get(blob_url, stream=True, timeout=60)
            bresp.raise_for_status()

            total = int(bresp.headers.get("Content-Length", 0))
            progress_q.put(("set_max", total))
            downloaded = 0
            buffer = io.BytesIO()
            for chunk in bresp.iter_content(64*1024):
                if not chunk:
                    break
                buffer.write(chunk)
                downloaded += len(chunk)
                progress_q.put(("progress", downloaded))

            buffer.seek(0)
            log(f"⎙ Extracting {name}…")
            with zipfile.ZipFile(buffer) as zin:
                root = roots.get(name, "")
                for zi in zin.infolist():
                    if zi.is_dir():
                        continue
                    target = out_dir / root / zi.filename.replace("\\", "/")
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with open(target, "wb") as f:
                        f.write(zin.read(zi.filename))

            log(f"→ {name} done")
            progress_q.put(("reset", 0))

        log("✅ All files extracted successfully!")
    except requests.exceptions.HTTPError as ex:
        if ex.response.status_code == 403:
            log("❌ Error: version hash invalid or service unavailable.")
        else:
            log(f"❌ HTTP error: {ex}")
    except Exception as ex:
        log(f"❌ Error: {ex}")
    finally:
        log_q.put(None)
        progress_q.put(None)

class App(Tk):
    def __init__(self):
        super().__init__()
        self.title("Roblox Deployment Downloader")
        self.geometry("600x580")
        self.resizable(False, False)

        frm = ttk.Frame(self, padding=20)
        frm.pack(fill="both", expand=True)

        # Channel
        ttk.Label(frm, text="Channel Name:").grid(column=0, row=0, sticky="w")
        self.channel = ttk.Entry(frm)
        self.channel.grid(column=1, row=0, sticky="ew")
        self.channel.insert(0, "LIVE")

        # Binary Type
        ttk.Label(frm, text="Binary Type:").grid(column=0, row=1, sticky="w")
        self.binary = ttk.Combobox(frm, values=list(BINARY_TYPES.keys()), state="readonly")
        self.binary.grid(column=1, row=1, sticky="ew")
        self.binary.set("WindowsPlayer")

        # Version Hash entry
        ttk.Label(frm, text="Version Hash:").grid(column=0, row=2, sticky="w")
        self.version = ttk.Entry(frm)
        self.version.grid(column=1, row=2, sticky="ew")

        # Saved versions dropdown (scrollable)
        ttk.Label(frm, text="Saved Versions:").grid(column=0, row=3, sticky="w")
        self.versions = ttk.Combobox(frm, state="disabled", height=10)
        self.versions.grid(column=1, row=3, sticky="ew")
        self.versions.bind("<<ComboboxSelected>>", self.on_version_select)

        # Download button
        self.download_btn = ttk.Button(frm, text="Download", command=self.start)
        self.download_btn.grid(column=1, row=4, pady=(10, 5), sticky="e")

        # Progress bar
        self.progress = ttk.Progressbar(frm, orient="horizontal", mode="determinate")
        self.progress.grid(column=0, row=5, columnspan=2, sticky="ew", pady=(5, 15))

        # Console output
        frm.columnconfigure(1, weight=1)
        ttk.Label(frm, text="Console:").grid(column=0, row=6, sticky="nw")
        self.logbox = ScrolledText(frm, height=10, state="disabled", wrap="word")
        self.logbox.grid(column=0, row=7, columnspan=2, sticky="nsew")
        frm.rowconfigure(7, weight=1)

        # Attribution note
        note = (
            "Took functionality from https://rdd.weao.xyz/ and made into Python program\n"
            "Thanks to Weao and RDD Latte owners"
        )
        ttk.Label(frm, text=note, font=("Arial", 8), foreground="gray")\
           .grid(column=0, row=8, columnspan=2, sticky="w", pady=(10, 0))

        # Queues & polling
        self.log_queue = queue.Queue()
        self.progress_queue = queue.Queue()
        self.after(100, self.check_queue)
        self.after(100, self.check_progress)

        # Load saved versions mapping
        self.load_saved_versions()

    def log(self, msg: str):
        self.logbox.configure(state="normal")
        self.logbox.insert("end", msg + "\n")
        self.logbox.see("end")
        self.logbox.configure(state="disabled")

    def check_queue(self):
        try:
            while True:
                msg = self.log_queue.get_nowait()
                if msg is None:
                    self.download_btn.state(["!disabled"])
                    break
                self.log(msg)
        except queue.Empty:
            pass
        finally:
            self.after(100, self.check_queue)

    def check_progress(self):
        try:
            while True:
                msg = self.progress_queue.get_nowait()
                if msg is None:
                    self.progress['value'] = 0
                    break
                action, val = msg
                if action == "set_max":
                    self.progress['maximum'] = val
                elif action == "progress":
                    self.progress['value'] = val
                elif action == "reset":
                    self.progress['value'] = 0
        except queue.Empty:
            pass
        finally:
            self.after(100, self.check_progress)

    def start(self):
        chan = self.channel.get().strip()
        bin_type = self.binary.get()
        ver = self.version.get().strip()
        if not bin_type or not ver:
            messagebox.showwarning("Missing Fields", "Please fill in all fields.")
            return
        self.download_btn.state(["disabled"])
        threading.Thread(
            target=worker_task,
            args=(self.log_queue, self.progress_queue, chan, bin_type, ver),
            daemon=True
        ).start()

    def load_saved_versions(self):
        try:
            resp = requests.get(PASTEBIN_URL, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            entries = []
            for full_ver, xeno in data.items():
                key = full_ver[len("version-"):] if full_ver.lower().startswith("version-") else full_ver
                entries.append(f"{key}  –  {xeno}")
            entries.sort()
            self.versions.configure(values=entries, state="readonly")
        except Exception as e:
            self.log(f"⚠️ Could not load saved versions: {e}")

    def on_version_select(self, event):
        sel = self.versions.get()
        hash_part = sel.split("–", 1)[0].strip()
        self.version.delete(0, "end")
        self.version.insert(0, hash_part)

def main():
    app = App()
    app.mainloop()

if __name__ == "__main__":
    main()
