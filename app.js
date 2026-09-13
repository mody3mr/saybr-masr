// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBNwQKnuIomQGm41bsGclI9ihY3SiK78eU",
    authDomain: "saybr-masr.firebaseapp.com",
    databaseURL: "https://saybr-masr-default-rtdb.firebaseio.com",
    projectId: "saybr-masr",
    storageBucket: "saybr-masr.firebasestorage.app",
    messagingSenderId: "650974582933",
    appId: "1:650974582933:web:01ad2aaf2e89c9b668639c"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// دالة تسجيل الدخول
function handleLogin() {
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;

    if(name && phone) {
        localStorage.setItem('cyberMasrUser', name);
        window.location.href = "main.html"; 
    } else {
        alert("يرجى إدخال الاسم ورقم الموبايل");
    }
}

// دالة تسجيل الخروج
function handleLogout() {
    localStorage.removeItem('cyberMasrUser');
    window.location.href = "index.html"; 
}

// إظهار وإخفاء القائمة المنسدلة للمستخدم
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
}

// إظهار وإخفاء القائمة الجانبية
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content-area');
    
    sidebar.classList.toggle('active');
    
    if (window.innerWidth > 992) {
        if (sidebar.classList.contains('active')) {
            content.style.marginRight = '250px';
        } else {
            content.style.marginRight = '0';
        }
    }
}
