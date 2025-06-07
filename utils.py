import os
import subprocess
import urllib.request
import requests
import zipfile
import tempfile
import webbrowser
from tkinter import messagebox
from pathlib import Path
import io

apps = {
    # (restul aplicațiilor rămâne neschimbat)
}

import os
import subprocess
import urllib.request
import requests
import zipfile
import tempfile
import webbrowser
from tkinter import messagebox
from pathlib import Path
import io

apps = {
    "Discord": "https://dl.discordapp.net/distro/app/stable/win/x86/1.0.9014/DiscordSetup.exe",
    "Steam": "https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe",
    "Epic Games": "https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/installer/download/EpicGamesLauncherInstaller.msi",
    "Brave Browser": "https://laptop-updates.brave.com/latest/winx64",
    "Faceit AC": "https://cdn.faceit.com/faceit/anticheat/FaceitAC_1.0.17.36.exe",
    "Spotify": "https://download.scdn.co/SpotifySetup.exe",
    "WinRAR": "https://www.rarlab.com/rar/winrar-x64-621.exe",
    "Malwarebytes": "https://data-cdn.mbamupdates.com/web/mb4-setup-consumer/offline/MBSetup.exe",
    "VLC Player": "https://get.videolan.org/vlc/3.0.20/win64/vlc-3.0.20-win64.exe",
    "qBittorrent": "https://sourceforge.net/projects/qbittorrent/files/latest/download"
}

def download_and_run(url, name, progress_callback=None):
    try:
        path = os.path.join(tempfile.gettempdir(), f"{name}.exe")

        def reporthook(block_num, block_size, total_size):
            if progress_callback and total_size > 0:
                downloaded = block_num * block_size
                percent = min(100, int(downloaded * 100 / total_size))
                progress_callback(percent)

        urllib.request.urlretrieve(url, path, reporthook)
        subprocess.Popen(path, shell=True)
        tfy_notify(f"📦 {name}", f"{name} s-a instalat / lansat.")
    except Exception as e:
        messagebox.showerror("Download Error", str(e))

def clean_temp():
    try:
        os.system("del /s /f /q %temp%\\*")
        os.system("del /s /f /q C:\\Windows\\Temp\\*")
        messagebox.showinfo("Temp Cleaner", "Temporary files cleaned!")
        tfy_notify("🧹 TFY Tool", "Temporary files cleaned successfully.")
    except Exception as e:
        messagebox.showerror("Temp Cleaner Error", str(e))
        tfy_notify("❌ TFY Tool", f"Temp clean failed:\n{e}")


def run_optimization():
    try:
        messagebox.showinfo("Optimization", "Starting optimization... This may take a moment.")
        url = "https://raw.githubusercontent.com/DragosKissLove/testbot/main/TFY%20Optimization.bat"
        path = os.path.join(tempfile.gettempdir(), "TFY_Optimization.bat")
        urllib.request.urlretrieve(url, path)
        subprocess.run(["powershell", "-Command", f'Start-Process \"{path}\" -Verb RunAs'], shell=True)
        messagebox.showinfo("Optimization", "Optimization completed!")
    except Exception as e:
        messagebox.showerror("Optimization Error", str(e))
        tfy_notify("⚙️ Optimization", "✔️ Optimizarea s-a finalizat!")
    except Exception as e:
        tfy_notify("❌ Optimization", f"Eroare:\n{e}")

def activate_windows():
    try:
        messagebox.showinfo("Activation", "Starting activation process...")
        os.system('powershell -Command "irm https://get.activated.win | iex"')
        messagebox.showinfo("Activation", "Activation process started.")
    except Exception as e:
        messagebox.showerror("Activation Error", str(e))

def winrar_crack():
    try:
        url = "https://github.com/jtlw99/crack-winrar/releases/download/v1/rarreg.key"
        r = requests.get(url)
        for path in ["C:\\Program Files\\WinRAR\\rarreg.key", "C:\\Program Files (x86)\\WinRAR\\rarreg.key"]:
            try:
                with open(path, "wb") as f:
                    f.write(r.content)
                messagebox.showinfo("Success", f"Crack applied in {path}")
                return
            except:
                continue
        messagebox.showwarning("Warning", "No valid WinRAR path found.")
    except Exception as e:
        messagebox.showerror("Error", str(e))

