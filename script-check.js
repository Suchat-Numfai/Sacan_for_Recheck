// ==========================================
// 1. GLOBAL STATES (ตัวแปรสถานะส่วนกลาง)
// ==========================================
let checkItems = [];        // รายการจากไฟล์ต้นฉบับ
let checkErrors = [];       // รายการที่แสกนแล้วไม่พบในไฟล์
let checkDuplicates = [];   // รายการที่แสกนซ้ำ
let checkScannedSet = new Set();
let selectedBankCheck = 'ธนาคารออมสิน';
let currentFileCheck = '';
let validCount = 0;         
let errorCount = 0;         
let duplicateCount = 0;     // จำนวนที่ซ้ำ
let totalScanCount = 0;     // ยอดรวมแสกนทั้งหมด
let totalErrorCount = 0;    

// ==========================================
// 2. INITIALIZATION & UI RENDER (ปรับปรุง CSS & Dashboard)
// ==========================================
document.getElementById('checkPage').innerHTML = `
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999; }
        .modal-content { background: white; padding: 40px; border-radius: 24px; text-align: center; width: 380px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modalScale 0.2s ease-out; }
        .modal-icon { font-size: 60px; margin-bottom: 20px; display: block; }
        .modal-title { font-size: 26px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .modal-text { color: #64748b; font-size: 17px; margin-bottom: 30px; line-height: 1.5; }
        .modal-footer { display: flex; gap: 10px; }
        .modal-btn { flex: 1; border: none; padding: 14px 0; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .btn-dark { background: #333; color: white; }
        .btn-light { background: #f1f5f9; color: #475569; }
        .detail-overlay { position: absolute; top: 0; left: 0; background: white; z-index: 1001; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); padding: 15px; animation: slideInDown 0.2s ease-out; max-height: 500px; display: flex; flex-direction: column; border: 1px solid #e2e8f0; }
        .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .btn-close-red { background: #ef4444; color: white; border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 11px; font-weight: bold; }
        .detail-list { overflow-y: auto; flex-grow: 1; padding-right: 5px; }
        .detail-box { background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #3b82f6; padding: 10px; margin-bottom: 8px; border-radius: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; }
        .status-ok { color: #10b981; font-weight: bold; font-size: 14px; }
        .hidden { display: none !important; }
        .box { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: left; }
        .input-order { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; outline: none; font-size: 14px; box-sizing: border-box; text-align: left; }
        .btn-action { width: 100%; background: #3b82f6; color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s; text-align: center; }
        .btn-action:hover { background: #2563eb; }

        /* ปรับปรุงสไตล์ Card */
        .card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; cursor: pointer; }
        .card-val { font-size: 28px; font-weight: 800; margin-top: 5px; }
        .card-blue   { border-bottom: 4px solid #3b82f6; color: #1e40af; }
        .card-green  { border-bottom: 4px solid #10b981; color: #065f46; }
        .card-amber  { border-bottom: 4px solid #f59e0b; color: #92400e; }
        .card-red    { border-bottom: 4px solid #ef4444; color: #991b1b; }
        .card-purple { border-bottom: 4px solid #a855f7; color: #6b21a8; background: #faf5ff; }
        .card-dark   { border-bottom: 4px solid #64748b; color: #1e293b; background: #f8fafc; cursor: default; }

        /* CSS สำหรับการกะพริบข้อมูลซ้ำ */
        @keyframes blink-purple {
            0% { background-color: transparent; }
            50% { background-color: #d8b4fe; box-shadow: inset 0 0 10px #a855f7; }
            100% { background-color: transparent; }
        }
        .row-blink { 
            animation: blink-purple 0.6s ease-in-out infinite; 
            border: 2px solid #a855f7 !important; 
            font-weight: bold; 
        }
    </style>

    <h1 class="page-header">ตรวจสอบงาน Scan QA</h1>
    <div class="dashboard" id="dashArea" style="position:relative !important; display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 20px;">
        <div class="card card-blue" onclick="toggleOfficeMenu(event, 'total')"><div>ยอดในไฟล์</div><div id="totalCount" class="card-val">0</div></div>
        <div class="card card-green" onclick="toggleOfficeMenu(event, 'scanned')"><div>แสกนพบแล้ว</div><div id="scannedCount" class="card-val">0</div></div>
        <div class="card card-amber" onclick="toggleOfficeMenu(event, 'pending')"><div>ยังไม่ได้แสกน</div><div id="pendingCount" class="card-val">0</div></div>
        <div class="card card-red" onclick="toggleOfficeMenu(event, 'error')"><div>ไม่มีข้อมูล</div><div id="errorCount" class="card-val">0</div></div>
        <div class="card card-purple" onclick="toggleOfficeMenu(event, 'duplicate')"><div>ข้อมูลซ้ำ</div><div id="duplicateCount" class="card-val">0</div></div>
        <div class="card card-dark"><div>Total Scan</div><div id="totalScanDisplay" class="card-val">0</div></div>

        <div id="officeMenu" class="detail-overlay hidden">
            <div class="detail-header">
                <b id="menuTitle" style="font-size:15px; line-height:1.2;">รายการทั้งหมด</b>
                <button onclick="closeOfficeMenu()" class="btn-close-red">ปิด [X]</button>
            </div>
            <div id="menuContent" class="detail-list"></div>
        </div>
    </div>

    <div class="content-grid" style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
        <div class="side-controls">
            <div class="box">
                <button onclick="confirmClearData()" style="display:block; margin: 0 0 15px 0; color:#ef4444; cursor:pointer; background:none; border:none; text-decoration:underline; font-size:12px;">ล้างผลการสแกน (เก็บไฟล์เดิม)</button>
                <b>1. นำเข้าข้อมูลงาน</b>
                <div id="importArea" style="margin-top:10px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">ธนาคาร / หน่วยงาน:</label>
                    <select id="bankSelect" class="input-order" onchange="toggleCustomBankInput(this)">
                        <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                        <option value="ธนาคาร ธ.ก.ส.">ธนาคาร ธ.ก.ส.</option>
                        <option value="ทิพยประกันภัย">ทิพยประกันภัย</option>
                        <option value="custom">-- เพิ่มชื่อเอง --</option>
                    </select>
                    <input type="text" id="customBankInput" class="hidden input-order" placeholder="ระบุชื่อหน่วยงาน...">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">ผู้ทำการตรวจสอบ:</label>
                    <select id="checkStaffList" class="input-order"><option value="">-- กรุณาเลือกรายชื่อ --</option></select>
                    <label style="font-size:12px; display:block; margin-bottom:5px;">เลือกไฟล์งาน (.txt):</label>
                    <input type="file" id="fileInput" accept=".txt" onchange="handleFileCheck(event)" style="margin-bottom:10px; font-size:11px; width:100%;">
                    <textarea id="rawText" class="input-order" rows="4" placeholder="วางข้อมูลที่นี่..."></textarea>
                    <button class="btn-action" onclick="importCheckData()">ล็อคข้อมูลเพื่อเริ่มแสกน</button>
                </div>
                <div id="fileDisplay" class="hidden" style="padding:15px; border:2px dashed #3b82f6; border-radius:12px; background:#eff6ff;">
                    <div style="margin-bottom: 5px;"><span style="font-size:12px; color:#64748b;">หน่วยงาน:</span><br><b id="displayBankName" style="color:#1e40af; font-size:15px;"></b></div>
                    <div style="margin-bottom: 5px;"><span style="font-size:12px; color:#64748b;">ชื่อไฟล์:</span><br><small id="loadedFileName" style="color:#64748b; font-weight:bold;"></small></div>
                    <div style="margin-bottom: 8px;"><span style="font-size:12px; color:#64748b;">ผู้ตรวจสอบ:</span><br><small id="displayStaffName" style="color:#3b82f6; font-size:14px; font-weight:bold;"></small></div>
                    <button onclick="confirmResetImport()" style="display:block; margin: 10px 0 0 0; font-size:11px; color:#ef4444; cursor:pointer; background:none; border:1px solid #fca5a5; border-radius:4px; padding:4px 10px;">ล้างข้อมูล/เปลี่ยนไฟล์ใหม่</button>
                </div>
            </div>
            <div class="box">
                <b>2. สแกนตรวจสอบ</b>
                <input type="text" id="scanInput" class="input-order" placeholder="สแกนที่นี่..." disabled autocomplete="off" style="margin-top:10px;">
                <div id="statusMsg" style="text-align:center; margin-top:15px; font-weight:bold; font-size:20px;"></div>
                <button onclick="downloadCheckCSV()" id="btnDownload" class="hidden" style="width:100%; margin-top:10px; padding:10px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Download Report</button>
            </div>
        </div>
        <div class="table-area">
            <div class="box">
                <div style="display:flex; justify-content:space-between;"><b>รายการตรวจสอบ</b><span id="listProgress" style="font-size:12px; color:#64748b;">รอรับข้อมูล...</span></div>
                <div style="max-height:500px; overflow-y:auto; margin-top:10px; border:1px solid #eee; border-radius:8px;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead style="background:#f1f5f9; position:sticky; top:0;">
                            <tr>
                                <th style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">ลำดับสแกน</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">ข้อมูลแสกน</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">ข้อมูลไฟล์</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">ลำดับไฟล์</th>
                                <th style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody id="checkTableBody"><tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">กรุณานำเข้าข้อมูลเพื่อเริ่มงาน</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div id="customModal" class="modal-overlay hidden">
        <div class="modal-content">
            <span id="mIcon" class="modal-icon">⚠️</span>
            <div id="mTitle" class="modal-title">แจ้งเตือน</div>
            <p id="mText" class="modal-text">ข้อความแจ้งเตือน</p>
            <div class="modal-footer">
                <button id="mCancelBtn" onclick="closeCustomModal()" class="modal-btn btn-light hidden">ยกเลิก</button>
                <button id="mConfirmBtn" class="modal-btn btn-dark">ตกลง (Enter)</button>
            </div>
        </div>
    </div>
`;

