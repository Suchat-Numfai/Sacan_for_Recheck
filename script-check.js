// ==========================================
// Module: ระบบ Scan ตรวจสอบ (Check Page) - Full Fixed Version
// ==========================================

let checkItems = [];
let checkErrors = [];
let checkScannedSet = new Set();
let selectedBankCheck = 'ธนาคารออมสิน';
let currentFileCheck = '';
let validCount = 0;
let errorCount = 0;

// 1. Render UI พร้อมการตั้งค่า CSS ให้ทุกอย่างอยู่ตรงกลาง (Center)
document.getElementById('checkPage').innerHTML = `
    <style>
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999; }
        .modal-content { background: white; padding: 40px; border-radius: 24px; text-align: center; width: 380px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        
        /* สไตล์ตารางและการจัดกึ่งกลาง */
        .table-area th { padding: 12px; border-bottom: 2px solid #e2e8f0; text-align: center !important; vertical-align: middle; }
        .table-area td { padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center !important; vertical-align: middle; }
        
        .detail-overlay { position: absolute; top: 0; left: 0; background: white; z-index: 1001; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); padding: 15px; max-height: 500px; display: flex; flex-direction: column; border: 1px solid #e2e8f0; }
        .hidden { display: none !important; }
        .box { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .input-order { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; outline: none; box-sizing: border-box; }
        .btn-action { width: 100%; background: #3b82f6; color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: bold; }
    </style>

    <h1 class="page-header" style="text-align:center;">ตรวจสอบงาน Scan QA</h1>
    <div class="dashboard" id="dashArea" style="position:relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
        <div class="card card-blue" onclick="toggleOfficeMenu(event, 'total')"><div>ยอดในไฟล์</div><div id="totalCount" class="card-val">0</div></div>
        <div class="card card-green" onclick="toggleOfficeMenu(event, 'scanned')"><div>แสกนพบแล้ว</div><div id="scannedCount" class="card-val">0</div></div>
        <div class="card card-amber" onclick="toggleOfficeMenu(event, 'pending')"><div>ยังไม่ได้แสกน</div><div id="pendingCount" class="card-val">0</div></div>
        <div class="card card-red" onclick="toggleOfficeMenu(event, 'error')"><div>ไม่มีข้อมูล</div><div id="errorCount" class="card-val">0</div></div>

        <div id="officeMenu" class="detail-overlay hidden">
            <div class="detail-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <b id="menuTitle">รายการ</b>
                <button onclick="closeOfficeMenu()" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">ปิด</button>
            </div>
            <div id="menuContent" style="overflow-y:auto;"></div>
        </div>
    </div>

    <div class="content-grid" style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
        <div class="side-controls">
            <div class="box">
                <button onclick="confirmClearData()" style="color:#ef4444; background:none; border:none; text-decoration:underline; font-size:12px; cursor:pointer; margin-bottom:10px;">ล้างผลการสแกน (เก็บไฟล์เดิม)</button>
                <div id="importArea">
                    <b>1. นำเข้าข้อมูลงาน</b>
                    <select id="bankSelect" class="input-order" onchange="toggleCustomBankInput(this)" style="margin-top:10px;">
                        <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                        <option value="ธนาคาร ธ.ก.ส.">ธนาคาร ธ.ก.ส.</option>
                        <option value="ทิพยประกันภัย">ทิพยประกันภัย</option>
                        <option value="custom">-- เพิ่มชื่อเอง --</option>
                    </select>
                    <input type="text" id="customBankInput" class="hidden input-order" placeholder="ระบุชื่อหน่วยงาน...">
                    <select id="checkStaffList" class="input-order"><option value="">-- เลือกรายชื่อ --</option></select>
                    <input type="file" id="fileInput" accept=".txt" onchange="handleFileCheck(event)" style="margin-bottom:10px; font-size:11px;">
                    <textarea id="rawText" class="input-order" rows="4" placeholder="วางข้อมูลที่นี่..."></textarea>
                    <button class="btn-action" onclick="importCheckData()">ล็อคข้อมูลเพื่อเริ่มแสกน</button>
                </div>
                <div id="fileDisplay" class="hidden" style="padding:15px; border:2px dashed #3b82f6; border-radius:12px; background:#eff6ff;">
                    <b id="displayBankName" style="color:#1e40af;"></b><br>
                    <small id="loadedFileName"></small><br>
                    <small id="displayStaffName" style="color:#3b82f6; font-weight:bold;"></small>
                    <button onclick="confirmResetImport()" style="display:block; margin-top:10px; font-size:11px; color:#ef4444; border:1px solid #fca5a5; padding:4px; border-radius:4px; cursor:pointer;">เปลี่ยนไฟล์ใหม่</button>
                </div>
            </div>
            <div class="box">
                <b>2. สแกนตรวจสอบ</b>
                <input type="text" id="scanInput" class="input-order" placeholder="สแกนที่นี่..." disabled autocomplete="off" style="margin-top:10px; font-size:18px; text-align:center;">
                <div id="statusMsg" style="text-align:center; margin-top:15px; font-weight:bold; font-size:20px;"></div>
                <button onclick="downloadCheckCSV()" id="btnDownload" class="hidden" style="width:100%; margin-top:10px; padding:12px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Download Report</button>
            </div>
        </div>

        <div class="table-area">
            <div class="box">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b>รายการตรวจสอบ</b>
                    <span id="listProgress" style="font-size:12px; color:#64748b;">รอข้อมูล...</span>
                </div>
                <div style="max-height:550px; overflow-y:auto; margin-top:10px; border:1px solid #eee; border-radius:8px;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead style="background:#f8fafc; position:sticky; top:0; z-index:10;">
                            <tr>
                                <th>ลำดับสแกน</th>
                                <th>ข้อมูลสแกน</th>
                                <th>ข้อมูลไฟล์</th>
                                <th>ลำดับไฟล์</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody id="checkTableBody">
                            <tr><td colspan="5" style="padding:40px; color:#94a3b8;">กรุณานำเข้าข้อมูล</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div id="customModal" class="modal-overlay hidden">
        <div class="modal-content">
            <span id="mIcon" style="font-size:50px;">⚠️</span>
            <div id="mTitle" style="font-size:22px; font-weight:bold; margin:10px 0;">แจ้งเตือน</div>
            <p id="mText" style="color:#64748b; margin-bottom:20px;"></p>
            <div style="display:flex; gap:10px;">
                <button id="mCancelBtn" onclick="closeCustomModal()" style="flex:1; padding:10px; border-radius:8px; border:none; background:#f1f5f9; cursor:pointer;">ยกเลิก</button>
                <button id="mConfirmBtn" style="flex:1; padding:10px; border-radius:8px; border:none; background:#333; color:white; cursor:pointer;">ตกลง</button>
            </div>
        </div>
    </div>
`;

