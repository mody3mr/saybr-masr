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
const auth = firebase.auth();

// التبديل بين نموذج تسجيل الدخول وإنشاء الحساب
function toggleAuthMode(mode) {
    if (mode === 'signup') {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    } else {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    }
}

// إنشاء حساب جديد
function registerUser() {
    const name = document.getElementById('signupName').value;
    const phone = document.getElementById('signupPhone').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!name || !phone || !email || !password) {
        return alert("يرجى إكمال جميع البيانات");
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // حفظ بيانات المستخدم في الداتا بيز (الاسم ورقم الموبايل)
            db.ref('users/' + user.uid).set({
                name: name,
                phone: phone,
                email: email,
                role: 'user' // صلاحية عادية، ممكن نغيرها للأدمن بعدين
            }).then(() => {
                window.location.href = "main.html";
            });
        })
        .catch((error) => {
            alert("حدث خطأ: " + error.message);
        });
}

// تسجيل الدخول
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        return alert("يرجى إدخال البريد الإلكتروني وكلمة المرور");
    }

    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert("بيانات الدخول غير صحيحة أو الحساب غير موجود");
        });
}

// تسجيل الخروج
function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

// نظام الحماية: مراقبة حالة المستخدم (مسجل دخول ولا لأ)
auth.onAuthStateChanged((user) => {
    // بنعرف إحنا في أي صفحة عشان نوجه المستخدم صح
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath.endsWith("saybr-masr/");

    if (user) {
        // لو المستخدم مسجل دخول وفاتح صفحة اللوجين، هنحوله للرئيسية
        if (isLoginPage) {
            window.location.href = "main.html";
        } else {
            // لو هو في الرئيسية بنجيب اسمه من الداتا بيز ونعرضه
            db.ref('/users/' + user.uid).once('value').then((snapshot) => {
                const userData = snapshot.val();
                if (userData && document.getElementById('display-username')) {
                    document.getElementById('display-username').innerText = userData.name;
                }
            });
        }
    } else {
        // لو مش مسجل دخول وفاتح الرئيسية، هنطرده لصفحة اللوجين
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
});

// إظهار وإخفاء القائمة المنسدلة
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
