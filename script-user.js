// ==========================================
// Module: QA ผู้ตรวจสอบ (Staff Database Management)
// ==========================================

// โหลดข้อมูลพนักงานจาก Local Storage
let staffList = JSON.parse(localStorage.getItem('qa_staff_list')) || [];
let pendingDeleteId = null; // ตัวแปรเก็บ ID ที่รอการยืนยันลบ

// 1. Render หน้าจอจัดการฐานข้อมูลพนักงาน
function renderUserPage() {
    document.getElementById('userPage').innerHTML = `
        <h1 class="page-header">ระบบจัดการพนักงาน</h1>
        <div class="content-grid">
            <div class="side-controls">
                <div class="box">
                    <b style="color:#1e40af;">➕ เพิ่มพนักงานใหม่</b>
                    <p style="font-size:12px; color:#64748b; margin-top:5px;">บันทึกรายชื่อพนักงานเข้าสู่ระบบ</p>
                    <div style="margin-top:15px;">
                        <label style="font-size:12px;">รหัสพนักงาน:</label>
                        <input type="text" id="staffIdInput" placeholder="กรอกรหัส..." class="input-order" style="margin-bottom:10px;">
                        <label style="font-size:12px;">ชื่อ-นามสกุล:</label>
                        <input type="text" id="staffNameInput" placeholder="กรอกชื่อ..." class="input-order">
                        <button onclick="addNewStaff()" class="btn-action" style="background:#22c55e; margin-top:15px;">บันทึกรายชื่อ</button>
                    </div>
                </div>
                
                <div class="box" style="background:#f8fafc; border:1px dashed #cbd5e1; text-align:center; padding:20px;">
                    <div style="font-size:40px; margin-bottom:10px;">📋</div>
                    <p style="font-size:13px; color:#64748b;">รายชื่อที่บันทึกไว้จะไปปรากฏใน<br><b>"List รายชื่อ"</b> ของหน้าสแกนตรวจสอบ</p>
                </div>
            </div>

            <div class="table-area">
                <div class="box table-box">
                    <div class="table-header" style="background:#334155;">
                        <span>รายชื่อพนักงานทั้งหมด (Staff Database)</span>
                        <span id="staffTotalDisplay">ทั้งหมด: ${staffList.length} คน</span>
                    </div>
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:150px;">รหัสพนักงาน</th>
                                    <th style="text-align:left; padding-left:20px;">ชื่อ-นามสกุล</th>
                                    <th style="width:100px;">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody id="staffTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div id="dupPopup" class="popup-overlay hidden">
            <div class="popup-content">
                <div class="popup-icon">⚠️</div>
                <h2 id="dupTitle">ข้อมูลซ้ำ!</h2>
                <p id="dupMsg">รายการนี้ถูกดำเนินการไปแล้ว</p>
                <button class="btn-close-popup" onclick="closePopup()">ตกลง (Enter)</button>
            </div>
        </div>

        <div id="deleteAuthPopup" class="popup-overlay hidden">
            <div class="popup-content">
                <div class="popup-icon">⚠️</div>
                <h2>เอ๊ะ!!!! จะลบรายชื่อหรอ</h2>
                <p>กรุณาใส่รหัสผ่านก่อนนะจ๊ะ</p>
                <input type="password" id="adminPassInput" placeholder="Password..." 
                       style="width:80%; padding:10px; margin:15px 0; border:1px solid #ddd; border-radius:5px; text-align:center; font-size:18px;">
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="btn-action" onclick="verifyAndDelete()" style="background:#ef4444; width:120px;">ตกลง (Enter)</button>
                    <button class="btn-action" onclick="closeDeletePopup()" style="background:#94a3b8; width:100px;">ยกเลิก</button>
                </div>
            </div>
        </div>
    `;
    updateStaffTable();
}

