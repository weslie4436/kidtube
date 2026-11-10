# KidTube

小孩的白名單門面。不是 `F:\MyTube`（那個是研究片出口，不要把這裡的需求寫進去）。

## 這扇門怎麼工作

- 網頁只列出放行的頻道，外加選用的播放清單。搜尋、頻道、側欄都不離開這份清單。
- 一個頻道放行一次。新片由 `tools/refresh_catalog.py` 自己補進 `catalog.json`，不用逐支加。
- 每個頻道目前帶最近約 100 部（讀不到頁面時改走公開訂閱源，最多 15 部）。更舊的片子不會一次全部出現。
- 點影片開 `https://www.youtube.com/watch?v=…&list=…`，`list` 是該頻道的上傳清單，下一支沿著這個頻道走。iPad 要先在 YouTube App（和 Safari）登入有 Premium 的帳號，廣告才不會出現。
- 不收集 Google 密碼。不嵌 YouTube 播放器。不抓影片串流，不用 Invidious／Piped。
- 頻道網址寫在 `channels.json`。少數單支才用 `playlist.json` 的不公開播放清單。空結果不准覆蓋舊的 `catalog.json`。

## 交付

- 帳號 `weslie4436`。門面 https://weslie4436.github.io/kidtube/ ，`main` 根目錄。
- 改到門面檔：驗證後 commit + push `main`。禁止 PR。
- 畫面照 YouTube 深色版排，不套家裡照片牆那套殼。這是這個專案的特許。
