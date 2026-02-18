// ==========================================
// 1. GLOBAL STATES (ตัวแปรสถานะส่วนกลาง)
// ==========================================
let checkItems = [];        // รายการจากไฟล์ต้นฉบับ
let checkErrors = [];       // รายการที่แสกนแล้วไม่พบในไฟล์
let checkScannedSet = new Set();
let selectedBankCheck = 'ธนาคารออมสิน';
let currentFileCheck = '';
let validCount = 0;         // จำนวนที่พบจริง
let errorCount = 0;         // จำนวนที่ไม่พบข้อมูล (Dashboard เลขแดง)
let totalErrorCount = 0;    // ตัวนับลำดับการแสกนแยกเฉพาะกลุ่ม Error

// ==========================================
// 2. INITIALIZATION & UI RENDER
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
    </style>

    <h1 class="page-header">ตรวจสอบงาน Scan QA</h1>
    <div class="dashboard" id="dashArea" style="position:relative !important; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
        <div class="card card-blue" onclick="toggleOfficeMenu(event, 'total')"><div>ยอดในไฟล์</div><div id="totalCount" class="card-val">0</div></div>
        <div class="card card-green" onclick="toggleOfficeMenu(event, 'scanned')"><div>แสกนพบแล้ว</div><div id="scannedCount" class="card-val">0</div></div>
        <div class="card card-amber" onclick="toggleOfficeMenu(event, 'pending')"><div>ยังไม่ได้แสกน</div><div id="pendingCount" class="card-val">0</div></div>
        <div class="card card-red" onclick="toggleOfficeMenu(event, 'error')"><div>ไม่มีข้อมูล</div><div id="errorCount" class="card-val">0</div></div>

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
// 3. DATA IMPORT & PREPARATION (นำเข้าข้อมูล)
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
// 4. SCANNING LOGIC (ระบบสแกน)
// ==========================================
document.getElementById('scanInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
            if (checkScannedSet.has(val)) {
                showModal({ title: "ข้อมูลซ้ำ!", text: "บาร์โค้ด " + val + " ถูกแสกนไปแล้ว", icon: "⚠️" });
            } else {
                checkScannedSet.add(val);
                const item = checkItems.find(i => i.val === val);
                
                if (item) {
                    validCount++; 
                    item.isScanned = true; 
                    item.scanOrder = validCount; // ลำดับปกติสำหรับของที่พบ (1, 2, 3...)
                    document.getElementById('statusMsg').innerHTML = '<span style="color:#10b981;">✅ ถูกต้อง</span>';
                } else {
                    errorCount++;
                    totalErrorCount++; // นับลำดับแยกเฉพาะกลุ่ม Error
                    checkErrors.push({ 
                        val: val, 
                        errorOrder: totalErrorCount, // ใช้ลำดับแยกชุดใหม่ (1, 2, 3...)
                        type: 'ERROR' 
                    });
                    document.getElementById('statusMsg').innerHTML = '<span style="color:#ef4444;">❌ ไม่พบข้อมูล</span>';
                }
                updateCheckTable(); updateDashboard();
            }
        }
        e.target.value = '';
    }
});

// ==========================================
// 5. UI UPDATES & DASHBOARD (การแสดงผล)
// ==========================================
function updateDashboard() {
    document.getElementById('totalCount').innerText = checkItems.length;
    document.getElementById('scannedCount').innerText = validCount;
    document.getElementById('pendingCount').innerText = checkItems.filter(i => !i.isScanned).length;
    document.getElementById('errorCount').innerText = errorCount;
    document.getElementById('listProgress').innerText = `ข้อมูลถูกต้อง: ${validCount} | ไม่พบ: ${errorCount}`;
}