// --- Logic Functions ---

function updateCheckTable() {
    const tbody = document.getElementById('checkTableBody');
    const list = [
        ...checkItems.sort((a, b) => a.originalIdx - b.originalIdx), 
        ...checkErrors.sort((a, b) => b.scanOrder - a.scanOrder)
    ];

    tbody.innerHTML = list.length ? list.map(i => `
        <tr style="background:${i.type === 'ERROR' ? '#fff1f2' : (i.isScanned ? '#f0fdf4' : 'white')}">
            <td>${i.scanOrder || '-'}</td>
            <td>${i.isScanned ? i.val : ''}</td>
            <td>${i.val}</td>
            <td>${i.originalIdx}</td>
            <td style="font-weight:bold; color:${i.isScanned ? '#10b981' : (i.type==='ERROR' ? '#ef4444' : '#94a3b8')}">
                ${i.type==='ERROR' ? 'ไม่พบ' : (i.isScanned ? 'ข้อมูลถูกต้อง' : 'รอสแกน')}
            </td>
        </tr>`).join('') : '<tr><td colspan="5" style="padding:30px;">ไม่มีข้อมูล</td></tr>';
}

function updateDashboard() {
    document.getElementById('totalCount').innerText = checkItems.length;
    document.getElementById('scannedCount').innerText = validCount;
    document.getElementById('pendingCount').innerText = checkItems.filter(i => !i.isScanned).length;
    document.getElementById('errorCount').innerText = errorCount;
    document.getElementById('listProgress').innerText = `ถูกต้อง: ${validCount} | ไม่พบ: ${errorCount}`;
}

