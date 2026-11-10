# KidTube

小孩的白名單門面。不是 `F:\MyTube`（那個是研究片出口，不要把這裡的需求寫進去）。

## 這扇門怎麼工作

- 網頁只列出放行的播放清單。搜尋、頻道、側欄都不離開這份清單。
- 點影片開 `https://www.youtube.com/watch?v=…&list=…`。iPad 要先在 YouTube App（和 Safari）登入有 Premium 的帳號，廣告才不會出現。
- 不收集 Google 密碼。不嵌 YouTube 播放器。不抓影片串流，不用 Invidious／Piped。
- 清單來源是 `playlist.json` 的 `playlistId`（不公開清單，不要用私人清單）。`tools/refresh_catalog.py` 寫入 `catalog.json`。
- 播放清單頁一次大約帶出前 100 部。讀不到時改走公開訂閱源，最多 15 部。空結果不准覆蓋舊的 `catalog.json`。

## 交付

- 帳號 `weslie4436`。門面 https://weslie4436.github.io/kidtube/ ，`main` 根目錄。
- 改到門面檔：驗證後 commit + push `main`。禁止 PR。
- 畫面照 YouTube 深色版排，不套家裡照片牆那套殼。這是這個專案的特許。