// ==========================================
// 3. DATA IMPORT & PREPARATION
// ==========================================
function refreshCheckStaffDropdown() {
    const dropdown = document.getElementById('checkStaffList');
    const staffData = JSON.parse(localStorage.getItem('qa_staff_list')) || [];
    dropdown.innerHTML = '<option value="">-- กรุณาเลือกรายชื่อ --</option>';
    staffData.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name; opt.text = s.name;
        dropdown.add(opt);
    });
}
refreshCheckStaffDropdown();

function handleFileCheck(e) {
    const file = e.target.files[0];
    if (!file) return;
    currentFileCheck = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('loadedFileName').innerText = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => { document.getElementById('rawText').value = ev.target.result; };
    reader.readAsText(file);
}

function importCheckData() {
    const raw = document.getElementById('rawText').value.trim();
    const staff = document.getElementById('checkStaffList').value;
    const bankSelect = document.getElementById('bankSelect');
    let bankName = bankSelect.value === 'custom' ? document.getElementById('customBankInput').value.trim() : bankSelect.value;

    if (!staff) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณาเลือกผู้ทำการตรวจสอบ", icon: "👤" });
    if (!raw) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณานำเข้าไฟล์ Text หรือวางข้อมูล", icon: "📄" });
    if (!bankName) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณาระบุหน่วยงาน", icon: "🏦" });

    selectedBankCheck = bankName;
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== "");
    checkItems = lines.map((v, i) => ({ val: v, originalIdx: i + 1, isScanned: false, scanOrder: null, type: 'FILE' }));
    
    document.getElementById('displayBankName').innerText = selectedBankCheck;
    document.getElementById('displayStaffName').innerText = "ผู้ตรวจสอบ: " + staff;
    document.getElementById('importArea').classList.add('hidden');
    document.getElementById('fileDisplay').classList.remove('hidden');
    document.getElementById('scanInput').disabled = false;
    document.getElementById('scanInput').focus();
    document.getElementById('btnDownload').classList.remove('hidden');
    updateCheckTable(); updateDashboard();
}

