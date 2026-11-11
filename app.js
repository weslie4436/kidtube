const HOME = "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z";
const SUBS = "M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z";

const guide = document.querySelector("#guide");
const main = document.querySelector("#main");
const tabs = document.querySelector("#tabs");
const searchForm = document.querySelector("#search");
const queryInput = document.querySelector("#q");

let catalog = { playlistId: "", title: "", videos: [] };

function parseRoute() {
  const raw = decodeURIComponent((location.hash || "#/").replace(/^#/, ""));
  if (raw.startsWith("/watch/")) return { name: "watch", id: raw.slice("/watch/".length) };
  if (raw.startsWith("/channel/")) return { name: "channel", id: raw.slice("/channel/".length) };
  if (raw.startsWith("/results/")) return { name: "results", q: raw.slice("/results/".length) };
  if (raw === "/channels") return { name: "channels" };
  return { name: "home" };
}

function videos() {
  return Array.isArray(catalog.videos) ? catalog.videos : [];
}

function currentMix() {
  const key = "kidtube-mix";
  const maxAge = 3 * 60 * 60 * 1000;
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (error) { saved = null; }
  if (!saved || Date.now() - saved.at > maxAge) {
    saved = { seed: (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0, at: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(saved));
  }
  return saved;
}

function readSeen() {
  try { return JSON.parse(localStorage.getItem("kidtube-seen") || "{}"); } catch (error) { return {}; }
}

function writeSeen(seen) {
  localStorage.setItem("kidtube-seen", JSON.stringify(seen));
}

function unit(seed, id) {
  let hash = seed >>> 0;
  const text = String(id);
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

const FUN = new Set([
  "UCAOtE1V7Ots4DjM8JLlrYgg",
  "UCiWRSesvSYmY7YOyz0tv_zQ",
  "UCcdwLMPsaU2ezNSJU1nFoBQ",
  "UCnJEWsS5agXCkqIpyHC9Grg",
  "UCU-swpBLny7YEqNJB4hI1Kg",
  "UCgL6J6oL8F69vm-GcPScmwg",
  "UCWOA1ZGywLbqmigxE4Qlvuw",
  "UCOmHUn--16B90oW2L6FRR3A",
  "UCzgxx_DM2Dcb9Y1spb9mUJA",
  "UCMki_UkHb4qSc0qyEcOHHJw",
  "UCEpFoWeCMCo5z3EvWaz6hQQ",
  "UC1HHeTLXHMM5FiEyQpS1toA",
  "UCoDmztfkfbB3rtEa62BoUvw",
  "UCMUQVMHC9IlOnlSgSHNklIQ",
  "UC-lJnlie5xEBN9TdAJbp7Iw",
  "UCIFakjQ2JYvhfKjw14qiNxQ",
  "UCCPYSMEnbeepGM7RU6qxyUA",
  "UCgdwtyqBunlRb-i-7PnCssQ",
  "UCPt3IVJtf5TNwvLlm5ZPNSw",
  "UCAB7g-EUHjuaAliqShDOvNg",
  "UC31opT8RH0KAOTRPjyTJqQQ",
  "UCfCxw2gv4kmhcAPKU1Iu8dg",
  "UCX6OQ3DkcsbYNE6H8uQQuVA",
  "UC4-79UOlP48-QNGgCko5p2g",
  "UCIPPMRA040LQr5QPyJEbmXA",
  "UC-Fnix71vRP64WXeo0ikd0Q",
  "UCs-QBT4qkj_YiQw1ZntDO3g",
  "UC9GtSLeksfK4yuJ_g1lgQbg",
  "UCritGVo7pLJLUS8wEu32vow",
  "UCDhM2k2Cua-JdobAh5moMFg",
  "UCqwUnggBBct-AY2lAdI88jQ",
  "UCnUAyD4t2LkvW68YrDh7fDg",
  "UCk9GmdlDTBfgGRb7vXeRMoQ",
  "UCod5V2dpnpJLklGvVOv5FcQ",
  "UCXbRURMKT3H_w8dT-DWLIxA",
  "UC8whlOg70m2Yr3qSMjUhh0g",
  "UC2ff-9LhZKnDnw9XWHUOc_A",
  "UCJnL-TBcsYrF2SLs7tmiC8Q",
  "UCowiwt93gqGlNG4k5VDxO-w",
  "UCU3s8CYosQHpV0fRbqi15wA",
  "UCfbYNlxgLuKJXQZEhkMmaCQ",
  "UC7Q3HUnJA3nvjZR2JeMn2Cw",
  "UCJEER74X9kBenMT_x9iK9Mw",
  "UC-qYkzKFdekoEniRu_FS3zg",
  "UCijULR2sXLutCRBtW3_WEfA",
  "UCVXzBnzP5i5W-3snrxu8kfg",
  "UCPENYtHg4Xhmm6oX8zaQA7Q",
  "UCuhAUMLzJxlP1W7mEk0_6lA",
  "UC3y-P13TIRCXu7rF8928KGA",
  "UCVaIiqzfKQsi7Qw4-X8TmmA",
  "UCWFMjDuWKlct0jy89k2kkRA",
  "UCyc9sUCxELTDK9vELO5Fzeg",
  "UCaHwGJXFb28TekZMf7iFg5Q",
  "UCtKtCiaWRz-d3EZn2xd1mdA",
  "UCEIi7zFR_wE23jFncVtd6-A",
]);

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function readWatch() {
  const blank = { videos: {}, day: todayKey(), streak: 0 };
  let data = blank;
  try { data = Object.assign(blank, JSON.parse(localStorage.getItem("kidtube-watch") || "{}")); } catch (error) { data = blank; }
  if (!data.videos || typeof data.videos !== "object") data.videos = {};
  if (data.day !== todayKey()) {
    data.day = todayKey();
    data.streak = 0;
  }
  return data;
}

function writeWatch(data) {
  localStorage.setItem("kidtube-watch", JSON.stringify(data));
}

function isFun(video) {
  return FUN.has(video.channelId);
}

function entertainmentShare(streak) {
  const steps = 8;
  const drop = Math.min(Math.max(streak || 0, 0), steps) / steps;
  return 1 - drop * 0.5;
}

function notePlay(video) {
  const data = readWatch();
  const row = data.videos[video.id] || { plays: 0, seconds: 0 };
  row.plays += 1;
  data.videos[video.id] = row;
  data.streak = isFun(video) ? (data.streak || 0) + 1 : 0;
  writeWatch(data);
}

function addSeconds(id, seconds) {
  if (!id || !(seconds > 0)) return;
  const data = readWatch();
  const row = data.videos[id] || { plays: 0, seconds: 0 };
  row.seconds = Math.round((row.seconds || 0) + seconds);
  data.videos[id] = row;
  writeWatch(data);
}

function rankPool(list, mix, seen, watch) {
  const span = Math.max(list.length - 1, 1);
  const ranked = list.map((video, index) => {
    const memory = seen[video.id] || {};
    const stat = watch.videos[video.id] || {};
    const recency = 1 - index / span;
    const jitter = unit(mix.seed, video.id);
    let cool = 0;
    if (memory.seed && memory.seed !== mix.seed && (memory.rank || 0) < 8) cool += 0.5;
    if (memory.watched && memory.watched < mix.at && Date.now() - memory.watched < 12 * 60 * 60 * 1000) cool += 0.35;
    const plays = stat.plays || 0;
    const minutes = (stat.seconds || 0) / 60;
    cool += Math.min(0.6, plays * 0.08 + minutes * 0.02);
    return { video, score: recency * 0.58 + jitter * 0.42 - cool };
  });
  ranked.sort((a, b) => b.score - a.score || (a.video.index || 0) - (b.video.index || 0));
  return ranked.map((row) => row.video);
}

function blendFeeds(fun, rest, share) {
  const out = [];
  let funIndex = 0;
  let restIndex = 0;
  let funTaken = 0;
  const total = fun.length + rest.length;
  for (let n = 0; n < total; n += 1) {
    const preferFun = funIndex < fun.length && (restIndex >= rest.length || funTaken / (n + 1) < share);
    if (preferFun) {
      out.push(fun[funIndex]);
      funIndex += 1;
      funTaken += 1;
    } else {
      out.push(rest[restIndex]);
      restIndex += 1;
    }
  }
  return out;
}

function homeOrder(list) {
  const mix = currentMix();
  const seen = readSeen();
  const watch = readWatch();
  const fun = [];
  const rest = [];
  for (const video of list) (isFun(video) ? fun : rest).push(video);
  const ordered = blendFeeds(
    rankPool(fun, mix, seen, watch),
    rankPool(rest, mix, seen, watch),
    entertainmentShare(watch.streak || 0)
  );
  ordered.slice(0, 8).forEach((video, rank) => {
    seen[video.id] = Object.assign({}, seen[video.id], { seed: mix.seed, rank, shown: Date.now() });
  });
  writeSeen(seen);
  return ordered;
}

function noteWatched(video) {
  const seen = readSeen();
  seen[video.id] = Object.assign({}, seen[video.id], { watched: Date.now() });
  writeSeen(seen);
}

function foldText(value) {
  return (value || "").toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
}

function compactText(value) {
  return foldText(value).replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
}

function queryTokens(query) {
  return foldText(query).split(" ").filter(Boolean);
}

function escapeReg(token) {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenHit(text, token) {
  const hay = foldText(text);
  if (!token || !hay) return false;
  if (!/^[a-z0-9]+$/.test(token)) return hay.includes(token);
  const whole = new RegExp(`(^|[^a-z0-9])${escapeReg(token)}([^a-z0-9]|$)`);
  if (whole.test(hay)) return true;
  if (token.length >= 3) return new RegExp(`(^|[^a-z0-9])${escapeReg(token)}`).test(hay);
  return false;
}

function packedHit(text, query) {
  const packed = compactText(query);
  if (packed.length < 2) return false;
  const flat = compactText(text);
  return flat === packed || flat.startsWith(packed);
}

function textMatches(text, tokens, query) {
  if (!tokens.length) return false;
  if (tokens.every((token) => tokenHit(text, token))) return true;
  return packedHit(text, query);
}

function searchScore(video, tokens, query) {
  const title = foldText(video.title);
  const channel = foldText(video.channel);
  const folded = foldText(query);
  let score = 0;
  if (channel === folded || compactText(channel) === compactText(query)) score += 120;
  else if (tokens.every((token) => tokenHit(channel, token))) score += 70;
  if (title === folded) score += 90;
  else if (title.startsWith(folded)) score += 45;
  score += tokens.filter((token) => tokenHit(title, token)).length * 12;
  score -= (video.index || 0) * 0.01;
  return score;
}

function searchVideos(list, query) {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  return list
    .filter((video) => textMatches(`${video.title}\n${video.channel}`, tokens, query))
    .map((video) => ({ video, score: searchScore(video, tokens, query) }))
    .sort((a, b) => b.score - a.score || (a.video.index || 0) - (b.video.index || 0))
    .slice(0, 80)
    .map((row) => row.video);
}

function searchChannels(query) {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  return channels()
    .filter((channel) => textMatches(channel.name, tokens, query))
    .sort((a, b) => {
      const exactA = foldText(a.name) === foldText(query) ? 1 : 0;
      const exactB = foldText(b.name) === foldText(query) ? 1 : 0;
      return exactB - exactA || a.name.length - b.name.length;
    });
}

function channels() {
  const map = new Map();
  for (const video of videos()) {
    const id = video.channelId || video.channel || video.id;
    if (!map.has(id)) {
      map.set(id, { id, name: video.channel || "頻道", avatar: video.avatar || "", count: 0 });
    }
    const row = map.get(id);
    row.count += 1;
    if (!row.avatar && video.avatar) row.avatar = video.avatar;
    if (video.channel) row.name = video.channel;
  }
  return [...map.values()];
}

function pageHref(video) {
  return "#/watch/" + encodeURIComponent(video.id);
}

function upNext(video) {
  const sameKey = video.channelId || video.channel;
  const same = videos().filter((item) => (item.channelId || item.channel) === sameKey && item.id !== video.id);
  const after = same.filter((item) => (item.index || 0) > (video.index || 0));
  const before = same.filter((item) => (item.index || 0) <= (video.index || 0));
  const sameQueue = [...after, ...before];
  const buckets = new Map();
  for (const item of videos()) {
    const key = item.channelId || item.channel;
    if (key === sameKey || item.id === video.id) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }
  const keys = [...buckets.keys()];
  const mixed = [];
  let sameIndex = 0;
  let otherIndex = keys.length ? Math.floor(unit(1, video.id) * keys.length) : 0;
  while (mixed.length < 30 && (sameIndex < sameQueue.length || keys.some((key) => buckets.get(key).length))) {
    for (let count = 0; count < 2 && sameIndex < sameQueue.length && mixed.length < 30; count += 1) {
      mixed.push(sameQueue[sameIndex]);
      sameIndex += 1;
    }
    if (!keys.length || mixed.length >= 30) continue;
    let guard = 0;
    while (guard < keys.length) {
      const key = keys[otherIndex % keys.length];
      otherIndex += 1;
      guard += 1;
      const bucket = buckets.get(key);
      if (!bucket.length) continue;
      mixed.push(bucket.shift());
      break;
    }
  }
  return mixed;
}

let player = null;
let playerToken = 0;
let watchClock = null;
let notedWatchId = "";

function stopClock() {
  if (!watchClock) return;
  if (watchClock.playing) {
    const delta = (Date.now() - watchClock.tick) / 1000;
    if (delta > 0 && delta < 30) watchClock.pending += delta;
  }
  if (watchClock.timer) clearInterval(watchClock.timer);
  if (watchClock.pending > 0.4) addSeconds(watchClock.id, watchClock.pending);
  watchClock = null;
}

function markPlaying(playing) {
  if (!watchClock) return;
  if (watchClock.playing && !playing) {
    const delta = (Date.now() - watchClock.tick) / 1000;
    if (delta > 0 && delta < 30) watchClock.pending += delta;
  }
  watchClock.playing = playing;
  watchClock.tick = Date.now();
  if (watchClock.pending >= 2) {
    addSeconds(watchClock.id, watchClock.pending);
    watchClock.pending = 0;
  }
}

function startClock(videoId) {
  stopClock();
  watchClock = {
    id: videoId,
    playing: false,
    tick: Date.now(),
    pending: 0,
    timer: setInterval(() => {
      if (!watchClock || !watchClock.playing) return;
      const delta = (Date.now() - watchClock.tick) / 1000;
      watchClock.tick = Date.now();
      if (delta > 0 && delta < 5) watchClock.pending += delta;
      if (watchClock.pending >= 5) {
        addSeconds(watchClock.id, watchClock.pending);
        watchClock.pending = 0;
      }
    }, 1000),
  };
}

let playerWatch = null;
let ignoreHash = false;

function destroyPlayer() {
  stopClock();
  playerToken += 1;
  if (playerWatch) {
    window.removeEventListener("message", playerWatch);
    playerWatch = null;
  }
  player = null;
}

function embedSrc(videoId) {
  const query = new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    origin: location.origin,
    iv_load_policy: "3",
    fs: "1",
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${query}`;
}

function playerCommand(iframe, func, args) {
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify({
    event: "command",
    func,
    args: args || [],
    channel: "widget",
    id: "yt-player",
  }), "*");
}

function mountPlayer(video) {
  const token = ++playerToken;
  destroyPlayer();
  playerToken = token;
  const host = document.getElementById("yt-player");
  if (!host) return;
  const iframe = document.createElement("iframe");
  iframe.id = "yt-player";
  iframe.title = video.title || "播放";
  iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.src = embedSrc(video.id);
  host.replaceWith(iframe);
  startClock(video.id);
  const blocked = document.createElement("div");
  blocked.className = "yt-block yt-block-title";
  const logo = document.createElement("div");
  logo.className = "yt-block yt-block-logo";
  iframe.parentElement.append(blocked, logo);

  iframe.addEventListener("load", () => {
    if (token !== playerToken || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({
      event: "listening",
      id: "yt-player",
      channel: "widget",
    }), "*");
    playerCommand(iframe, "playVideo");
  });

  playerWatch = (event) => {
    if (token !== playerToken) return;
    const origin = event.origin || "";
    if (!/^https:\/\/([a-z0-9-]+\.)?(youtube\.com|youtube-nocookie\.com)$/.test(origin)) return;
    let data = event.data;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (error) { return; }
    }
    if (!data || typeof data !== "object") return;
    const info = data.info && typeof data.info === "object" ? data.info : null;
    const foreign = info && info.videoData && info.videoData.video_id;
    if (foreign && foreign !== video.id) {
      const allowed = videos().find((item) => item.id === foreign);
      const next = allowed || upNext(video)[0];
      if (next && next.id !== video.id) show(pageHref(next));
      return;
    }
    const state = data.event === "onStateChange" ? data.info : (info ? info.playerState : undefined);
    if (state === 1 || state === 2 || state === 0) markPlaying(state === 1);
    if (state !== 0) return;
    const next = upNext(video)[0];
    if (next) show(pageHref(next));
  };
  window.addEventListener("message", playerWatch);
}

function viewsLabel(video) {
  const views = (video.views || "").trim();
  if (!views) return "";
  return views.includes("觀看") ? views : `${views}次觀看`;
}

function whenLabel(video) {
  if (video.when) return video.when;
  if (!video.published) return "";
  const then = new Date(video.published).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  const units = [
    ["年", 31536000],
    ["個月", 2592000],
    ["週", 604800],
    ["天", 86400],
    ["小時", 3600],
    ["分鐘", 60],
  ];
  for (const [name, size] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)} ${name}前`;
  }
  return "剛剛";
}

function statLine(video) {
  return [viewsLabel(video), whenLabel(video)].filter(Boolean).join(" • ");
}

function svg(path) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("viewBox", "0 0 24 24");
  node.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("fill", "currentColor");
  shape.setAttribute("d", path);
  node.append(shape);
  return node;
}

function avatarNode(url, name, className) {
  if (url) {
    const img = document.createElement("img");
    img.className = className;
    img.alt = "";
    img.src = url;
    img.addEventListener("error", () => {
      img.replaceWith(letterNode(name, className));
    });
    return img;
  }
  return letterNode(name, className);
}

function letterNode(name, className) {
  const node = document.createElement("span");
  node.className = className.includes("card") ? "letter card-letter" : "letter";
  node.textContent = (name || "?").trim().charAt(0) || "?";
  return node;
}

function link(href, className, text) {
  const node = document.createElement("a");
  node.href = href;
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderGuide(route) {
  guide.replaceChildren();
  const home = link("#/", "guide-home" + (route.name === "home" ? " active" : ""));
  home.append(svg(HOME), Object.assign(document.createElement("span"), { textContent: "首頁" }));
  guide.append(home);
  const subs = link("#/channels", "guide-link" + (route.name === "channels" ? " active" : ""));
  subs.append(svg(SUBS), Object.assign(document.createElement("span"), { textContent: "訂閱內容" }));
  guide.append(subs);
  const list = channels();
  if (!list.length) return;
  const rule = document.createElement("hr");
  rule.className = "guide-rule";
  const label = document.createElement("div");
  label.className = "guide-label";
  label.textContent = "頻道";
  guide.append(rule, label);
  for (const channel of list) {
    const row = link("#/channel/" + encodeURIComponent(channel.id), "sub-link" + (route.name === "channel" && route.id === channel.id ? " active" : ""));
    row.append(avatarNode(channel.avatar, channel.name, "avatar"));
    const name = document.createElement("span");
    name.textContent = channel.name;
    row.append(name);
    guide.append(row);
  }
}

function renderTabs(route) {
  tabs.replaceChildren();
  const home = link("#/", route.name === "home" ? "active" : "");
  home.append(svg(HOME), document.createTextNode("首頁"));
  const subs = link("#/channels", route.name === "channels" || route.name === "channel" ? "active" : "");
  subs.append(svg(SUBS), document.createTextNode("頻道"));
  tabs.append(home, subs);
}

function renderChips(route) {
  const row = document.createElement("div");
  row.className = "chips";
  const all = link("#/", "chip" + (route.name === "home" ? " active" : ""), "全部");
  row.append(all);
  for (const channel of channels()) {
    const chip = link(
      "#/channel/" + encodeURIComponent(channel.id),
      "chip" + (route.name === "channel" && route.id === channel.id ? " active" : ""),
      channel.name
    );
    row.append(chip);
  }
  return row;
}

function posterUrl(id, sharp) {
  return `https://i.ytimg.com/vi/${id}/${sharp ? "hqdefault" : "mqdefault"}.jpg`;
}

function renderCard(video, eager) {
  const card = document.createElement("article");
  card.className = "card";
  const thumb = link(pageHref(video), "thumb");
  const image = document.createElement("img");
  image.alt = "";
  image.decoding = "async";
  image.loading = eager ? "eager" : "lazy";
  if (eager) image.fetchPriority = "high";
  image.src = posterUrl(video.id, !!eager);
  thumb.append(image);
  if (video.duration) {
    const time = document.createElement("span");
    time.className = "time";
    time.textContent = video.duration;
    thumb.append(time);
  }
  const meta = document.createElement("div");
  meta.className = "card-meta";
  const channelHref = "#/channel/" + encodeURIComponent(video.channelId || video.channel || video.id);
  const avatar = avatarNode(video.avatar, video.channel, "avatar card-avatar");
  if (avatar.tagName === "IMG" || avatar.tagName === "SPAN") {
    const avatarLink = link(channelHref, "avatar-link");
    avatarLink.append(avatar);
    meta.append(avatarLink);
  }
  const text = document.createElement("div");
  text.className = "card-text";
  const title = link(pageHref(video), "title", video.title);
  title.title = video.title;
  const by = link(channelHref, "by", video.channel || "");
  const stat = document.createElement("p");
  stat.className = "stat";
  stat.textContent = statLine(video);
  text.append(title, by);
  if (stat.textContent) text.append(stat);
  meta.append(text);
  card.append(thumb, meta);
  return card;
}

function renderChannelHit(channel) {
  const row = link("#/channel/" + encodeURIComponent(channel.id), "channel-hit");
  row.append(avatarNode(channel.avatar, channel.name, "avatar"));
  const text = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = channel.name;
  const stat = document.createElement("p");
  stat.className = "stat";
  stat.textContent = `${channel.count} 部影片`;
  text.append(title, stat);
  row.append(text);
  return row;
}

let feedWatch = null;

function stopFeed() {
  if (!feedWatch) return;
  feedWatch.disconnect();
  feedWatch = null;
}

function renderGrid(list) {
  stopFeed();
  const grid = document.createElement("div");
  grid.className = "grid";
  const first = Math.min(list.length, 8);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < first; i += 1) frag.append(renderCard(list[i], true));
  grid.append(frag);
  let shown = first;
  function more(count) {
    if (!grid.isConnected || shown >= list.length) return false;
    const end = Math.min(list.length, shown + count);
    const batch = document.createDocumentFragment();
    for (let i = shown; i < end; i += 1) batch.append(renderCard(list[i], false));
    grid.append(batch);
    shown = end;
    return shown < list.length;
  }
  const sentinel = document.createElement("div");
  sentinel.className = "feed-more";
  const wrap = document.createDocumentFragment();
  wrap.append(grid, sentinel);
  requestAnimationFrame(() => {
    if (!more(8)) return;
    feedWatch = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (!more(12) && feedWatch) feedWatch.disconnect();
    }, { rootMargin: "900px" });
    feedWatch.observe(sentinel);
  });
  return wrap;
}

function empty(message) {
  const node = document.createElement("p");
  node.className = "empty";
  node.textContent = message;
  return node;
}

function renderWatch(video) {
  const layout = document.createElement("div");
  layout.className = "watch";
  const primary = document.createElement("div");
  primary.className = "watch-main";
  const frame = document.createElement("div");
  frame.className = "frame";
  const host = document.createElement("div");
  host.id = "yt-player";
  frame.append(host);
  const heading = document.createElement("h1");
  heading.className = "watch-title";
  heading.textContent = video.title;
  const by = link("#/channel/" + encodeURIComponent(video.channelId || video.channel || video.id), "by", video.channel || "");
  const stat = document.createElement("p");
  stat.className = "stat";
  stat.textContent = statLine(video);
  primary.append(frame, heading, by);
  if (stat.textContent) primary.append(stat);

  const side = document.createElement("aside");
  side.className = "upnext";
  const label = document.createElement("h2");
  label.className = "upnext-label";
  label.textContent = "下一部";
  side.append(label);
  for (const item of upNext(video)) {
    const row = link(pageHref(item), "upnext-row");
    const image = document.createElement("img");
    image.alt = "";
    image.src = item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
    const copy = document.createElement("div");
    const itemTitle = document.createElement("p");
    itemTitle.className = "upnext-title";
    itemTitle.textContent = item.title;
    const channel = document.createElement("p");
    channel.className = "stat";
    channel.textContent = item.channel || "";
    copy.append(itemTitle, channel);
    row.append(image, copy);
    side.append(row);
  }
  layout.append(primary, side);
  main.append(layout);
  mountPlayer(video);
}

function render() {
  const route = parseRoute();
  stopFeed();
  destroyPlayer();
  renderGuide(route);
  renderTabs(route);
  main.replaceChildren();
  const all = videos();

  if (route.name === "watch") {
    const video = all.find((item) => item.id === route.id);
    if (!video) {
      main.append(empty("這部片不在清單裡"));
      return;
    }
    if (notedWatchId !== video.id) {
      notedWatchId = video.id;
      notePlay(video);
      noteWatched(video);
    }
    renderWatch(video);
    return;
  }
  notedWatchId = "";

  if (route.name === "channels") {
    const list = channels();
    if (!list.length) {
      main.append(empty("這份清單還沒有影片"));
      return;
    }
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const channel of list) {
      const card = document.createElement("article");
      card.className = "card";
      const row = link("#/channel/" + encodeURIComponent(channel.id), "card-meta");
      row.append(avatarNode(channel.avatar, channel.name, "avatar card-avatar"));
      const text = document.createElement("div");
      text.className = "card-text";
      const title = document.createElement("h3");
      title.className = "title";
      title.textContent = channel.name;
      const stat = document.createElement("p");
      stat.className = "stat";
      stat.textContent = `${channel.count} 部影片`;
      text.append(title, stat);
      row.append(text);
      card.append(row);
      grid.append(card);
    }
    main.append(grid);
    return;
  }

  let list = all;
  if (route.name === "home") list = homeOrder(all);
  else if (route.name === "channel") {
    list = all.filter((video) => (video.channelId || video.channel) === route.id);
  } else if (route.name === "results") {
    list = searchVideos(all, route.q);
    queryInput.value = route.q;
    for (const channel of searchChannels(route.q)) main.append(renderChannelHit(channel));
  }

  if (route.name !== "results") main.append(renderChips(route));
  if (!all.length) {
    main.append(empty("這份清單還沒有影片"));
    return;
  }
  if (!list.length) {
    main.append(empty(route.name === "results" ? "找不到符合的影片" : "這個頻道不在清單裡"));
    return;
  }
  main.append(renderGrid(list));
}

