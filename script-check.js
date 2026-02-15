// ==========================================
// Module: ระบบ Scan ตรวจสอบ (Check Page) - Full Custom Modal Version
// ==========================================

let checkItems = [];
let checkErrors = [];
let checkScannedSet = new Set();
let selectedBankCheck = 'ธนาคารออมสิน';
let currentFileCheck = '';
let validCount = 0;
let errorCount = 0;
let pendingAction = null; // เก็บฟังก์ชันที่รอการยืนยัน

// 1. สร้างโครงร่างหน้าจอตรวจสอบ (Render UI)
document.getElementById('checkPage').innerHTML = `
    <style>
        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999;
        }
        .modal-content {
            background: white;
            padding: 40px;
            border-radius: 24px;
            text-align: center;
            width: 380px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            animation: modalScale 0.2s ease-out;
        }
        @keyframes modalScale {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .modal-icon { font-size: 60px; margin-bottom: 20px; display: block; }
        .modal-title { font-size: 26px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .modal-text { color: #64748b; font-size: 17px; margin-bottom: 30px; line-height: 1.5; }
        
        .modal-footer { display: flex; gap: 10px; }
        .modal-btn {
            flex: 1;
            border: none;
            padding: 14px 0;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
        }
        .btn-dark { background: #333; color: white; }
        .btn-dark:hover { background: #000; }
        .btn-light { background: #f1f5f9; color: #475569; }
        .btn-light:hover { background: #e2e8f0; }
        .hidden { display: none !important; }
    </style>

    <h1 class="page-header">ตรวจสอบงาน Scan QA</h1>
    <div class="dashboard">
        <div class="card card-blue"><div>ยอดในไฟล์</div><div id="totalCount" class="card-val">0</div></div>
        <div class="card card-green"><div>แสกนพบแล้ว</div><div id="scannedCount" class="card-val">0</div></div>
        <div class="card card-amber"><div>ยังไม่ได้แสกน</div><div id="pendingCount" class="card-val">0</div></div>
        <div class="card card-red"><div>ไม่มีข้อมูล</div><div id="errorCount" class="card-val">0</div></div>
    </div>
    <div class="content-grid">
        <div class="side-controls">
            <div class="box">
		        <button onclick="confirmClearData()" class="btn-clear" style="display:block; margin: 15px auto 0 auto; color:#ef4444; cursor:pointer; background:none; border:none; text-decoration:underline;">ล้างผลการสแกน (เก็บไฟล์เดิมไว้)</button>
                <div class="box-header"><b>1. นำเข้าข้อมูลงาน</b></div>
                <div id="importArea">
                    <div style="margin: 10px 0;">
                        <label style="font-size:12px; font-weight:bold;">ธนาคาร / หน่วยงาน:</label>
                        <select id="bankSelect" class="input-order" style="text-align:left; font-size:14px; height:40px; border:1px solid #ddd; width:100%;" onchange="toggleCustomBankInput(this)">
                            <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                            <option value="ธนาคาร ธ.ก.ส.">ธนาคาร ธ.ก.ส.</option>
                            <option value="ทิพยประกันภัย">ทิพยประกันภัย</option>
                            <option value="custom">-- เพิ่มชื่อเอง --</option>
                        </select>
                        <input type="text" id="customBankInput" class="hidden" placeholder="ระบุชื่อหน่วยงาน..." style="width:100%; margin-top:8px; height:38px; border-radius:8px; border:1px solid #3b82f6; padding:5px 10px; box-sizing:border-box; outline:none;">
                    </div>
                    <div style="margin: 15px 0 10px 0;">
                        <label style="font-size:12px; font-weight:bold;">ผู้ทำการตรวจสอบ:</label>
                        <select id="checkStaffList" class="input-order" style="text-align:left; font-size:14px; height:40px; border:1px solid #ddd;">
                            <option value="">-- กรุณาเลือกรายชื่อ --</option>
                        </select>
                    </div>
                    <input type="file" id="fileInput" accept=".txt" onchange="handleFileCheck(event)" style="margin-top:10px; font-size:11px;">
                    <textarea id="rawText" rows="4" placeholder="วางข้อมูล..." style="width:100%; margin-top:10px; border-radius:8px; border:1px solid #ddd; padding:10px; box-sizing:border-box; outline:none;"></textarea>
                    <button class="btn-action" onclick="importCheckData()">ล็อคข้อมูลเพื่อเริ่มแสกน</button>
                </div>
                <div id="fileDisplay" class="hidden" style="margin-top:10px; text-align:center; padding:15px; border:2px dashed #3b82f6; border-radius:12px; background:#eff6ff;">
                    <b id="displayBankName" style="color:#1e40af;"></b><br>
                    <small id="loadedFileName" style="color:#64748b;"></small><br>
                    <small id="displayStaffName" style="color:#3b82f6; font-weight:bold;"></small>
                    <button onclick="confirmResetImport()" style="display:block; margin: 10px auto 0 auto; font-size:11px; color:#ef4444; cursor:pointer; background:none; border:1px solid #fca5a5; border-radius:4px; padding:2px 8px;">ล้างข้อมูลนำเข้า/เปลี่ยนไฟล์ใหม่</button>
                </div>
            </div>
            <div class="box">
                <b>2. สแกนตรวจสอบ</b>
                <input type="text" id="scanInput" placeholder="..." disabled autocomplete="off">
                <div id="statusMsg" style="text-align:center; margin-top:15px; font-weight:bold; font-size:20px;"></div>
                <button onclick="downloadCheckCSV()" id="btnDownload" class="btn-download hidden">Download Report</button>
            </div>
        </div>
        <div class="table-area">
            <div class="box table-box">
                <div class="table-header">
                    <span>รายการตรวจสอบ</span>
                    <span id="listProgress">รอรับข้อมูล...</span>
                </div>
                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>ลำดับสแกน</th>
                                <th>ข้อมูลการแสกน</th>
                                <th>ข้อมูลไฟล์ Text</th>
                                <th>ลำดับจากไฟล์</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody id="checkTableBody">
                            <tr><td colspan="5" class="empty-msg">กรุณานำเข้าข้อมูลเพื่อเริ่มงาน</td></tr>
                        </tbody>
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

// --- ฟังก์ชัน Modal กลาง ---
function showModal({ title, text, icon, showCancel, onConfirm }) {
    document.getElementById('mTitle').innerText = title;
    document.getElementById('mText').innerText = text;
    document.getElementById('mIcon').innerText = icon || '⚠️';
    
    const cancelBtn = document.getElementById('mCancelBtn');
    const confirmBtn = document.getElementById('mConfirmBtn');
    
    if (showCancel) cancelBtn.classList.remove('hidden');
    else cancelBtn.classList.add('hidden');
    
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        closeCustomModal();
    };
    
    document.getElementById('customModal').classList.remove('hidden');
    window.addEventListener('keydown', handleModalKey);
}

function closeCustomModal() {
    document.getElementById('customModal').classList.add('hidden');
    window.removeEventListener('keydown', handleModalKey);
    setTimeout(() => document.getElementById('scanInput').focus(), 50);
}

function handleModalKey(e) {
    if (e.key === 'Enter') document.getElementById('mConfirmBtn').click();
    if (e.key === 'Escape') closeCustomModal();
}

// --- ฟังก์ชันการทำงาน ---

function toggleCustomBankInput(select) {
    const customInput = document.getElementById('customBankInput');
    if (select.value === 'custom') {
        customInput.classList.remove('hidden');
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
        customInput.value = '';
    }
}

function refreshCheckStaffDropdown() {
    const dropdown = document.getElementById('checkStaffList');
    const staffData = JSON.parse(localStorage.getItem('qa_staff_list')) || [];
    dropdown.innerHTML = '<option value="">-- กรุณาเลือกรายชื่อ --</option>';
    staffData.forEach(staff => {
        const opt = document.createElement('option');
        opt.value = staff.name;
        opt.text = `${staff.id} - ${staff.name}`;
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
    reader.onload = (ev) => document.getElementById('rawText').value = ev.target.result;
    reader.readAsText(file);
}

function importCheckData() {
    const raw = document.getElementById('rawText').value.trim();
    const staffName = document.getElementById('checkStaffList').value;
    const bankSelect = document.getElementById('bankSelect');
    let bankName = bankSelect.value;
    
    if (bankName === 'custom') {
        bankName = document.getElementById('customBankInput').value.trim();
        if (!bankName) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณาระบุชื่อหน่วยงาน", icon: "❌" });
    }
    selectedBankCheck = bankName;

    if (!staffName) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณาเลือกผู้ทำการตรวจสอบก่อน", icon: "👤" });
    if (!raw) return showModal({ title: "ข้อมูลไม่ครบ", text: "กรุณาใส่ข้อมูลงานก่อน", icon: "📄" });

    const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== "");
    checkItems = lines.map((v, i) => ({ val: v, originalIdx: i + 1, isScanned: false, scanOrder: null, type: 'FILE' }));
    
    document.getElementById('displayBankName').innerText = selectedBankCheck;
    document.getElementById('displayStaffName').innerText = "ผู้ตรวจสอบ: " + staffName;
    document.getElementById('importArea').classList.add('hidden');
    document.getElementById('fileDisplay').classList.remove('hidden');
    document.getElementById('scanInput').disabled = false;
    document.getElementById('scanInput').focus();
    document.getElementById('btnDownload').classList.remove('hidden');
    updateCheckTable(); 
    updateDashboard();
}

document.getElementById('scanInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
            if (checkScannedSet.has(val)) { 
                showModal({ title: "ข้อมูลซ้ำ!", text: "รายการบาร์โค้ดนี้ถูกแสกนไปแล้ว", icon: "⚠️" });
                e.target.value = ''; 
                return; 
            }
            
            checkScannedSet.add(val);
            const item = checkItems.find(i => i.val === val);
            
            if (item) {
                validCount++;
                item.isScanned = true;
                item.scanOrder = validCount;
                document.getElementById('statusMsg').innerHTML = '<span style="color:#10b981;">✅ ถูกต้อง</span>';
            } else {
                errorCount++;
                checkErrors.push({ val: val, originalIdx: '-', isScanned: true, scanOrder: errorCount, type: 'ERROR' });
                document.getElementById('statusMsg').innerHTML = '<span style="color:#ef4444;">⚠️ ไม่มีข้อมูล ('+errorCount+')</span>';
            }
            updateCheckTable(); 
            updateDashboard();
        }
        e.target.value = '';
    }
});

function confirmClearData() {
    showModal({
        title: "ยืนยันการล้างข้อมูล",
        text: "ต้องการล้างผลการสแกนทั้งหมดเพื่อเริ่มใหม่ใช่หรือไม่?",
        icon: "🧹",
        showCancel: true,
        onConfirm: () => {
            checkItems.forEach(item => { item.isScanned = false; item.scanOrder = null; });
            checkErrors = [];
            checkScannedSet.clear();
            validCount = 0; errorCount = 0;
            document.getElementById('statusMsg').innerHTML = '';
            updateCheckTable(); updateDashboard();
        }
    });
}

function confirmResetImport() {
    showModal({
        title: "ยืนยันการเปลี่ยนไฟล์",
        text: "ต้องการล้างข้อมูลทั้งหมดเพื่อนำเข้าไฟล์ใหม่ใช่หรือไม่?",
        icon: "🔄",
        showCancel: true,
        onConfirm: () => {
            checkItems = []; checkErrors = []; checkScannedSet.clear();
            currentFileCheck = ''; validCount = 0; errorCount = 0;
            document.getElementById('importArea').classList.remove('hidden');
            document.getElementById('fileDisplay').classList.add('hidden');
            document.getElementById('rawText').value = '';
            document.getElementById('fileInput').value = '';
            document.getElementById('scanInput').disabled = true;
            document.getElementById('statusMsg').innerHTML = '';
            document.getElementById('btnDownload').classList.add('hidden');
            updateCheckTable(); updateDashboard();
        }
    });
}

function updateCheckTable() {
    const tbody = document.getElementById('checkTableBody');
    if (checkItems.length === 0 && checkErrors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">กรุณานำเข้าข้อมูลเพื่อเริ่มงาน</td></tr>';
        return;
    }
    const scanned = checkItems.filter(i => i.isScanned).sort((a,b) => b.scanOrder - a.scanOrder);
    const pending = checkItems.filter(i => !i.isScanned);
    const errors = [...checkErrors].sort((a,b) => b.scanOrder - a.scanOrder);
    const list = [...scanned, ...pending, ...errors];
    tbody.innerHTML = list.map(item => `
        <tr class="${item.type === 'ERROR' ? 'error-row' : (item.isScanned ? 'scanned-row' : '')}">
            <td>${item.scanOrder || '-'}</td>
            <td>${item.isScanned ? item.val : ''}</td>
            <td>${item.type === 'ERROR' ? '(ไม่มีในไฟล์)' : item.val}</td>
            <td>${item.originalIdx}</td>
            <td style="font-weight:bold; color:${item.type === 'ERROR' ? '#ef4444' : (item.isScanned ? '#16a34a' : '#94a3b8')}">
                ${item.type === 'ERROR' ? 'ไม่มีข้อมูล' : (item.isScanned ? 'ถูกต้อง' : 'ยังไม่แสกน')}
            </td>
        </tr>`).join('');
    document.getElementById('listProgress').innerText = `สำเร็จ: ${validCount} | ไม่มี: ${errorCount}`;
}

function updateDashboard() {
    document.getElementById('totalCount').innerText = checkItems.length;
    document.getElementById('scannedCount').innerText = validCount;
    document.getElementById('pendingCount').innerText = checkItems.filter(i => !i.isScanned).length;
    document.getElementById('errorCount').innerText = errorCount;
}

function downloadCheckCSV() {
    const staffName = document.getElementById('checkStaffList').value;
    const fileName = `QA Reprint Scan ${selectedBankCheck} ${currentFileCheck || 'Report'}.csv`;
    let csv = "\uFEFFผู้ทำการตรวจสอบ: " + staffName + "\n";
    csv += "ลำดับสแกน,ข้อมูลการแสกน,ข้อมูลไฟล์ TEXT,ลำดับจากไฟล์,สถานะ\n";
    checkItems.filter(i => i.isScanned).sort((a,b) => a.scanOrder - b.scanOrder).forEach(i => {
        csv += `${i.scanOrder},${i.val},${i.val},${i.originalIdx},ถูกต้อง\n`;
    });
    checkItems.filter(i => !i.isScanned).forEach(i => {
        csv += `-, ,${i.val},${i.originalIdx},ยังไม่ได้แสกน\n`;
    });
    checkErrors.sort((a,b) => a.scanOrder - b.scanOrder).forEach(i => {
        csv += `${i.scanOrder},${i.val},ไม่พบในฐานข้อมูล,-,ไม่มีข้อมูล\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName; link.click();
}