// ==========================================
// 4. SCANNING LOGIC (รวมการตรวจจับซ้ำและ Blink)
// ==========================================
document.getElementById('scanInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
            totalScanCount++; 
            
            if (checkScannedSet.has(val)) {
                duplicateCount++;
                // หาว่าข้อมูลนี้เคยแสกนไปแล้วที่ลำดับไหน
                // ตรวจทั้งในไฟล์ (checkItems) และนอกไฟล์ (checkErrors)
                const inFileList = checkItems.find(i => i.val === val && i.isScanned);
                const inErrorList = checkErrors.find(i => i.val === val);
                const originalOrder = inFileList ? inFileList.scanOrder : (inErrorList ? inErrorList.scanOrder : '?');
                
                checkDuplicates.push({ val: val, scanOrder: totalScanCount, type: 'DUPLICATE', duplicateWith: originalOrder });
                
                showModal({ 
                    title: "ข้อมูลซ้ำ!", 
                    text: `ลำดับที่ ${totalScanCount} ซ้ำกับลำดับที่ ${originalOrder}`,
                    icon: "⚠️"
                });
                document.getElementById('statusMsg').innerHTML = `<span style="color:#a855f7;">⚠️ ซ้ำกับลำดับ ${originalOrder}</span>`;
                
                // อัปเดตตารางก่อนเพื่อให้มีแถวใหม่ แล้วจึงสั่ง Blink
                updateCheckTable(); 
                setTimeout(() => blinkDuplicateRows(totalScanCount, originalOrder), 100);
            } else {
                checkScannedSet.add(val);
                const item = checkItems.find(i => i.val === val);
                
                if (item) {
                    validCount++; 
                    item.isScanned = true; 
                    item.scanOrder = totalScanCount; 
                    document.getElementById('statusMsg').innerHTML = '<span style="color:#10b981;">✅ ถูกต้อง</span>';
                } else {
                    errorCount++;
                    totalErrorCount++;
                    checkErrors.push({ 
                        val: val, 
                        errorOrder: totalErrorCount, 
                        scanOrder: totalScanCount, 
                        type: 'ERROR' 
                    });
                    document.getElementById('statusMsg').innerHTML = '<span style="color:#ef4444;">❌ ไม่พบข้อมูล</span>';
                }
                updateCheckTable();
            }
            updateDashboard();
        }
        e.target.value = '';
    }
});

