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

// دالة جلب الأقسام من الفايربيس (ديناميكي 100%)
function loadSidebarCategories() {
    const tabsList = document.getElementById('dynamic-tabs');
    if (!tabsList) return;

    // بنقرأ من الفايربيس من مسار اسمه 'categories'
    db.ref('categories').on('value', (snapshot) => {
        tabsList.innerHTML = ''; 
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const cat = childSnapshot.val();
                const li = document.createElement('li');
                // لو مفيش أيقونة في الداش بورد هنحط أيقونة افتراضية
                const icon = cat.icon ? cat.icon : 'fa-folder';
                li.innerHTML = `<i class="fas ${icon}"></i> <span>${cat.name}</span>`;
                
                li.onclick = () => {
                    document.getElementById('content-container').innerHTML = `
                        <div class="content-card">
                            <h2><i class="fas ${icon}"></i> ${cat.name}</h2>
                            <p>جاري سحب محتوى هذا القسم من قاعدة البيانات...</p>
                        </div>
                    `;
                };
                tabsList.appendChild(li);
            });
        } else {
            // لو قاعدة البيانات لسه فاضية ومفيش أقسام اتضافت من الداش بورد
            tabsList.innerHTML = '<div class="empty-message">لم يتم إضافة أقسام بعد. سيتم إضافتها من لوحة التحكم.</div>';
        }
    });
}

// دالة جلب بيانات الفوتر من الفايربيس
function loadFooterData() {
    const footerContainer = document.getElementById('dynamic-footer-content');
    if (!footerContainer) return;

    db.ref('settings/footer').on('value', (snapshot) => {
        if (snapshot.exists()) {
            // هنعرض الداتا اللي هتحطها من الداش بورد
            const footerHtml = snapshot.val().htmlContent; 
            footerContainer.innerHTML = footerHtml;
        } else {
            // لو فاضي مش هنعرض حاجة لحد ما تملاه
            footerContainer.innerHTML = '';
        }
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
            // تشغيل الدوال الديناميكية
            loadSidebarCategories();
            loadFooterData();

            // جلب اسم المستخدم
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
