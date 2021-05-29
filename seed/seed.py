import json
import os
import signal
import subprocess
import tempfile

import requests
from websocket import create_connection

# Which localhost port should Chrome's remote debugging protocol listen on temporarily?
REMOTE_DEBUGGING_PORT = 9222


def start_chrome(tmpdir):
    chrome_args = [
        "chromium-browser",
        "https://www.myedenred.fr/connexion",
        "--incognito",
        f"""--user-data-dir="{tmpdir}" """,
        f"--remote-debugging-port={REMOTE_DEBUGGING_PORT}",
    ]

    p = subprocess.Popen(" ".join(chrome_args),
                         shell=True,
                         stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL)

    input("Login to edenred and hit enter when done.")

    return p


def get_debugger_url():
    response = requests.get(f"http://localhost:{REMOTE_DEBUGGING_PORT}/json")
    websocket_url = response.json()[0].get("webSocketDebuggerUrl")
    return websocket_url


def dump_cookies(ws_url):
    ws = create_connection(ws_url)
    ws.send(json.dumps({"id": 1, "method": "Network.getAllCookies"}))
    result = ws.recv()
    ws.close()

    # Parse out the actual cookie object from the debugging protocol object.
    response = json.loads(result)
    cookies = response["result"]["cookies"]

    with open("cookies", "w") as f:
        json.dump(cookies, f)

    print("Cookies written to file 'cookies'")


if __name__ == '__main__':
    with tempfile.TemporaryDirectory() as tmpdirname:
        process = start_chrome(tmpdirname)
        url = get_debugger_url()
        dump_cookies(url)
        os.kill(process.pid, signal.SIGTERM)