function blinkDuplicateRows(currentOrder, originalOrder) {
    closeOfficeMenu();
    const rows = document.getElementById('checkTableBody').getElementsByTagName('tr');
    let foundRow = null;
    
    // ล้างสถานะ Blink เก่า
    for (let row of rows) row.classList.remove('row-blink');
    
    for (let row of rows) {
        const orderCell = row.cells[0].innerText;
        if (orderCell == currentOrder || orderCell == originalOrder) {
            row.classList.add('row-blink');
            if (orderCell == currentOrder) foundRow = row;
        }
    }
    
    if (foundRow) foundRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => { 
        for (let row of rows) row.classList.remove('row-blink'); 
    }, 5000);
}

// ==========================================
// 5. UI UPDATES & DASHBOARD
// ==========================================
function updateDashboard() {
    document.getElementById('totalCount').innerText = checkItems.length;
    document.getElementById('scannedCount').innerText = validCount;
    document.getElementById('pendingCount').innerText = checkItems.filter(i => !i.isScanned).length;
    document.getElementById('errorCount').innerText = errorCount;
    document.getElementById('duplicateCount').innerText = duplicateCount;
    document.getElementById('totalScanDisplay').innerText = totalScanCount;
    document.getElementById('listProgress').innerText = `ถูกต้อง: ${validCount} | ไม่พบ: ${errorCount} | ซ้ำ: ${duplicateCount}`;
}