function toggleOfficeMenu(e, type) {
    const menu = document.getElementById('officeMenu');
    const content = document.getElementById('menuContent');
    const title = document.getElementById('menuTitle');
    const cardRect = e.currentTarget.getBoundingClientRect();
    const parentRect = document.getElementById('dashArea').getBoundingClientRect();

    if (!menu.classList.contains('hidden') && menu.dataset.current === type) { return closeOfficeMenu(); }

    menu.style.left = (cardRect.left - parentRect.left) + 'px';
    menu.style.width = cardRect.width + 'px';
    menu.dataset.current = type;
    menu.classList.remove('hidden');
    
    let items = [];
    let themeColor = '#3b82f6';

    if (type === 'total') { 
        title.innerHTML = "ยอดในไฟล์"; 
        items = [...checkItems].sort((a, b) => a.originalIdx - b.originalIdx); 
    }
    else if (type === 'scanned') { 
        title.innerHTML = "แสกนพบแล้ว"; 
        items = checkItems.filter(i => i.isScanned).sort((a, b) => a.scanOrder - b.scanOrder); 
        themeColor = '#10b981';
    }
    else if (type === 'pending') { 
        title.innerHTML = "ยังไม่ได้แสกน"; 
        items = checkItems.filter(i => !i.isScanned).sort((a, b) => a.originalIdx - b.originalIdx); 
        themeColor = '#f59e0b';
    }
    else if (type === 'error') { 
        title.innerHTML = "ไม่พบข้อมูล"; 
        // ดึงข้อมูลจาก checkErrors มาแสดง และเรียงลำดับตาม errorOrder
        items = [...checkErrors].sort((a, b) => a.errorOrder - b.errorOrder); 
        themeColor = '#ef4444';

        content.innerHTML = items.length ? items.map(i => `
            <div class="detail-box" style="border-left: 5px solid ${themeColor}; background: #fff1f2;">
                <div>
                    <b>ลำดับ: ${i.errorOrder}</b> | 
                    <span style="color: #475569;">ข้อมูล: ${i.val}</span>
                </div>
                <span style="color:#ef4444; font-weight:bold; font-size:16px;">❌</span>
            </div>`).join('') : '<div style="text-align:center; padding:10px; color:#94a3b8;">ไม่มีข้อมูลที่ผิดพลาด</div>';
        return;
    }

    content.innerHTML = items.length ? items.map(i => `
        <div class="detail-box" style="border-left: 5px solid ${themeColor};">
            <div><b>ลำดับ: ${i.scanOrder || '-'}</b> | ${i.originalIdx || i.val}</div>
            ${i.isScanned ? '<span class="status-ok">✅</span>' : '<span>-</span>'}
        </div>`).join('') : '<div style="text-align:center; padding:10px; color:#94a3b8;">ไม่มีข้อมูล</div>';
}

function updateCheckTable() {
    const tbody = document.getElementById('checkTableBody');
    
    // 1. เตรียมข้อมูล: รวมทั้งรายการในไฟล์ และ รายการที่สแกนผิด (Errors)
    const scanned = checkItems.filter(i => i.isScanned);
    const errors = [...checkErrors]; // ดึงรายการที่ไม่พบข้อมูลมาด้วย
    const pending = checkItems.filter(i => !i.isScanned);

    // 2. จัดลำดับการแสดงผล: เอาที่สแกนล่าสุด (ทั้งถูกและผิด) ขึ้นก่อน
    const combinedScanned = [...scanned, ...errors].sort((a, b) => {
        const orderA = a.scanOrder || a.errorOrder || 0;
        const orderB = b.scanOrder || b.errorOrder || 0;
        return orderB - orderA; // เรียงจากใหม่ไปเก่า
    });
    
    const list = [...combinedScanned, ...pending];

    tbody.innerHTML = list.length ? list.slice(0, 100).map(i => `
        <tr style="background:${i.type === 'ERROR' ? '#fff1f2' : (i.isScanned ? '#f0fdf4' : 'white')}">
            <td style="padding:10px; text-align:center;">${i.scanOrder || i.errorOrder || '-'}</td>
            <td style="padding:10px; text-align:center;">${i.type === 'ERROR' ? i.val : (i.isScanned ? i.val : '')}</td>
            <td style="padding:10px; text-align:center;">${i.type === 'ERROR' ? '-' : i.val}</td>
            <td style="padding:10px; text-align:center;">${i.originalIdx || '-'}</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:${i.type==='ERROR' ? '#ef4444' : (i.isScanned ? '#10b981' : '#94a3b8')}">
                ${i.type==='ERROR' ? 'ไม่พบข้อมูล' : (i.isScanned ? 'ข้อมูลถูกต้อง' : 'รอสแกน')}
            </td>
        </tr>`).join('') : '<tr><td colspan="5" style="text-align:center; padding:30px;">ไม่มีข้อมูล</td></tr>';
}