function downloadCheckCSV() {
    const staff = document.getElementById('checkStaffList').value;
    let csv = "\uFEFFผู้ตรวจสอบ: " + staff + "\nลำดับแสกน,ข้อมูลแสกน,ข้อมูลไฟล์,ลำดับไฟล์,สถานะ\n";
    
    const scannedList = checkItems.filter(i => i.isScanned).sort((a, b) => a.scanOrder - b.scanOrder);
    const pendingList = checkItems.filter(i => !i.isScanned).sort((a, b) => a.originalIdx - b.originalIdx);
    const errorList = [...checkErrors].sort((a, b) => a.scanOrder - b.scanOrder);

    csv += "--- 1. แสกนพบข้อมูล ---\n";
    scannedList.forEach(i => csv += `${i.scanOrder},${i.val},${i.val},${i.originalIdx},ข้อมูลถูกต้อง✅\n`);
    
    csv += "\n--- 2. รายการรอแสกน ---\n";
    pendingList.forEach(i => csv += `-, ,${i.val},${i.originalIdx},รอสแกน\n`);
    
    csv += "\n--- 3. ไม่พบข้อมูล (ล่างสุด) ---\n";
    errorList.forEach(i => csv += `${i.scanOrder},${i.val},-, -,ไม่พบข้อมูล\n`);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    let fileNameDisplay = (currentFileCheck || 'Report').replace(/Reprint/g, '');
    link.download = `QA_Report_${selectedBankCheck}_${fileNameDisplay}.csv`;
    link.click();
}

// --- Event Listeners & Helpers ---

function refreshCheckStaffDropdown() {
    const dropdown = document.getElementById('checkStaffList');
    const staffData = JSON.parse(localStorage.getItem('qa_staff_list')) || [];
    dropdown.innerHTML = '<option value="">-- เลือกรายชื่อ --</option>';
    staffData.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name; opt.text = s.name; dropdown.add(opt);
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

    if (!staff || !raw || !bankName) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณาระบุข้อมูลให้ครบถ้วน", icon: "👤" });

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
                    validCount++; item.isScanned = true; item.scanOrder = validCount;
                    document.getElementById('statusMsg').innerHTML = '<span style="color:#10b981;">✅ ถูกต้อง</span>';
                } else {
                    errorCount++;
                    checkErrors.push({ val: val, scanOrder: errorCount, type: 'ERROR', originalIdx: '-' });
                    document.getElementById('statusMsg').innerHTML = '<span style="color:#ef4444;">❌ ไม่พบข้อมูล</span>';
                }
                updateCheckTable(); updateDashboard();
            }
        }
        e.target.value = '';
    }
});

function showModal({ title, text, icon, showCancel, onConfirm }) {
    document.getElementById('mTitle').innerText = title;
    document.getElementById('mText').innerText = text;
    document.getElementById('mIcon').innerText = icon || '⚠️';
    document.getElementById('mCancelBtn').style.display = showCancel ? 'block' : 'none';
    document.getElementById('mConfirmBtn').onclick = () => { if (onConfirm) onConfirm(); closeCustomModal(); };
    document.getElementById('customModal').classList.remove('hidden');
}

function closeCustomModal() { 
    document.getElementById('customModal').classList.add('hidden'); 
    setTimeout(() => document.getElementById('scanInput').focus(), 100);
}

function confirmResetImport() {
    showModal({ title: "ยืนยันการเปลี่ยนไฟล์", text: "ต้องการล้างข้อมูลเพื่อนำเข้าไฟล์ใหม่ใช่หรือไม่?", icon: "🔄", showCancel: true, onConfirm: () => {
        checkItems = []; checkErrors = []; checkScannedSet.clear(); validCount = 0; errorCount = 0;
        document.getElementById('importArea').classList.remove('hidden');
        document.getElementById('fileDisplay').classList.add('hidden');
        document.getElementById('scanInput').disabled = true;
        updateCheckTable(); updateDashboard();
    }});
}

function toggleCustomBankInput(s) {
    const inp = document.getElementById('customBankInput');
    if (s.value === 'custom') { inp.classList.remove('hidden'); inp.focus(); } else { inp.classList.add('hidden'); }
}