function updateCheckTable() {
    const tbody = document.getElementById('checkTableBody');
    const scanned = checkItems.filter(i => i.isScanned);
    const errors = [...checkErrors];
    const duplicates = [...checkDuplicates];
    const pending = checkItems.filter(i => !i.isScanned);

    // รวมรายการที่สแกนแล้ว (ถูก, ผิด, ซ้ำ) เรียงลำดับจากใหม่ไปเก่า
    const allScanned = [...scanned, ...errors, ...duplicates].sort((a, b) => (b.scanOrder || 0) - (a.scanOrder || 0));
    const list = [...allScanned, ...pending];

    tbody.innerHTML = list.length ? list.slice(0, 100).map(i => {
        let rowBg = 'white';
        let statusText = 'รอสแกน';
        let statusColor = '#94a3b8';

        if (i.type === 'DUPLICATE') { 
            rowBg = '#faf5ff'; 
            // แก้ไขตรงนี้: ให้แสดงลำดับที่ซ้ำด้วย
            statusText = `ข้อมูลซ้ำ (ลำดับ ${i.duplicateWith})`; 
            statusColor = '#a855f7'; 
        } else if (i.type === 'ERROR') { 
            rowBg = '#fff1f2'; statusText = 'ไม่พบข้อมูล'; statusColor = '#ef4444'; 
        } else if (i.isScanned) { 
            rowBg = '#f0fdf4'; statusText = 'ข้อมูลถูกต้อง'; statusColor = '#10b981'; 
        }

        return `
            <tr style="background:${rowBg}">
                <td style="padding:10px; text-align:center;">${i.scanOrder || '-'}</td>
                <td style="padding:10px; text-align:center;">${(i.type === 'ERROR' || i.type === 'DUPLICATE') ? i.val : (i.isScanned ? i.val : '')}</td>
                <td style="padding:10px; text-align:center;">${(i.type === 'ERROR' || i.type === 'DUPLICATE') ? '-' : i.val}</td>
                <td style="padding:10px; text-align:center;">${i.originalIdx || '-'}</td>
                <td style="padding:10px; text-align:center; font-weight:bold; color:${statusColor}">
                    ${statusText}
                </td>
            </tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center; padding:30px;">ไม่มีข้อมูล</td></tr>';
}

function toggleOfficeMenu(e, type) {
    const menu = document.getElementById('officeMenu');
    const content = document.getElementById('menuContent');
    const title = document.getElementById('menuTitle');
    const cardRect = e.currentTarget.getBoundingClientRect();
    const parentRect = document.getElementById('dashArea').getBoundingClientRect();

    if (!menu.classList.contains('hidden') && menu.dataset.current === type) { 
        return closeOfficeMenu(); 
    }

    menu.style.left = (cardRect.left - parentRect.left) + 'px';
    menu.style.width = cardRect.width + 'px';
    menu.dataset.current = type;
    menu.classList.remove('hidden');
    
    let themeColor = '#3b82f6';
    let html = '';

    if (type === 'total') { 
        title.innerHTML = "ยอดในไฟล์"; 
        html = [...checkItems].sort((a, b) => a.originalIdx - b.originalIdx).map(i => `
            <div class="detail-box" style="border-left: 5px solid #3b82f6;">
                <div><b>ลำดับ: ${i.originalIdx}</b> | Seq.${i.val}</div>
                ${i.isScanned ? '<span class="status-ok">✅</span>' : '<span>-</span>'}
            </div>`).join('');
    } else if (type === 'scanned') { 
        title.innerHTML = "แสกนพบแล้ว"; 
        html = checkItems.filter(i => i.isScanned).sort((a, b) => a.scanOrder - b.scanOrder).map((i, idx) => `
            <div class="detail-box" style="border-left: 5px solid #10b981;">
                <div><b>แสกนที่: ${i.scanOrder}</b> | Seq.${i.val}</div>
                <span class="status-ok">✅</span>
            </div>`).join('');
    } else if (type === 'pending') { 
        title.innerHTML = "ยังไม่ได้แสกน"; 
        html = checkItems.filter(i => !i.isScanned).map(i => `
            <div class="detail-box" style="border-left: 5px solid #f59e0b;">
                <div><b>ไฟล์ลำดับ: ${i.originalIdx}</b> | Seq.${i.val}</div>
                <span>รอสแกน</span>
            </div>`).join('');
    } else if (type === 'error') { 
        title.innerHTML = "ไม่พบข้อมูล"; 
        html = checkErrors.map(i => `
            <div class="detail-box" style="border-left: 5px solid #ef4444; background: #fff1f2;">
                <div><b>แสกนที่: ${i.scanOrder}</b> | Seq.${i.val}</div>
                <span style="color:#ef4444;">❌</span>
            </div>`).join('');
    } else if (type === 'duplicate') {
        title.innerHTML = "ข้อมูลซ้ำ";
        html = checkDuplicates.map(i => `
            <div class="detail-box" style="border-left: 5px solid #a855f7; background: #fdf4ff;">
                <div><b>แสกนที่: ${i.scanOrder}</b> | Seq.${i.val}</div>
                <small>ซ้ำกับ: ${i.duplicateWith}</small>
            </div>`).join('');
    }

    content.innerHTML = html || '<div style="text-align:center; padding:10px; color:#94a3b8;">ไม่มีข้อมูล</div>';
}

// ==========================================
// 6. UTILITIES (CSV Export & Modals)
// ==========================================
function downloadCheckCSV() {
    const staff = document.getElementById('checkStaffList').value;
    let csv = "\uFEFFผู้ตรวจสอบ: " + staff + "\n";
    csv += "ลำดับในกลุ่ม,ข้อมูลแสกน,ข้อมูลไฟล์,ลำดับไฟล์,สถานะ\n";
    
    // --- กลุ่มที่ 1: แสกนพบข้อมูล ---
    const scannedList = checkItems.filter(i => i.isScanned).sort((a, b) => a.scanOrder - b.scanOrder);
    csv += "--- กลุ่มที่ 1: แสกนพบข้อมูล ---\n";
    if (scannedList.length > 0) {
        scannedList.forEach((i, index) => {
            // index + 1 จะเริ่มนับ 1 ใหม่เสมอในกลุ่มนี้
            csv += `${index + 1},${i.val},${i.val},${i.originalIdx},ข้อมูลถูกต้อง✅\n`;
        });
    } else {
        csv += "ไม่มีข้อมูล\n";
    }

    // --- กลุ่มที่ 2: รายการรอแสกน ---
    const pendingList = checkItems.filter(i => !i.isScanned).sort((a, b) => a.originalIdx - b.originalIdx);
    csv += "--- กลุ่มที่ 2: รายการรอแสกน ---\n";
    if (pendingList.length > 0) {
        pendingList.forEach((i, index) => {
            // เริ่มนับ 1 ใหม่สำหรับรายการที่ยังไม่ได้แสกน
            csv += `${index + 1}, ,${i.val},${i.originalIdx},รอสแกน\n`;
        });
    } else {
        csv += "ไม่มีข้อมูล\n";
    }

    // --- กลุ่มที่ 3: ไม่พบข้อมูลในไฟล์ ---
    csv += "--- กลุ่มที่ 3: ไม่พบข้อมูลในไฟล์ ---\n";
    if (checkErrors.length > 0) {
        checkErrors.sort((a, b) => a.scanOrder - b.scanOrder).forEach((i, index) => {
            // เริ่มนับ 1 ใหม่สำหรับรายการที่แสกนแล้วไม่เจอ
            csv += `${index + 1},${i.val},-, -,ไม่พบข้อมูล\n`;
        });
    } else {
        csv += "ไม่มีข้อมูล\n";
    }

    // --- กลุ่มที่ 4: ข้อมูลแสกนซ้ำ ---
    csv += "--- กลุ่มที่ 4: ข้อมูลแสกนซ้ำ ---\n";
    if (checkDuplicates.length > 0) {
        checkDuplicates.forEach((i, index) => {
            // เริ่มนับ 1 ใหม่สำหรับรายการที่แสกนซ้ำ พร้อมระบุว่าซ้ำกับลำดับไหน
            csv += `${index + 1},${i.val},-, -,ข้อมูลซ้ำ (ซ้ำกับลำดับ:${i.duplicateWith})⚠️\n`;
        });
    } else {
        csv += "ไม่มีข้อมูล\n";
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
    const timeStr = new Date().toLocaleTimeString().replace(/:/g, '-');
    
    link.href = URL.createObjectURL(blob);
    link.download = `QA_Scan_Report_${selectedBankCheck}_${(currentFileCheck || 'Report').replace(/Reprint/g, '')}.csv`;
    link.click();
}

function confirmClearData() {
    showModal({ title: "ล้างการสแกน", text: "ต้องการล้างผลการสแกนทั้งหมดใช่หรือไม่?", showCancel: true, onConfirm: () => {
        checkItems.forEach(i => { i.isScanned = false; i.scanOrder = null; });
        checkErrors = []; checkDuplicates = []; checkScannedSet.clear(); 
        validCount = 0; errorCount = 0; duplicateCount = 0; totalScanCount = 0; totalErrorCount = 0;
        updateCheckTable(); updateDashboard();
    }});
}

function confirmResetImport() {
    showModal({
        title: "ยืนยันการเปลี่ยนไฟล์", text: "ต้องการล้างข้อมูลทั้งหมดเพื่อนำเข้าไฟล์ใหม่ใช่หรือไม่?", icon: "🔄", showCancel: true,
        onConfirm: () => {
            checkItems = []; checkErrors = []; checkDuplicates = []; checkScannedSet.clear();
            currentFileCheck = ''; validCount = 0; errorCount = 0; duplicateCount = 0; totalScanCount = 0; totalErrorCount = 0;
            document.getElementById('importArea').classList.remove('hidden');
            document.getElementById('fileDisplay').classList.add('hidden');
            document.getElementById('rawText').value = ''; document.getElementById('fileInput').value = '';
            document.getElementById('scanInput').value = ''; document.getElementById('scanInput').disabled = true;
            document.getElementById('statusMsg').innerHTML = ''; updateCheckTable(); updateDashboard(); closeOfficeMenu();
        }
    });
}

function toggleCustomBankInput(s) {
    const inp = document.getElementById('customBankInput');
    if (s.value === 'custom') { inp.classList.remove('hidden'); inp.focus(); } else { inp.classList.add('hidden'); }
}

function closeOfficeMenu() { document.getElementById('officeMenu').classList.add('hidden'); }
function showModal({ title, text, icon, showCancel, onConfirm }) {
    document.getElementById('mTitle').innerText = title;
    document.getElementById('mText').innerText = text;
    document.getElementById('mIcon').innerText = icon || '⚠️';
    const cBtn = document.getElementById('mCancelBtn');
    if (showCancel) cBtn.classList.remove('hidden'); else cBtn.classList.add('hidden');
    document.getElementById('mConfirmBtn').onclick = () => { if (onConfirm) onConfirm(); closeCustomModal(); };
    document.getElementById('customModal').classList.remove('hidden');
    window.addEventListener('keydown', handleModalKey);
}
function closeCustomModal() {
    document.getElementById('customModal').classList.add('hidden');
    window.removeEventListener('keydown', handleModalKey);
    setTimeout(() => document.getElementById('scanInput').focus(), 100);
}
function handleModalKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('mConfirmBtn').click(); }
    if (e.key === 'Escape') closeCustomModal();
}
document.addEventListener('click', (e) => { if (document.getElementById('dashArea') && !document.getElementById('dashArea').contains(e.target)) closeOfficeMenu(); });
