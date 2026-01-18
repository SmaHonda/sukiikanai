    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVJwzRWaESO46JPqKSY0Ea6hIenazqJk4jMQqLxLb_SPk1mhHvOIxscPykKNLhrVDvUj2R4oEIlwOx/pub?output=csv';
    let resortData = [];

    function init() {
        const cacheBuster = sheetUrl + "&t=" + new Date().getTime();
        Papa.parse(cacheBuster, {
            download: true,
            header: true,
            skipEmptyLines: true,
            transformHeader: h => h.trim().replace(/\uFEFF/g, ''),
            complete: function(results) {
                resortData = results.data;
                if (resortData && resortData.length > 0) {
                    console.log("Data loaded successfully"); // 只有按 F12 打開開發者工具才看得到
                    updateTicketSelectors();
                }
            }
        });
    }

    function formatTimeDisplay(totalMinutes) {
        if (!totalMinutes || totalMinutes <= 0) return "";
        const h = Math.floor(totalMinutes / 60);
        const m = Math.floor(totalMinutes % 60);
        return h > 0 ? `${h}小時${m}分鐘` : `${m}分鐘`;
    }

    function parseMinutes(timeStr) {
        if (!timeStr) return 0;
        let str = timeStr.toString().toLowerCase();
        let num = parseFloat(str.replace(/[^\d.]/g, '')) || 0;
        if (str.includes('h') && !str.includes('min')) return num * 60;
        return num;
    }

    function updateTicketSelectors() {
        const days = parseInt(document.getElementById('days').value);
        const container = document.getElementById('ticket-selectors-container');
        if (!container) return;
        const currentVals = Array.from(container.querySelectorAll('select')).map(s => s.value);
        container.innerHTML = '';
        for (let i = 1; i <= days; i++) {
            const val = currentVals[i-1] || 'daily'; 
            container.innerHTML += `
                <div class="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 mb-2">
                    <span class="text-xs font-bold text-slate-500">Day ${i} 票種</span>
                    <select class="ticket-select text-sm border-none bg-transparent focus:ring-0 text-slate-700" onchange="calculate()">
                        <option value="daily" ${val === 'daily' ? 'selected' : ''}>全日券</option>
                        <option value="hourly" ${val === 'hourly' ? 'selected' : ''}>小時券</option>
                        <option value="none" ${val === 'none' ? 'selected' : ''}>不買票</option>
                    </select>
                </div>
            `;
        }
        calculate();
    }

    function createLinkTagHtml(urlStr, labelPrefix, colorClasses) {
        if (!urlStr || urlStr.trim() === "") return "";
        const urls = urlStr.split(',').map(u => u.trim()).filter(u => u !== "");
        let html = `<div class="flex flex-wrap mt-2 pt-2 border-t border-slate-100">`;
        html += urls.map((url, index) => {
            const label = urls.length === 1 ? labelPrefix : `${labelPrefix}${index + 1}`;
            return `
                <a href="${url}" target="_blank" class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${colorClasses} border hover:opacity-75 transition-opacity mr-1.5 mb-1">
                    ${label}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            `;
        }).join('');
        html += `</div>`;
        return html;
    }

    function setVal(id, value, btnElement) {
        document.getElementById(id).value = value;
        const buttons = btnElement.parentElement.querySelectorAll('.btn-toggle');
        buttons.forEach(btn => btn.classList.remove('active-btn'));
        btnElement.classList.add('active-btn');
        if (id === 'days') updateTicketSelectors(); 
        else calculate();
    }

    function setHardware(value, btnElement) {
        document.getElementById('hardwareRental').value = value;
        const buttons = document.querySelectorAll('#hardware-group .btn-toggle');
        buttons.forEach(btn => btn.classList.remove('active-btn'));
        btnElement.classList.add('active-btn');
        const wearYesBtn = document.getElementById('wear-yes');
        const wearNoBtn = document.getElementById('wear-no');
        const wearInput = document.getElementById('wearRental');
        
        if (value === 'full') {
            wearInput.value = 'yes';
            updateWearUI('yes');
            [wearYesBtn, wearNoBtn].forEach(btn => { 
                btn.classList.add('disabled-btn'); 
                btn.disabled = true; 
            });
        } else {
            [wearYesBtn, wearNoBtn].forEach(btn => { 
                btn.classList.remove('disabled-btn'); 
                btn.disabled = false; 
            });
            wearInput.value = 'no';
            updateWearUI('no');
        }
        calculate();
    }

    function setWear(value, btnElement) {
        document.getElementById('wearRental').value = value;
        updateWearUI(value);
        calculate();
    }

    function updateWearUI(value) {
        const buttons = document.querySelectorAll('#wear-group .btn-toggle');
        buttons.forEach(btn => {
            const btnVal = btn.id === 'wear-yes' ? 'yes' : 'no';
            if (btnVal === value) btn.classList.add('active-btn');
            else btn.classList.remove('active-btn');
        });
    }

    function calculate() {
        const days = parseInt(document.getElementById('days').value);
        const hardware = document.getElementById('hardwareRental').value;
        const wear = document.getElementById('wearRental').value;
        const dailyTicketTypes = Array.from(document.querySelectorAll('.ticket-select')).map(s => s.value);
        const container = document.getElementById('card-container');
        if (!container) return;
        container.innerHTML = ''; 
        if (resortData.length === 0) return;

        const cleanNum = (val) => {
            if (!val) return 0;
            let cleaned = val.toString().replace(/[^\d.]/g, '');
            return parseFloat(cleaned) || 0;
        };

        let calculatedResults = resortData.map((resort, index) => {
            if (!resort.name || resort.name.trim() === "") return null;

            let liftTotal = 0;
            const liftDetails = dailyTicketTypes.map((type, i) => {
                let price = (type === 'daily') ? cleanNum(resort.lift) : (type === 'hourly') ? cleanNum(resort.hourly_price) : 0;
                let label = (type === 'daily') ? "全日券" : (type === 'hourly') ? (resort.hourly_title || "小時券") : "不買票";
                liftTotal += price;
                return { day: i + 1, label, price };
            });

            const pFull = cleanNum(resort.rental_full), 
                  pSkiSet = cleanNum(resort.rental_ski_set), 
                  pSkiPole = cleanNum(resort.rental_ski_pole), 
                  pBoardSet = cleanNum(resort.rental_board_set), 
                  pWear = cleanNum(resort.rental_wear);
            
            let hTotal = 0, wTotal = 0, hName = "不租裝備", isAutoUpgraded = false;
            let hUnitPrice = 0, wUnitPrice = 0;

            if (hardware === 'ski_set') { hName = "Ski套裝"; hUnitPrice = pSkiSet; }
            else if (hardware === 'ski_pole') { hName = "Ski三件組"; hUnitPrice = pSkiPole; }
            else if (hardware === 'board_set') { hName = "SB套裝"; hUnitPrice = pBoardSet; }

            if (hardware === 'full') {
                hUnitPrice = pFull; hTotal = hUnitPrice * days; hName = "全套 (含衣褲)"; wTotal = 0;
            } else if (wear === 'yes' && hardware !== 'none' && (hUnitPrice + pWear) >= pFull && pFull > 0) {
                hUnitPrice = pFull; hTotal = hUnitPrice * days; hName = "組合優惠價 (含衣褲)"; wTotal = 0; isAutoUpgraded = true;
            } else {
                hTotal = hUnitPrice * days; wUnitPrice = (wear === 'yes') ? pWear : 0; wTotal = wUnitPrice * days;
            }

            const t1_min = parseMinutes(resort.trans_step1_time);
            const t2_min = parseMinutes(resort.trans_step2_time);
            const t1_time_str = formatTimeDisplay(t1_min);
            const t2_time_str = formatTimeDisplay(t2_min);
            const total_time_str = formatTimeDisplay(t1_min + t2_min) || "無數據";

            const t1_name = resort.trans_step1_name || "主要交通", t1_single = cleanNum(resort.trans_step1_price), t1_return = t1_single * 2;
            const t2_name = resort.trans_step2_name || "接駁交通", t2_single = cleanNum(resort.trans_step2_price), t2_return = t2_single * 2;
            const transTotal = t1_return + t2_return;
            
            const stayUnitPrice = cleanNum(resort.stay_per_night), stayNights = days > 1 ? days - 1 : 0, stayTotal = stayUnitPrice * stayNights;
            const total = liftTotal + hTotal + wTotal + transTotal + stayTotal;

            return { 
                ...resort, liftTotal, liftDetails, hTotal, wTotal, hName, hUnitPrice, wUnitPrice, transTotal, stayTotal, stayUnitPrice, stayNights, total, wear, isAutoUpgraded, days,
                t1_name, t1_single, t1_return, t1_time_str, t2_name, t2_single, t2_return, t2_time_str, total_time_str
            };
        }).filter(item => item !== null);

        calculatedResults.sort((a, b) => a.total - b.total);

        calculatedResults.forEach((resort, index) => {
            const isCheapest = (index === 0);
            const liftRowsHtml = resort.liftDetails.map(d => `<div class="flex justify-between text-[11px] text-slate-500"><span>• Day ${d.day}: ${d.label}</span><span>¥${d.price.toLocaleString()}</span></div>`).join('');
            const wearHtml = (resort.hardware === 'full' || resort.isAutoUpgraded) ? '' : `<div class="flex flex-col border-t border-slate-200 mt-1 pt-1 last:border-0"><span class="font-medium text-slate-600">${resort.wear === 'yes' ? '雪衣雪褲' : '不租雪衣雪褲'}</span><span class="text-right font-mono text-slate-500 text-[11px]">¥${resort.wUnitPrice.toLocaleString()} x ${resort.days} = ¥${resort.wTotal.toLocaleString()}</span></div>`;
            const upgradeBadge = resort.isAutoUpgraded ? '<span class="text-[10px] bg-slate-200 text-slate-600 px-1 rounded ml-1 font-bold">組合優惠</span>' : '';

            let finalMapUrl = resort.map_url?.trim() || (resort.address?.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resort.address)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resort.name)}`);

            container.innerHTML += `
                <div class="${isCheapest ? 'bg-white p-6 rounded-xl shadow-xl border-4 border-yellow-400 ring-4 ring-yellow-100 transform scale-105 z-10' : 'bg-white p-6 rounded-xl shadow-sm border border-slate-200'} h-full flex flex-col transition-all duration-300">
                    ${isCheapest ? '<div class="bg-yellow-400 text-white text-xs px-3 py-1 rounded-full font-bold inline-block mb-2 animate-bounce w-fit">🥇 預算首選</div>' : ''}
                    
                    <div class="flex justify-between items-start mb-1">
                        <h2 class="text-2xl font-bold text-slate-800">${resort.name}</h2>
                        <a href="${finalMapUrl}" target="_blank" class="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-colors" title="開啟地圖">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </a>
                    </div>
                    
                    <p class="text-[10px] text-slate-400 truncate w-full mb-2">${resort.address || "點擊右側圖標查看地點"}</p>
                    
                    <div class="space-y-1 mb-2">
                        <div class="flex items-center text-xs text-slate-600">
                            <span class="font-bold mr-2">⛷️ 雪道數量：</span>
                            <span>${resort.course_count || "未知"}</span>
                            ${resort.link_map ? `<a href="${resort.link_map}" target="_blank" class="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-500 border border-blue-100 rounded text-[9px] hover:bg-blue-100 transition-colors">查看地圖</a>` : ''}
                        </div>
                        <div class="flex items-start text-xs text-slate-600">
                            <span class="font-bold mr-2 shrink-0">✨ 雪場特色：</span>
                            <span class="leading-relaxed text-slate-500">${resort.features || "暫無描述"}</span>
                        </div>
                    </div>

                    <p class="text-sm text-gray-500 mb-4">🕒 單程總耗時：<span class="font-bold text-slate-800">${resort.total_time_str}</span></p>
                    
                    <div class="space-y-4 border-t pt-4 text-sm flex-grow">
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="flex justify-between font-bold text-slate-700 mb-2"><span>雪票總計</span><span>¥${resort.liftTotal.toLocaleString()}</span></div>
                            <div class="space-y-1">${liftRowsHtml}</div>
                            ${createLinkTagHtml(resort.link_ticket, '官網', 'bg-blue-50 text-blue-600 border-blue-100')}
                        </div>

                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="flex justify-between font-bold text-slate-700 mb-2"><span>租借總計</span><span>¥${(resort.hTotal + resort.wTotal).toLocaleString()}</span></div>
                            <div class="space-y-1 text-[11px] text-slate-500">
                                <div class="flex flex-col border-b border-slate-200 pb-1 last:border-0"><span class="font-medium text-slate-600">${resort.hName}${upgradeBadge}</span><span class="text-right font-mono">¥${resort.hUnitPrice.toLocaleString()} x ${resort.days} = ¥${resort.hTotal.toLocaleString()}</span></div>
                                ${wearHtml}
                            </div>
                            ${createLinkTagHtml(resort.link_rental, '預約', 'bg-emerald-50 text-emerald-600 border-emerald-100')}
                        </div>

                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="flex justify-between font-bold text-slate-700 mb-2"><span>往返交通總計</span><span>¥${resort.transTotal.toLocaleString()}</span></div>
                            <div class="space-y-1 text-[11px] text-slate-500">
                                <div class="flex flex-col border-b border-slate-200 pb-1 last:border-0">
                                    <span class="font-medium text-slate-600">${resort.t1_name}</span>
                                    <span class="text-slate-400 text-[10px] font-normal leading-relaxed">${resort.t1_time_str ? '⏱️ 約 ' + resort.t1_time_str : ''}</span>
                                    <span class="text-right font-mono">¥${resort.t1_single.toLocaleString()} x 2 = ¥${resort.t1_return.toLocaleString()}</span>
                                </div>
                                <div class="flex flex-col border-b border-slate-200 pb-1 last:border-0 mt-1">
                                    <span class="font-medium text-slate-600">${resort.t2_name}</span>
                                    <span class="text-slate-400 text-[10px] font-normal leading-relaxed">${resort.t2_time_str ? '⏱️ 約 ' + resort.t2_time_str : ''}</span>
                                    <span class="text-right font-mono">¥${resort.t2_single.toLocaleString()} x 2 = ¥${resort.t2_return.toLocaleString()}</span>
                                </div>
                            </div>
                            ${createLinkTagHtml(resort.link_trans, '時刻表', 'bg-purple-50 text-purple-600 border-purple-100')}
                        </div>

                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="flex justify-between font-bold text-slate-700 mb-2"><span>住宿總計</span><span>¥${resort.stayTotal.toLocaleString()}</span></div>
                            <div class="space-y-1 text-[11px] text-slate-500">
                                <div class="flex flex-col"><span class="font-medium text-slate-600">預計住宿 (${resort.stayNights} 晚)</span><span class="text-right font-mono">¥${resort.stayUnitPrice.toLocaleString()} x ${resort.stayNights} = ¥${resort.stayTotal.toLocaleString()}</span></div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between text-xl font-black ${isCheapest ? 'text-orange-600' : 'text-slate-800'} pt-3 mt-auto">
                        <span>總計預算</span><span>¥${resort.total.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
    }

    init();