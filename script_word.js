const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVJwzRWaESO46JPqKSY0Ea6hIenazqJk4jMQqLxLb_SPk1mhHvOIxscPykKNLhrVDvUj2R4oEIlwOx/pub?gid=0&single=true&output=csv";

async function loadWords() {
    try {
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        
        // 檢查是否有抓到東西
        console.log("原始資料:", csvText);

        // 分割行，並過濾掉空行
        const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        const container = document.getElementById('word-container');
        
        if (!container) return; // 確保 HTML 裡有這個 ID
        container.innerHTML = ''; 

        // 從第二行 (i=1) 開始抓
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            // 確保這行至少有四個欄位
            if (cols.length >= 4) {
                const [category, japanese, romaji, chinese] = cols;
                
                const card = `
                    <div class="word-card">
                        <span class="tag">${category.trim()}</span>
                        <h3>${japanese.trim()}</h3>
                        <p class="romaji">${romaji.trim()}</p>
                        <p class="chinese">${chinese.trim()}</p>
                    </div>
                `;
                container.innerHTML += card;
            }
        }
    } catch (error) {
        console.error('抓取失敗，原因：', error);
    }
}

loadWords();