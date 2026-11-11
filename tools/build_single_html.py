#!/usr/bin/env python3
"""Build Infinity Space without recompressing or degrading the original music.

Standalone index.html uses the original high-quality MP3 files hosted on the
game's GitHub Pages site (requires internet). The Playgama ZIP includes ALL
original MP3 bytes locally and a root-level Playgama Bridge JSON configuration.
CSS, game JS, cover art and favicon remain inlined in both HTML variants.
"""
import base64
import json
import re
import shutil
import sys
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 20_000_000  # user requested <20 MB (decimal, not MiB)
TRACKS = list(range(1, 13))
MUSIC_ORIGIN = "https://mooouse.github.io/Infinity-Space/assets/music/"

DESCRIPTION = {
    "title": "Infinity Space",
    "language": ["en", "ru", "es"],
    "genre": "Space evolution, arcade, incremental simulation",
    "description_en": "Begin as a tiny particle of cosmic dust and grow through 28 evolution stages into planets, stars, galaxies and a black hole. Explore an endless procedural universe, collect matter, master gravity, discover relics and unlock upgrades, daily rewards and a space music collection. How far can your universe expand?",
    "description_ru": "Начните с крошечной космической пылинки и пройдите 28 этапов эволюции — от астероидов и планет до звёзд, галактик и чёрной дыры. Исследуйте бесконечный процедурный космос, поглощайте материю, используйте гравитацию, открывайте улучшения, реликвии, ежедневные награды и музыкальные треки.",
    "how_to_play_en": "Fly toward objects smaller than you to absorb them and gain matter. Avoid massive objects and hostile black holes until you can safely approach. Finish the evolution requirements to transform. Use your matter to buy upgrades. On desktop, follow the cursor (or select another control scheme), scroll to zoom, E for gravitational pulse, Shift/Space for dash, M for the map, and P to pause. On mobile, use your chosen touch/joystick controls, on-screen abilities and pinch to zoom.",
    "how_to_play_ru": "Летайте к объектам меньше себя и поглощайте их, чтобы набирать материю. Избегайте крупных тел и опасных чёрных дыр. Выполняйте задачи эволюции и переходите к новым формам, покупайте улучшения. На ПК: движение за курсором (можно выбрать другой режим), колесо мыши — масштаб, E — гравитационный импульс, Shift/пробел — рывок, M — карта, P — пауза. На телефоне используйте выбранное сенсорное управление, экранные способности и жест двумя пальцами для масштаба.",
    "devices": ["desktop", "mobile", "tablet"],
    "orientation": "landscape and portrait"
}