def install_atlas_tools():
    try:
        messagebox.showinfo("Atlas Tools", "Downloading Atlas OS Tools. Please wait...")
        download_folder = os.path.join(os.path.expanduser("~"), "Downloads")
        os.makedirs(download_folder, exist_ok=True)
        atlas_url = "https://github.com/Atlas-OS/Atlas/releases/download/0.4.1/AtlasPlaybook_v0.4.1.apbx"
        ame_url = "https://download.ameliorated.io/AME%20Wizard%20Beta.zip"
        atlas_path = os.path.join(download_folder, "AtlasPlaybook_v0.4.1.apbx")
        ame_zip = os.path.join(download_folder, "AME_Wizard_Beta.zip")
        ame_extract = os.path.join(download_folder, "AME_Wizard_Beta")
        urllib.request.urlretrieve(atlas_url, atlas_path)
        urllib.request.urlretrieve(ame_url, ame_zip)
        with zipfile.ZipFile(ame_zip, 'r') as zip_ref:
            zip_ref.extractall(ame_extract)
        for root, _, files in os.walk(ame_extract):
            for file in files:
                if file.endswith(".exe"):
                    os.startfile(os.path.join(root, file))
                    return
        messagebox.showerror("Error", "No executable found.")
    except Exception as e:
        messagebox.showerror("Atlas OS Tools Error", str(e))


def wifi_passwords():
    try:
        result = subprocess.check_output("netsh wlan show profiles", shell=True).decode()
        profiles = [line.split(":")[1].strip() for line in result.split("\n") if "All User Profile" in line]
        out = ""
        for profile in profiles:
            try:
                pw_result = subprocess.check_output(f'netsh wlan show profile name="{profile}" key=clear', shell=True).decode()
                for line in pw_result.split("\n"):
                    if "Key Content" in line:
                        password = line.split(":")[1].strip()
                        out += f"{profile}: {password}\n"
            except:
                continue
        if out:
            messagebox.showinfo("WiFi Passwords", out)
        else:
            messagebox.showinfo("WiFi Passwords", "No passwords found.")
    except Exception as e:
        messagebox.showerror("WiFi Error", str(e))

def open_discord():
    webbrowser.open("https://discord.gg/tfyexe")
    tfy_notify("🔗 TFY Tool", "Discord s-a deschis!")


# =========== NOU =========== #
def download_roblox_player(version_hash, log_callback, progress_callback):
    try:
        base_url = "https://setup.rbxcdn.com"
        version_hash = version_hash.strip().lower()
        if not version_hash.startswith("version-"):
            version_hash = f"version-{version_hash}"

        manifest_url = f"{base_url}/{version_hash}-rbxPkgManifest.txt"
        log_callback(f"Fetching manifest: {manifest_url}")
        resp = requests.get(manifest_url, timeout=30)
        resp.raise_for_status()

        lines = [ln.strip() for ln in resp.text.splitlines() if ln.strip().endswith(".zip")]

        target_root = Path(r"C:\Program Files (x86)\Roblox\Versions") / version_hash
        target_root.mkdir(parents=True, exist_ok=True)
        log_callback(f"Created folder: {target_root}")

        xml = '<?xml version="1.0" encoding="UTF-8"?><Settings><ContentFolder>content</ContentFolder><BaseUrl>http://www.roblox.com</BaseUrl></Settings>'
        (target_root / "AppSettings.xml").write_text(xml, encoding="utf-8")

        extract_roots = {
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
        }

        for name in lines:
            blob_url = f"{base_url}/{version_hash}-{name}"
            log_callback(f"Downloading {name}")
            bresp = requests.get(blob_url, stream=True, timeout=60)
            bresp.raise_for_status()

            total = int(bresp.headers.get("Content-Length", 0))
            progress_callback("set_max", total)
            downloaded = 0
            import io
            buffer = io.BytesIO()

            for chunk in bresp.iter_content(64 * 1024):
                if not chunk:
                    break
                buffer.write(chunk)
                downloaded += len(chunk)
                progress_callback("progress", downloaded)

            buffer.seek(0)
            log_callback(f"Extracting {name}")
            with zipfile.ZipFile(buffer) as zin:
                root = extract_roots.get(name, "")
                for zi in zin.infolist():
                    if zi.is_dir():
                        continue
                    target = target_root / root / zi.filename.replace("\\", "/")
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with open(target, "wb") as f:
                        f.write(zin.read(zi.filename))

            log_callback(f"{name} done")
            progress_callback("reset", 0)

        log_callback("✅ All files extracted successfully!")

    except Exception as ex:
        log_callback(f"❌ Error: {ex}")
