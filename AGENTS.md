# KidTube

小孩的白名單門面。不是 `F:\MyTube`（那個是研究片出口，不要把這裡的需求寫進去）。

## 這扇門怎麼工作

- 網頁只列出放行的頻道，外加選用的播放清單。搜尋、頻道、側欄都不離開這份清單。
- 一個頻道放行一次。新片由 `tools/refresh_catalog.py` 自己補進 `catalog.json`，不用逐支加。
- 每個頻道目前帶最近約 100 部（讀不到頁面時改走公開訂閱源，最多 15 部）。更舊的片子不會一次全部出現。
- 點影片留在本站 `#/watch/…`，用 YouTube 嵌入播放器播。右邊「下一部」只列白名單。播完自動接下一部白名單，不打開 `youtube.com/watch` 的推薦欄。
- 嵌入播放器常常吃不到 Premium，廣告可能出現。不收集 Google 密碼。不抓影片串流，不用 Invidious／Piped。
- 播放器裡 YouTube 自己的標誌仍可能點出去，那是播放器內建的，頁面右邊沒有推薦欄。
- 頻道網址寫在 `channels.json`。少數單支才用 `playlist.json` 的不公開播放清單。空結果不准覆蓋舊的 `catalog.json`。

## 交付

- 帳號 `weslie4436`。門面 https://weslie4436.github.io/kidtube/ ，`main` 根目錄。
- 改到門面檔：驗證後 commit + push `main`。禁止 PR。
- 畫面照 YouTube 深色版排，不套家裡照片牆那套殼。這是這個專案的特許。