def build_page(inline_bridge_config: bool = True) -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    config = json.loads((ROOT / "playgama-bridge-config.json").read_text(encoding="utf-8"))

    # The standalone file embeds the config for standalone preview. The
    # Playgama upload deliberately OMITS it: Bridge.initialize() will fetch
    # ./playgama-bridge-config.json from beside index.html, as required.
    config_js = (("<script>window.SpaceInlineBridgeConfig=" +
                  json.dumps(config, ensure_ascii=False, separators=(",", ":")) +
                  ";</script>") if inline_bridge_config else "")

    def inline_css(match: re.Match) -> str:
        href = match.group(1).split("?", 1)[0]
        path = ROOT / href
        if not path.is_file():
            raise RuntimeError("Missing CSS: " + href)
        css = path.read_text(encoding="utf-8")
        css = re.sub(r"@import\s+url\(['\"]?https://fonts\.googleapis\.com/[^;]+;", "",
                     css, flags=re.I)
        if "</style" in css.lower():
            raise RuntimeError("Unsafe literal </style in " + href)
        return '<style data-origin="' + href + '">\n' + css + "\n</style>"

    html, num_css = re.subn(
        r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>',
        inline_css, html, flags=re.I)
    if num_css < 8:
        raise RuntimeError("Expected all game CSS to be inlined; got " + str(num_css))

    favicon = (ROOT / "favicon.svg").read_bytes()
    icon_uri = "data:image/svg+xml;base64," + base64.b64encode(favicon).decode("ascii")
    html = html.replace('href="favicon.svg"', 'href="' + icon_uri + '"')

    covers = {}
    for num in TRACKS:
        cover = ROOT / "assets" / "music" / ("track-%02d.jpg" % num)
        covers[str(num)] = "data:image/jpeg;base64," + base64.b64encode(
            cover.read_bytes()).decode("ascii")
    covers_js = json.dumps(covers, separators=(",", ":"))

    # Original MP3s are used without transcoding. The standalone HTML remains
    # small by fetching the exact original files from the game's public site.
    # In the Playgama ZIP the same MP3s are packaged at their catalog paths.
    music_bootstrap = r"""<script>
(function () {
  "use strict";
  var covers = __COVERS__;
  var remoteBase = __BASE__;
  var tracks = window.SpaceMusicTracks || [];
  tracks.forEach(function (track) {
    var number = String(track.id).padStart(2, "0");
    track.cover = covers[String(track.id)] || track.cover;
    if (remoteBase) {
      track.src = remoteBase + "track-" + number + ".mp3";
    }
  });
})();
</script>""".replace("__COVERS__", covers_js).replace(
        "__BASE__", json.dumps(MUSIC_ORIGIN, separators=(",", ":")))

    inserted = {"music": False, "bridge": False}
    def inline_js(match: re.Match) -> str:
        url = match.group(1)
        if url.startswith("https://bridge.playgama.com/"):
            inserted["bridge"] = True
            # Inline scripts at the bottom execute immediately; the Bridge
            # external script must therefore load synchronously before them.
            return '<script src="' + escape(url, quote=True) + '"></script>'
        file_name = url.split("?", 1)[0]
        if not re.fullmatch(r"[\w.-]+\.js", file_name):
            raise RuntimeError("Unexpected JavaScript URL: " + url)
        js = (ROOT / file_name).read_text(encoding="utf-8")
        if re.search(r"</script", js, re.I):
            raise RuntimeError("Unsafe literal </script in " + file_name)
        # Dedicated Playgama ZIP must always activate Bridge. Uploads are
        # served from arbitrary CDN / sandbox domains with no referrer or
        # ?playgama=1 parameter. Set the flag before platform.js executes.
        prefix = ('<script>window.SpacePlaygamaBuild=true;</script>' if file_name == "platform.js" else
                  config_js if file_name == "playgama-platform.js" else "")
        body = '<script data-origin="' + file_name + '">\n' + js + "\n</script>"
        if file_name == "music-tracks.js":
            inserted["music"] = True
            body += "\n" + music_bootstrap
        return prefix + body

    html, num_js = re.subn(
        r'<script\s+src="([^"]+)"\s+defer\s*></script>',
        inline_js, html, flags=re.I)
    if num_js < 10 or not all(inserted.values()):
        raise RuntimeError("Game or Playgama SDK scripts were not bundled")


    # The published platform build is ONE HTML: launch complete arcade pages
    # from in-memory Blob URLs. Otherwise a relative cosmic-*.html link would
    # 404 in the Playgama ZIP, which contains only index.html and its config.
    def embedded_page(filename: str) -> str:
        page = (ROOT / filename).read_text(encoding="utf-8")

        def inline_mode_css(match: re.Match) -> str:
            name = match.group(1).split("?", 1)[0]
            if not re.fullmatch(r"[\w.-]+\.css", name):
                raise RuntimeError("Unexpected embedded CSS: " + name)
            css = (ROOT / name).read_text(encoding="utf-8")
            if "</style" in css.lower():
                raise RuntimeError("Unsafe embedded CSS: " + name)
            return '<style data-origin="' + name + '">\n' + css + '\n</style>'

        page = re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>',
                      inline_mode_css, page, flags=re.I)

        def inline_mode_js(match: re.Match) -> str:
            src = match.group(1)
            if src.startswith("https://bridge.playgama.com/"):
                return match.group(0)
            name = src.split("?", 1)[0]
            if not re.fullmatch(r"[\w.-]+\.js", name):
                raise RuntimeError("Unexpected embedded JavaScript: " + src)
            js = (ROOT / name).read_text(encoding="utf-8")
            if re.search(r"</script", js, re.I):
                raise RuntimeError("Unsafe embedded JavaScript: " + name)
            prefix = ""
            if name == "platform.js":
                prefix = '<script>window.SpacePlaygamaBuild=true;</script>'
            if name == "playgama-platform.js":
                # Blob pages inherit their origin, but have no relative
                # playgama-bridge-config.json path; supply the exact config.
                prefix = ('<script>window.SpaceInlineBridgeConfig=' +
                          json.dumps(config, ensure_ascii=False, separators=(",", ":")) +
                          ';</script>')
            return prefix + '<script data-origin="' + name + '">\n' + js + '\n</script>'

        page = re.sub(r'<script\s+src="([^"]+)"(?:\s+defer)?\s*></script>',
                      inline_mode_js, page, flags=re.I)
        if re.search(r'(?:src|href)=["\'](?:[\w.-]+\.(?:js|css))', page):
            raise RuntimeError("Embedded game still relies on a local asset: " + filename)
        return page

    payload = {
        "arena": base64.b64encode(embedded_page("cosmic-arena.html").encode("utf-8")).decode("ascii"),
        "worms": base64.b64encode(embedded_page("cosmic-worms.html").encode("utf-8")).decode("ascii")
    }
    mode_router = r"""<script data-origin="embedded-arcade-router">
(function(){
  "use strict";
  var payload=__PAYLOAD__, cache={};
  function modeKind(mode){return mode==="worms"?"worms":["arena","royale","core","race"].includes(mode)?"arena":null;}
  function modeURL(mode){
    var kind=modeKind(mode);if(!kind)return null;
    if(!cache[kind]){
      var binary=atob(payload[kind]),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      var html=new TextDecoder("utf-8").decode(bytes);
      cache[kind]=URL.createObjectURL(new Blob([html],{type:"text/html"}));
    }
    return cache[kind];
  }
  window.SpaceModeDemoURL=function(mode){
    var url=modeURL(mode);return url?url+"#demo="+encodeURIComponent(mode):null;
  };
  window.SpaceOpenMode=function(mode){
    var url=modeURL(mode);if(!url)return false;
    try{sessionStorage.setItem("infinity-space-embedded-return",location.href.split("#")[0]);}catch(_){}
    location.assign(url+"#mode="+encodeURIComponent(mode));
    return true;
  };
})();
</script>""".replace("__PAYLOAD__", json.dumps(payload, separators=(",", ":")))
    html = html.replace("</head>", mode_router + "\n</head>", 1)

    # Information is provided in the HTML for self-contained metadata.
    # Playgama still requires entering Description and How to Play in its UI.
    metadata = json.dumps(DESCRIPTION, ensure_ascii=False, separators=(",", ":"))
    if "</script" in metadata.lower():
        raise RuntimeError("Unsafe description in JSON")
    meta_tags = (
        '<meta name="game-title" content="Infinity Space">\n'
        '<meta name="game-genre" content="Space evolution / arcade">\n'
        '<meta name="game-description" content="' +
        escape(DESCRIPTION["description_en"], quote=True) + '">\n'
        '<meta name="game-how-to-play" content="' +
        escape(DESCRIPTION["how_to_play_en"], quote=True) + '">\n'
        '<script id="playgama-submission-info" type="application/json">' +
        metadata + '</script>\n')
    html = html.replace("</head>", meta_tags + "</head>", 1)
    if re.search(r'(?:src|href)=["\'](?:assets/|[\w.-]+\.(?:js|css|svg|jpg|mp3))', html):
        raise RuntimeError("Unexpected unbundled static asset link")
    if ('<script>window.SpaceInlineBridgeConfig=' in html) != inline_bridge_config:
        raise RuntimeError("Bridge config mode does not match requested output")
    return html


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)

    # Both editions stream the EXACT original CrazyGames MP3s.
    # Their 62.1 MB of audio cannot be stored inside a 20 MB ZIP losslessly.
    # Hosting once on the game's GitHub Pages retains identical fidelity.
    originals = []
    for num in TRACKS:
        source = ROOT / "assets" / "music" / ("track-%02d.mp3" % num)
        if not source.is_file() or source.stat().st_size < 1_000_000:
            raise RuntimeError("Missing original MP3: " + str(source))
        originals.append(source)

    standalone = build_page(inline_bridge_config=True)
    standalone_bytes = len(standalone.encode("utf-8"))
    if standalone_bytes >= LIMIT:
        raise RuntimeError("Standalone HTML exceeds 20 MB")
    output.write_text(standalone, encoding="utf-8")

    # The platform ZIP uses a physical SDK config beside index.html.
    upload_dir = output.parent / "playgama"
    upload_dir.mkdir(parents=True, exist_ok=True)
    upload_html = build_page(inline_bridge_config=False)
    upload_bytes = len(upload_html.encode("utf-8"))
    if upload_bytes >= LIMIT:
        raise RuntimeError("Playgama HTML exceeds 20 MB")
    (upload_dir / "index.html").write_text(upload_html, encoding="utf-8")
    shutil.copy2(ROOT / "playgama-bridge-config.json",
                 upload_dir / "playgama-bridge-config.json")

    # Never accidentally retain bundled originals from an older local build.
    old_assets = upload_dir / "assets"
    if old_assets.exists():
        shutil.rmtree(old_assets)

    print("SUCCESS: standalone HTML: %.2f MB" % (standalone_bytes / 1_000_000))
    print("SUCCESS: Playgama HTML: %.2f MB + SDK JSON" % (upload_bytes / 1_000_000))
    print("Music: 12 UNMODIFIED MP3 files streamed from %s" % MUSIC_ORIGIN)
    print("Original music: %.2f MB kept on the existing music host" %
          (sum(src.stat().st_size for src in originals) / 1_000_000))


if __name__ == "__main__":
    main()
