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
  if (raw.startsWith("/channel/")) return { name: "channel", id: raw.slice("/channel/".length) };
  if (raw.startsWith("/results/")) return { name: "results", q: raw.slice("/results/".length) };
  if (raw === "/channels") return { name: "channels" };
  return { name: "home" };
}

function videos() {
  return Array.isArray(catalog.videos) ? catalog.videos : [];
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

function watchUrl(video) {
  const url = new URL("https://www.youtube.com/watch");
  url.searchParams.set("v", video.id);
  if (catalog.playlistId) {
    url.searchParams.set("list", catalog.playlistId);
    if (video.index) url.searchParams.set("index", String(video.index));
  }
  return url.toString();
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

function renderCard(video) {
  const card = document.createElement("article");
  card.className = "card";
  const thumb = link(watchUrl(video), "thumb");
  const image = document.createElement("img");
  image.alt = "";
  image.src = video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
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
  const title = link(watchUrl(video), "title", video.title);
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

function renderGrid(list) {
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const video of list) grid.append(renderCard(video));
  return grid;
}

function empty(message) {
  const node = document.createElement("p");
  node.className = "empty";
  node.textContent = message;
  return node;
}

function render() {
  const route = parseRoute();
  renderGuide(route);
  renderTabs(route);
  main.replaceChildren();
  const all = videos();

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
  if (route.name === "channel") {
    list = all.filter((video) => (video.channelId || video.channel) === route.id);
  } else if (route.name === "results") {
    const q = route.q.trim().toLowerCase();
    list = all.filter((video) => `${video.title} ${video.channel}`.toLowerCase().includes(q));
    queryInput.value = route.q;
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
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const q = queryInput.value.trim();
  location.hash = q ? "#/results/" + encodeURIComponent(q) : "#/";
  document.body.classList.remove("search-open");
});
window.addEventListener("hashchange", render);

fetch("catalog.json", { cache: "no-cache" })
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
