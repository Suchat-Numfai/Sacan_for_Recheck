// ฟังก์ชันสลับหน้าจอ (Navigation)
function switchPage(page) {
    const pages = ['check', 'save', 'user'];
    pages.forEach(p => {
        // ซ่อนหน้าอื่นและแสดงหน้าปัจจุบัน
        document.getElementById(p + 'Page').classList.toggle('hidden', p !== page);
        // เปลี่ยนสถานะเมนูที่เลือกให้เป็น Active
        document.getElementById('menu-' + p).classList.toggle('active', p === page);
    });

    // เงื่อนไขพิเศษ: เมื่อสลับมาหน้า Scan ตรวจสอบ ให้รีเฟรชรายชื่อพนักงานล่าสุดจากฐานข้อมูล
    if (page === 'check') {
        if (typeof refreshCheckStaffDropdown === 'function') {
            refreshCheckStaffDropdown();
        }
    }
}

// ฟังก์ชันปิด Pop-up แจ้งเตือนข้อมูลซ้ำ
function closePopup() {
    document.getElementById('dupPopup').classList.add('hidden');
    
    // ตรวจสอบว่าปัจจุบันอยู่หน้าไหน เพื่อคืน Focus ให้ช่องสแกนของหน้านั้น
    const isCheckActive = !document.getElementById('checkPage').classList.contains('hidden');
    const isSaveActive = !document.getElementById('savePage').classList.contains('hidden');
    
    if (isCheckActive) {
        document.getElementById('scanInput').focus();
    } else if (isSaveActive) {
        document.getElementById('saveScanInput').focus();
    }
}

// ดักจับการกดปุ่ม Enter ทั่วทั้งหน้าจอเพื่อปิด Pop-up
window.addEventListener('keydown', (e) => {
    const dupPopup = document.getElementById('dupPopup');
    if (!dupPopup.classList.contains('hidden') && e.key === 'Enter') {
        e.preventDefault(); // ป้องกันการส่งค่า Enter ไปทำงานอื่น
        closePopup();
    }
});