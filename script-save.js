// ==========================================
// Module: ระบบ บันทึกข้อมูล (Save Page) - Full Custom Modal Version
// ==========================================

let saveData = [], saveScannedSet = new Set();

// 1. CSS สำหรับจัดรูปแบบ UI (รวมสไตล์ Modal ใหม่)
const style = document.createElement('style');
style.innerHTML = `
    /* Modal Styles */
    .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; 
        justify-content: center; align-items: center; z-index: 9999;
    }
    .modal-content {
        background: white; padding: 40px; border-radius: 24px;
        text-align: center; width: 380px;
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
        flex: 1; border: none; padding: 14px 0;
        border-radius: 12px; font-size: 16px; font-weight: bold;
        cursor: pointer; transition: 0.2s;
    }
    .btn-dark { background: #333; color: white; }
    .btn-dark:hover { background: #000; }
    .btn-light { background: #f1f5f9; color: #475569; }
    .btn-light:hover { background: #e2e8f0; }
    .hidden { display: none !important; }

    /* Layout Styles */
    .mode-select-container { margin-top: 10px; display: flex; flex-direction: column; gap: 12px; }
    .custom-select { padding: 12px; border-radius: 12px; border: 1.5px solid #ccc; font-size: 16px; width: 100%; outline: none; background: #fff; cursor: pointer; }
    .custom-select:focus { border-color: #3b82f6; }
    .input-order-new { padding: 12px; border-radius: 12px; border: 1.5px solid #3b82f6; font-size: 16px; width: 100%; box-sizing: border-box; }
    .input-scan-new { padding: 15px; border-radius: 12px; border: 2px solid #22c55e; font-size: 18px; width: 100%; box-sizing: border-box; text-align: center; outline: none; }
    .page-header { text-align: center; margin-bottom: 20px; }
`;
document.head.appendChild(style);

// 2. โครงสร้าง HTML
document.getElementById('savePage').innerHTML = `
    <h1 class="page-header">บันทึกข้อมูล</h1>
    <div class="content-grid">
        <div class="side-controls">
            <div class="box">
                <b style="font-size: 18px;">ส่วนที่ 1: ข้อมูลใบสั่งผลิต</b>
                <div class="mode-select-container" style="margin-top:15px;">
                    <input type="text" id="orderNumber" placeholder="กรอกเลขใบสั่งผลิต..." class="input-order-new">
                    
                    <label style="font-size:14px; color: #333; font-weight: bold; margin-top: 5px;">รูปแบบการแสกน:</label>
                    <select id="scanModeDropdown" class="custom-select" onchange="toggleDigitSelect()">
                        <option value="NORMAL">แสกนแบบปกติ</option>
                        <option value="SPECIAL">แสกนแบบพิเศษ (เติม 0)</option>
                    </select>

                    <div id="digitSelectContainer" class="hidden">
                        <label style="font-size:14px; color: #3b82f6; font-weight: bold;">เติม 0 ให้ครบ:</label>
                        <select id="digitCountDropdown" class="custom-select" style="border-color: #3b82f6;">
                            <option value="5">5 หลัก</option>
                            <option value="6" selected>6 หลัก</option>
                            <option value="7">7 หลัก</option>
                            <option value="8">8 หลัก</option>
                            <option value="9">9 หลัก</option>
                            <option value="10">10 หลัก</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="box">
                <b style="font-size: 18px;">ส่วนที่ 2: ยิงงานแสกน</b>
                <div style="margin-top:15px;">
                    <input type="text" id="saveScanInput" placeholder="ยิงบาร์โค้ดที่นี่..." autocomplete="off" class="input-scan-new">
                    <button onclick="downloadSaveText()" class="btn-download" style="background:#2563eb; width:100%; padding: 15px; border-radius: 12px; font-size: 18px; margin-top:20px; font-weight: bold; color: white; border: none; cursor: pointer;">ดาวน์โหลดไฟล์ Text</button>
                    <button onclick="confirmClearSaveData()" style="display:block; margin:20px auto 0 auto; color:#ff0000; border: 1px solid #ddd; padding: 8px 20px; border-radius: 8px; cursor:pointer; background: #fff; font-size: 14px;">ล้างข้อมูลเริ่มใหม่</button>
                </div>
            </div>
        </div>
        
        <div class="table-area">
            <div class="box table-box">
                <div class="table-header" style="background:#22c55e; color: white; padding: 10px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between;">
                    <span>รายการที่เก็บข้อมูลเสร็จแล้ว</span>
                    <span id="saveCount">0 รายการ</span>
                </div>
                <div class="table-scroll" style="background: white; border: 1px solid #ddd; border-top: none;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
    			        <tr style="background: #f8fafc; border-bottom: 1px solid #ddd;">
        			<th style="padding: 10px 20px; text-align: center;">ลำดับ</th>
        			<th style="padding: 10px 20px; text-align: center;">ข้อมูลที่แสกน</th>
        			<th style="padding: 10px 20px; text-align: center;">เวลาบันทึก</th> </tr>
			</thead>
                        <tbody id="saveTableBody">
                            <tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">ยังไม่มีข้อมูล</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div id="saveModal" class="modal-overlay hidden">
        <div class="modal-content">
            <span id="smIcon" class="modal-icon">⚠️</span>
            <div id="smTitle" class="modal-title">แจ้งเตือน</div>
            <p id="smText" class="modal-text">ข้อความแจ้งเตือน</p>
            <div class="modal-footer">
                <button id="smCancelBtn" onclick="closeSaveModal()" class="modal-btn btn-light hidden">ยกเลิก</button>
                <button id="smConfirmBtn" class="modal-btn btn-dark">ตกลง (Enter)</button>
            </div>
        </div>
    </div>
`;

