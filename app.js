// إعدادات Firebase
const firebaseConfig = {
    // ضيف مفاتيحك هنا زي ما اتفقنا
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// دالة تسجيل الدخول (موجودة في index.html)
function handleLogin() {
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;

    if(name && phone) {
        localStorage.setItem('cyberMasrUser', name);
        window.location.href = "main.html"; // التوجيه للصفحة الرئيسية بعد الدخول
    } else {
        alert("يرجى إدخال الاسم ورقم الموبايل");
    }
}

// دالة تسجيل الخروج (موجودة في main.html)
function handleLogout() {
    localStorage.removeItem('cyberMasrUser');
    window.location.href = "index.html"; // التوجيه لصفحة الدخول
}

// القائمة المنسدلة
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
}

// إظهار وإخفاء القائمة الجانبية (متوافقة مع الموبايل والديسك توب)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content-area');
    
    // بنستخدم toggle للكلاس active عشان الموبايل
    sidebar.classList.toggle('active');
    
    // في الشاشات الكبيرة بنضبط الـ margin
    if (window.innerWidth > 992) {
        if (sidebar.classList.contains('active')) {
            content.style.marginRight = '250px';
        } else {
            content.style.marginRight = '0';
        }
    }
}
