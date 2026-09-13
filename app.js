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
let isCompletingSignup = false;

// =========================================
// نظام الإشعارات الذكية (Toasts)
// =========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fadeOut');
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}
// =========================================

function toggleAuthMode(mode) {
    if (mode === 'signup') {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    } else {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    }
}

// التسجيل الاحترافي
function registerUser() {
    const name = document.getElementById('signupName').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !phone || !email || !password) {
        return showToast("يرجى إكمال جميع الحقول الفارغة", "error");
    }

    const btn = document.querySelector('#signup-form button');
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
    btn.disabled = true;
    isCompletingSignup = true;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userRef = db.ref('users/' + user.uid);
            const userData = {
                uid: user.uid,
                name: name,
                phone: phone,
                email: email,
                role: 'user',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                createdAtISO: new Date().toISOString()
            };

            return user.updateProfile({ displayName: name }).then(() => {
                return userRef.set(userData);
            }).then(() => {
                // تأكيد أن البيانات وصلت فعليًا إلى Realtime Database قبل التحويل.
                return userRef.once('value').then((snapshot) => {
                    if (!snapshot.exists()) {
                        throw new Error('database/verification-failed');
                    }
                });
            });
        })
        .then(() => {
            isCompletingSignup = false;
            showToast("تم إنشاء الحساب بنجاح! جاري تحويلك...", "success");
            setTimeout(() => {
                window.location.href = "main.html";
            }, 2000);
        })
        .catch((error) => {
            isCompletingSignup = false;
            console.error('Signup failed:', error);
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            let errorMsg = "حدث خطأ غير متوقع!";
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = "البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.";
            } else if (error.code === 'auth/weak-password') {
                errorMsg = "كلمة المرور ضعيفة! يجب أن لا تقل عن 6 أحرف.";
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = "صيغة البريد الإلكتروني غير صحيحة.";
            } else if (error.code === 'PERMISSION_DENIED' || error.code === 'database/permission-denied') {
                errorMsg = "تم إنشاء الحساب، لكن قاعدة البيانات رفضت حفظ بيانات المستخدم. راجع Firebase Database Rules.";
            } else if (error.message === 'database/verification-failed') {
                errorMsg = "لم يتم تأكيد حفظ بيانات المستخدم في قاعدة البيانات. تحقق من اتصال Firebase وقواعد Realtime Database.";
            }
            showToast(errorMsg, "error");
        });
}

// تسجيل الدخول الاحترافي
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        return showToast("يرجى إدخال البريد الإلكتروني وكلمة المرور", "error");
    }

    const btn = document.querySelector('#login-form button');
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
    btn.disabled = true;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showToast("تم تسجيل الدخول بنجاح!", "success");
            setTimeout(() => {
                window.location.href = "main.html";
            }, 1500);
        })
        .catch(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            showToast("البيانات غير صحيحة، يرجى التأكد من الإيميل والباسورد.", "error");
        });
}

function handleLogout() {
    auth.signOut().then(() => window.location.href = "index.html");
}

function loadSidebarCategories() {
    const tabsList = document.getElementById('dynamic-tabs');
    if (!tabsList) return;

    db.ref('categories').on('value', (snapshot) => {
        tabsList.innerHTML = ''; 
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const cat = childSnapshot.val();
                const icon = cat.icon ? cat.icon : 'fa-folder';
                const li = document.createElement('li');
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
            tabsList.innerHTML = '<div class="empty-message">لم يتم إضافة أقسام بعد. سيتم إضافتها من لوحة التحكم.</div>';
        }
    });
}

function loadNotifications() {
    const notiList = document.getElementById('noti-list');
    const notiCount = document.getElementById('noti-count');
    if (!notiList) return;

    db.ref('notifications').on('value', (snapshot) => {
        if (snapshot.exists()) {
            let count = 0;
            notiList.innerHTML = '';
            snapshot.forEach((child) => {
                const noti = child.val();
                count++;
                notiList.innerHTML += `<div class="noti-item">${noti.title || noti.message}</div>`;
            });
            notiCount.innerText = count;
        } else {
            notiCount.innerText = '0';
            notiList.innerHTML = '<div class="empty-message">لا توجد إشعارات حالياً.</div>';
        }
    });
}

function handleGlobalSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if(query !== "") {
            document.getElementById('content-container').innerHTML = `
                <div class="content-card">
                    <h2><i class="fas fa-search"></i> نتائج البحث عن: "${query}"</h2>
                    <p>جاري البحث في جميع الأقسام والمواضيع... (سيتم ربط النتائج بقاعدة البيانات لاحقاً)</p>
                </div>
            `;
        }
    }
}

function loadFooterData() {
    const footerContainer = document.getElementById('dynamic-footer-content');
    if (!footerContainer) return;
    db.ref('settings/footer').on('value', (snapshot) => {
        if (snapshot.exists()) footerContainer.innerHTML = snapshot.val().htmlContent; 
        else footerContainer.innerHTML = '';
    });
}

auth.onAuthStateChanged((user) => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath.endsWith("saybr-masr/");

    if (user) {
        if (isLoginPage) {
            if (isCompletingSignup) return;
            window.location.href = "main.html";
        } else {
            loadSidebarCategories();
            loadFooterData();
            loadNotifications();

            db.ref('/users/' + user.uid).once('value').then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.name) {
                    document.getElementById('display-username').innerText = userData.name;
                } else if (user.displayName) {
                    document.getElementById('display-username').innerText = user.displayName;
                } else {
                    document.getElementById('display-username').innerText = 'المستخدم';
                }
            }).catch(() => {
                document.getElementById('display-username').innerText = user.displayName || 'المستخدم';
            });
        }
    } else {
        if (!isLoginPage) window.location.href = "index.html";
    }
});

function toggleDropdown() {
    const userDrop = document.getElementById('user-dropdown');
    const notiDrop = document.getElementById('noti-dropdown');
    userDrop.style.display = userDrop.style.display === 'flex' ? 'none' : 'flex';
    if (notiDrop) notiDrop.style.display = 'none';
}

function toggleNotifications() {
    const notiDrop = document.getElementById('noti-dropdown');
    const userDrop = document.getElementById('user-dropdown');
    notiDrop.style.display = notiDrop.style.display === 'flex' ? 'none' : 'flex';
    if (userDrop) userDrop.style.display = 'none';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content-area');
    sidebar.classList.toggle('active');
    
    if (window.innerWidth > 992) {
        if (sidebar.classList.contains('active')) content.style.marginRight = '260px';
        else content.style.marginRight = '0';
    }
}
