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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

function toggleAuthMode(mode) {
    if (mode === 'signup') {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    } else {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    }
}

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
            db.ref('users/' + user.uid).set({
                name: name,
                phone: phone,
                email: email,
                role: 'user'
            }).then(() => {
                window.location.href = "main.html";
            });
        })
        .catch((error) => {
            alert("حدث خطأ: " + error.message);
        });
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) return alert("يرجى إدخال البيانات");

    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert("البيانات غير صحيحة");
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

// دالة لتحميل الأقسام اللي طلبتها عشان الشكل يبقى احترافي
function loadSidebarCategories() {
    const tabsList = document.getElementById('dynamic-tabs');
    if (!tabsList) return;

    // الأقسام بناءً على طلبك في المشروع
    const categories = [
        { id: 'windows-fixes', name: 'مشاكل وحلول الويندوز', icon: 'fa-wrench' },
        { id: 'windows-iso', name: 'نسخ الويندوز', icon: 'fa-windows' },
        { id: 'games-fixes', name: 'مشاكل الألعاب وحلولها', icon: 'fa-gamepad' },
        { id: 'programs', name: 'البرامج والتعريفات', icon: 'fa-box-open' },
        { id: 'servers', name: 'سيرفرات السايبر', icon: 'fa-server' },
        { id: 'paid-free', name: 'برامج مدفوعة مجاناً', icon: 'fa-gift' },
        { id: 'code-scripts', name: 'أكواد برمجية (bat.)', icon: 'fa-code' },
        { id: 'trusted-sellers', name: 'أشخاص موثوقين للشحن', icon: 'fa-user-shield' }
    ];

    tabsList.innerHTML = ''; // مسح "جاري التحميل"
    
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas ${cat.icon}"></i> <span>${cat.name}</span>`;
        // لما يضغط على القسم، نعرض محتوى تجريبي احترافي في النص
        li.onclick = () => {
            document.getElementById('content-container').innerHTML = `
                <div class="content-card">
                    <h2><i class="fas ${cat.icon}"></i> ${cat.name}</h2>
                    <p>هذا هو قسم <strong>${cat.name}</strong>. سيتم إضافة الشروحات، الفيديوهات، والملفات الخاصة بهذا القسم قريباً من خلال لوحة التحكم.</p>
                </div>
            `;
        };
        tabsList.appendChild(li);
    });
}

// نظام الحماية وجلب البيانات
auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath.endsWith("saybr-masr/");

    if (user) {
        if (isLoginPage) {
            window.location.href = "main.html";
        } else {
            // تحميل الأقسام
            loadSidebarCategories();

            // جلب اسم المستخدم وعرضه بشكل آمن (عشان ميعلقش)
            db.ref('/users/' + user.uid).once('value').then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.name) {
                    document.getElementById('display-username').innerText = userData.name;
                } else {
                    document.getElementById('display-username').innerText = 'عضو سايبر مصر';
                }
            }).catch(() => {
                document.getElementById('display-username').innerText = 'عضو سايبر مصر';
            });
        }
    } else {
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
});

function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content-area');
    
    sidebar.classList.toggle('active');
    
    if (window.innerWidth > 992) {
        if (sidebar.classList.contains('active')) {
            content.style.marginRight = '260px';
        } else {
            content.style.marginRight = '0';
        }
    }
}