function reshuffleHome() {
  const saved = {
    seed: (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0,
    at: Date.now(),
  };
  sessionStorage.setItem("kidtube-mix", JSON.stringify(saved));
  document.body.classList.remove("guide-open", "search-open");
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "#") render();
  else location.hash = "#/";
  window.scrollTo(0, 0);
}

document.querySelector(".logo").addEventListener("click", (event) => {
  event.preventDefault();
  reshuffleHome();
});

document.querySelector("#nav-toggle").addEventListener("click", () => {
  document.body.classList.toggle("guide-open");
});
document.querySelector("#scrim").addEventListener("click", () => {
  document.body.classList.remove("guide-open");
});
guide.addEventListener("click", (event) => {
  if (event.target.closest("a")) document.body.classList.remove("guide-open");
});
document.querySelector("#search-toggle").addEventListener("click", () => {
  document.body.classList.add("search-open");
  queryInput.focus();
});
document.querySelector("#search-back").addEventListener("click", () => {
  document.body.classList.remove("search-open");
});
function goSearch() {
  const q = queryInput.value.trim();
  document.body.classList.remove("search-open");
  if (!q) {
    if ((location.hash || "#/") === "#/" || location.hash === "#") render();
    else location.hash = "#/";
    return;
  }
  const next = "#/results/" + encodeURIComponent(q);
  let same = false;
  try { same = decodeURIComponent((location.hash || "").replace(/^#/, "")) === "/results/" + q; } catch (error) { same = false; }
  if (same) render();
  else location.hash = next;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  goSearch();
});
function show(hash) {
  const next = hash || "#/";
  const current = location.hash || "#/";
  if (current !== next) {
    ignoreHash = true;
    location.hash = next;
    ignoreHash = false;
  }
  render();
  if (next.startsWith("#/watch/")) window.scrollTo(0, 0);
}

document.addEventListener("click", (event) => {
  const anchor = event.target.closest("a");
  if (!anchor || anchor.classList.contains("logo")) return;
  const href = anchor.getAttribute("href") || "";
  if (!href.startsWith("#")) return;
  event.preventDefault();
  show(href);
});

window.addEventListener("hashchange", () => {
  if (ignoreHash) return;
  render();
});

function fitHeight() {
  const vv = window.visualViewport;
  const height = Math.round((vv && vv.height) || window.innerHeight || 0);
  if (height > 0) document.documentElement.style.setProperty("--vvh", height + "px");
}

function pinViewport() {
  fitHeight();
  const standalone = window.navigator.standalone === true
    || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if (!standalone) return;
  const meta = document.querySelector('meta[name="viewport"]');
  const vv = window.visualViewport;
  const width = Math.round((vv && vv.width) || window.innerWidth || 0);
  if (!meta || !width) return;
  const next = "width=" + width + ", initial-scale=1, maximum-scale=1, viewport-fit=cover";
  if (meta.content !== next) meta.content = next;
}

document.addEventListener("gesturestart", (event) => event.preventDefault());
window.addEventListener("resize", fitHeight);
window.addEventListener("orientationchange", () => {
  pinViewport();
  requestAnimationFrame(pinViewport);
});
window.addEventListener("pageshow", pinViewport);
if (window.visualViewport) window.visualViewport.addEventListener("resize", pinViewport);
pinViewport();

fetch("catalog.json?v=5", { cache: "no-cache" })
  .then((res) => {
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  })
  .then((data) => {
    catalog = data || catalog;
    render();
  })
  .catch(() => {
    main.replaceChildren(empty("清單暫時讀不到"));
  });
