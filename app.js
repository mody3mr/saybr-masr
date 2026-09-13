// إعدادات Firebase الخاصة بيك
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
        // حفظ بيانات الجلسة محلياً مؤقتاً
        localStorage.setItem('cyberMasrUser', name);
        
        // إخفاء اللوجين وإظهار الموقع
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('display-username').innerText = name;
    } else {
        alert("يرجى إدخال الاسم ورقم الموبايل");
    }
}

// التحقق لو المستخدم مسجل دخول بالفعل
window.onload = () => {
    const savedUser = localStorage.getItem('cyberMasrUser');
    if(savedUser) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('display-username').innerText = savedUser;
        fetchDynamicTabs(); // هنجلب التابات من الداتا بيز
    }
}

// تسجيل الخروج
function handleLogout() {
    localStorage.removeItem('cyberMasrUser');
    location.reload();
}

// القائمة المنسدلة للمستخدم
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
}

// إخفاء وإظهار القائمة الجانبية
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content-area');
    if(sidebar.style.right === '0px' || sidebar.style.right === '') {
        sidebar.style.right = '-250px';
        content.style.marginRight = '0';
    } else {
        sidebar.style.right = '0px';
        content.style.marginRight = '250px';
    }
}