// ==========================================
// 6. UTILITIES (ส่งออกไฟล์ และ รีเซ็ต)
// ==========================================
function downloadCheckCSV() {
    const staff = document.getElementById('checkStaffList').value;
    let csv = "\uFEFFผู้ตรวจสอบ: " + staff + "\nลำดับแสกน,ข้อมูลแสกน,ข้อมูลไฟล์,ลำดับไฟล์,สถานะ\n";
    
    const scannedList = checkItems.filter(i => i.isScanned).sort((a, b) => a.scanOrder - b.scanOrder);
    const pendingList = checkItems.filter(i => !i.isScanned).sort((a, b) => a.originalIdx - b.originalIdx);
    const errorList = [...checkErrors].sort((a, b) => a.errorOrder - b.errorOrder);

    csv += "--- กลุ่มที่ 1: แสกนพบข้อมูล --- \n";
    scannedList.forEach(i => csv += `${i.scanOrder},${i.val},${i.val},${i.originalIdx},ข้อมูลถูกต้อง✅\n`);
    csv += "\n--- กลุ่มที่ 2: รายการรอแสกน --- \n";
    pendingList.forEach(i => csv += `-, ,${i.val},${i.originalIdx},รอสแกน\n`);
    csv += "\n--- กลุ่มที่ 3: ไม่พบข้อมูลในไฟล์ --- \n";
    errorList.forEach(i => csv += `${i.errorOrder},${i.val},-, -,ไม่พบข้อมูล\n`);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `QA_Scan_Report_${selectedBankCheck}_${(currentFileCheck || 'Report').replace(/Reprint/g, '')}.csv`;
    link.click();
}

function confirmClearData() {
    showModal({ title: "ล้างการสแกน", text: "ต้องการล้างผลการสแกนทั้งหมดใช่หรือไม่?", showCancel: true, onConfirm: () => {
        checkItems.forEach(i => { i.isScanned = false; i.scanOrder = null; });
        checkErrors = []; checkScannedSet.clear(); 
        validCount = 0; errorCount = 0; 
        totalErrorCount = 0; // รีเซ็ตตัวนับ Error
        updateCheckTable(); updateDashboard();
    }});
}

function confirmResetImport() {
    showModal({
        title: "ยืนยันการเปลี่ยนไฟล์", text: "ต้องการล้างข้อมูลทั้งหมดเพื่อนำเข้าไฟล์ใหม่ใช่หรือไม่?", icon: "🔄", showCancel: true,
        onConfirm: () => {
            checkItems = []; checkErrors = []; checkScannedSet.clear();
            currentFileCheck = ''; validCount = 0; errorCount = 0; totalErrorCount = 0;
            document.getElementById('importArea').classList.remove('hidden');
            document.getElementById('fileDisplay').classList.add('hidden');
            document.getElementById('rawText').value = ''; document.getElementById('fileInput').value = '';
            document.getElementById('scanInput').value = ''; document.getElementById('scanInput').disabled = true;
            document.getElementById('statusMsg').innerHTML = ''; document.getElementById('btnDownload').classList.add('hidden');
            updateCheckTable(); updateDashboard(); closeOfficeMenu();
        }
    });
}

function toggleCustomBankInput(s) {
    const inp = document.getElementById('customBankInput');
    if (s.value === 'custom') { inp.classList.remove('hidden'); inp.focus(); } else { inp.classList.add('hidden'); }
}

// ==========================================
// 7. MODALS & EVENTS (แจ้งเตือน และ เหตุการณ์)
// ==========================================
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