// 2. ฟังก์ชันเพิ่มพนักงานใหม่ (แก้ไขให้ใช้ Custom Pop-up)
function addNewStaff() {
    const idInput = document.getElementById('staffIdInput');
    const nameInput = document.getElementById('staffNameInput');
    const id = idInput.value.trim();
    const name = nameInput.value.trim();

    // แก้ไขจาก alert เป็น showStatusPopup
    if (!id || !name) {
        showStatusPopup("ข้อมูลไม่ครบ!", "กรุณากรอกข้อมูลให้ครบถ้วนทั้งรหัสและชื่อ");
        return;
    }

    if (staffList.some(s => s.id === id)) {
        showStatusPopup("ข้อมูลซ้ำ!", "รหัสพนักงานนี้มีอยู่ในฐานข้อมูลแล้ว");
        return;
    }

    staffList.push({ id, name });
    saveStaffToLocalStorage();
    updateStaffTable();

    idInput.value = '';
    nameInput.value = '';
    idInput.focus(); 
}
// 3. ฟังก์ชันอัปเดตตาราง (แก้ไขการจัดวางให้ตรงหัวตาราง)
function updateStaffTable() {
    const tbody = document.getElementById('staffTableBody');
    const totalDisplay = document.getElementById('staffTotalDisplay');
    
    totalDisplay.innerText = `ทั้งหมด: ${staffList.length} คน`;

    if (staffList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">ไม่มีรายชื่อพนักงานในฐานข้อมูล</td></tr>';
        return;
    }

    tbody.innerHTML = staffList.map(staff => `
        <tr>
            <td style="font-weight:bold; color:#1e293b; text-align:left;">${staff.id}</td>
            
            <td style="text-align:left; padding-left:20px;">${staff.name}</td>
            
            <td style="text-align:center;">
                <button onclick="openDeleteConfirm('${staff.id}')" style="background:#fee2e2; color:#ef4444; border:1px solid #fecaca; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; transition:0.2s;">
                    ลบชื่อ
                </button>
            </td>
        </tr>
    `).join('');
}
// 4. ฟังก์ชันจัดการการลบ (ระบบรหัสผ่าน)
function openDeleteConfirm(id) {
    pendingDeleteId = id;
    const popup = document.getElementById('deleteAuthPopup');
    const input = document.getElementById('adminPassInput');
    
    input.value = ''; 
    popup.classList.remove('hidden');
    setTimeout(() => input.focus(), 100); // ให้เวลา DOM ทำงานนิดหน่อยแล้ว Focus
    
    window.addEventListener('keydown', handleDeleteEnter);
}

function verifyAndDelete() {
    const passInput = document.getElementById('adminPassInput').value;
    const adminPassword = "SiampressQA";

    if (passInput === adminPassword) {
        staffList = staffList.filter(s => s.id !== pendingDeleteId);
        saveStaffToLocalStorage();
        updateStaffTable();
        closeDeletePopup();
    } else {
        closeDeletePopup(); // ปิดหน้าต่างใส่รหัสก่อน
        showStatusPopup("รหัสผ่านผิด!", "รหัสผ่านไม่ถูกต้องนะจ๊ะ... ลองใหม่นะ");
    }
}

function closeDeletePopup() {
    document.getElementById('deleteAuthPopup').classList.add('hidden');
    pendingDeleteId = null;
    window.removeEventListener('keydown', handleDeleteEnter);
}

function handleDeleteEnter(e) {
    if (e.key === 'Enter') {
        verifyAndDelete();
    }
}

// 5. ฟังก์ชันจัดการ Pop-up แจ้งเตือนทั่วไป
function showStatusPopup(title, msg) {
    const popup = document.getElementById('dupPopup');
    const titleElement = document.getElementById('dupTitle');
    const msgElement = document.getElementById('dupMsg');
    
    if (popup && msgElement) {
        titleElement.innerText = title;
        msgElement.innerText = msg;
        popup.classList.remove('hidden');
        window.addEventListener('keydown', handleGeneralEnter);
    }
}

function closePopup() {
    const popup = document.getElementById('dupPopup');
    if (popup) {
        popup.classList.add('hidden');
        window.removeEventListener('keydown', handleGeneralEnter);
    }
}

function handleGeneralEnter(e) {
    if (e.key === 'Enter') closePopup();
}

// 6. บันทึกข้อมูล
function saveStaffToLocalStorage() {
    localStorage.setItem('qa_staff_list', JSON.stringify(staffList));
}
// เริ่มต้นหน้าจอ
document.addEventListener('DOMContentLoaded', () => {
    // เช็คก่อนว่ามี Element นี้จริงไหมเพื่อป้องกัน Error
    if (document.getElementById('userPage')) {
        renderUserPage();
    } else {
        console.error("หา Element 'userPage' ไม่เจอจ้า!");
    }
});