// --- ฟังก์ชัน Modal ---
function showSaveModal({ title, text, icon, showCancel, onConfirm }) {
    document.getElementById('smTitle').innerText = title;
    document.getElementById('smText').innerText = text;
    document.getElementById('smIcon').innerText = icon || '⚠️';
    
    const cancelBtn = document.getElementById('smCancelBtn');
    const confirmBtn = document.getElementById('smConfirmBtn');
    
    if (showCancel) cancelBtn.classList.remove('hidden');
    else cancelBtn.classList.add('hidden');
    
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        closeSaveModal();
    };
    
    document.getElementById('saveModal').classList.remove('hidden');
    window.addEventListener('keydown', handleSaveModalKey);
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.add('hidden');
    window.removeEventListener('keydown', handleSaveModalKey);
    setTimeout(() => {
        const input = document.getElementById('saveScanInput');
        if (input) input.focus();
    }, 50);
}

function handleSaveModalKey(e) {
    if (e.key === 'Enter') document.getElementById('smConfirmBtn').click();
    if (e.key === 'Escape') closeSaveModal();
}

// --- ฟังก์ชันการทำงานพื้นฐาน ---
function toggleDigitSelect() {
    const mode = document.getElementById('scanModeDropdown').value;
    const container = document.getElementById('digitSelectContainer');
    if (mode === 'SPECIAL') container.classList.remove('hidden');
    else container.classList.add('hidden');
}

// ระบบบันทึกการสแกน
document.getElementById('saveScanInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const orderInput = document.getElementById('orderNumber');
        const modeSelect = document.getElementById('scanModeDropdown');
        const digitSelect = document.getElementById('digitCountDropdown');
        let scanVal = e.target.value.trim();

        if (!orderInput.value.trim()) { 
            showSaveModal({ title: "ข้อมูลไม่ครบ", text: "กรุณากรอกเลขใบสั่งผลิตก่อนสแกนงาน", icon: "🚫" });
            e.target.value = ''; return; 
        }

        if (scanVal) {
            if (saveScannedSet.has(scanVal)) {
                showSaveModal({ 
        	        title: "ข้อมูลซ้ำ!", 
        	        text: ` ${scanVal} ถูกแสกนไปแล้ว`, 
        	        icon: "⚠️" 
    		});
    		e.target.value = ''; return; 
	        }


            orderInput.disabled = true;
            modeSelect.disabled = true;
            digitSelect.disabled = true;

            let finalVal = scanVal;
            if (modeSelect.value === 'SPECIAL') {
                const targetDigits = parseInt(digitSelect.value);
                if (finalVal.length < targetDigits) {
                    finalVal = finalVal.padStart(targetDigits, '0');
                }
            }

            saveData.push({ val: finalVal, time: new Date().toLocaleTimeString() });
            saveScannedSet.add(scanVal);
            updateSaveTable(); 
            e.target.value = '';
        }
    }
});

function updateSaveTable() {
    const tbody = document.getElementById('saveTableBody');
    document.getElementById('saveCount').innerText = `${saveData.length} รายการ`;
    const render = [...saveData].reverse();
    if (saveData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">ยังไม่มีข้อมูล</td></tr>';
        return;
    }
    tbody.innerHTML = render.map((item, idx) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; text-align: center;">${saveData.length - idx}</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: #1e293b;">${item.val}</td>
            <td style="padding: 10px; text-align: center; color: #64748b;">${item.time}</td>
        </tr>
    `).join('');
}

function downloadSaveText() {
    const orderNum = document.getElementById('orderNumber').value.trim();
    if (saveData.length === 0) {
        showSaveModal({ title: "ดาวน์โหลดไม่ได้", text: "ไม่มีข้อมูลที่สแกนในระบบ", icon: "🚫" });
        return;
    }
    const sortedContent = saveData.map(i => i.val).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join('\n');
    const blob = new Blob([sortedContent], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reprint ${orderNum}.txt`;
    link.click();
}

function confirmClearSaveData() {
    showSaveModal({
        title: "ยืนยันการล้างข้อมูล",
        text: "ล้างข้อมูลทั้งหมดเพื่อเริ่มใบสั่งผลิตใหม่หรือไม่?",
        icon: "🧹",
        showCancel: true,
        onConfirm: () => {
            saveData = []; 
            saveScannedSet.clear();
            const orderInput = document.getElementById('orderNumber');
            const modeSelect = document.getElementById('scanModeDropdown');
            const digitSelect = document.getElementById('digitCountDropdown');
            orderInput.disabled = false; orderInput.value = '';
            modeSelect.disabled = false; modeSelect.value = 'NORMAL';
            digitSelect.disabled = false; digitSelect.value = '6';
            toggleDigitSelect(); updateSaveTable();
        }
    });
}