# ============================ #

# Restul funcțiilor tale (download_and_run, clean_temp etc.) rămân la fel

def install_spicetify_from_github():
    try:
        subprocess.run([
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            "iwr -useb https://raw.githubusercontent.com/DragosKissLove/testbot/main/install_spicetify_auto.ps1 | iex"
        ], shell=True)
        tfy_notify("🎵 Spotify Modded", "✔️ Spicetify + Marketplace instalate cu succes!")
    except Exception as e:
        tfy_notify("❌ Spotify Modded", f"Eroare la instalare:\n{e}")


import threading

def check_for_updates():
    import requests
    import subprocess
    import tempfile
    import os
    from tkinter import messagebox, Toplevel, Label
    from pathlib import Path

    current_version = "3.0.0"
    info_url = "https://raw.githubusercontent.com/DragosKissLove/testbot/main/tfy_info.json"

def download_and_launch(download_url, latest_version):
    try:
        from tkinter import messagebox
        import requests
        import subprocess
        import tempfile
        import os
        from pathlib import Path

        messagebox.showinfo(" Update", " Se descarcă update-ul... (apasa ok!)")

        temp_dir = Path(tempfile.gettempdir())
        exe_path = temp_dir / f"TFYTool_{latest_version}.exe"

        with open(exe_path, "wb") as f:
            f.write(requests.get(download_url).content)

        messagebox.showinfo(" Update complet", "✔️ Noua versiune a fost descărcată!\nTFY Tool se va relansa.")
        subprocess.Popen([str(exe_path)], shell=True)
        os._exit(0)
    except Exception as e:
        messagebox.showerror("❌ Eroare", f"Update-ul a eșuat:\n{e}")


def check_for_updates():
    import requests
    import threading
    from tkinter import messagebox

    current_version = "3.0.0"
    info_url = "https://raw.githubusercontent.com/DragosKissLove/testbot/main/tfy_info.json"

    try:
        response = requests.get(info_url)
        if response.status_code != 200:
            messagebox.showerror("Update", "💀 N-am putut verifica versiunea online.")
            return

        data = response.json()
        latest_version = data["version"]
        changelog = data.get("changelog", "")
        download_url = data["download_url"]

        if latest_version > current_version:
            confirm = messagebox.askyesno(
                "🔔 Update disponibil!",
                f"🚀 TFY Tool {latest_version} este gata de descărcat!\n\n📜 Noutăți:\n{changelog}\n\nVrei să faci update acum?"
            )
            if confirm:
                threading.Thread(
                    target=download_and_launch,
                    args=(download_url, latest_version),
                    daemon=True
                ).start()
        else:
            messagebox.showinfo("👌 Ești la zi", "📦 Ai deja cea mai recentă versiune de TFY Tool.")
    except Exception as e:
        messagebox.showerror("Eroare update", str(e))



from plyer import notification

def tfy_notify(title: str, message: str, timeout: int = 5):
    try:
        notification.notify(
            title=title,
            message=message,
            app_name="TFY Tool",
            timeout=timeout  # secunde
        )
    except Exception as e:
        print(f"[Notificare eșuată] {e}")
