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
    
    const icon = type === 'success'
        ? '<i class="fas fa-check-circle"></i>'
        : type === 'info'
            ? '<i class="fas fa-info-circle"></i>'
            : '<i class="fas fa-exclamation-circle"></i>';
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

function roleLabel(role) {
    if (role === 'admin') return 'مشرف';
    if (role === 'moderator') return 'مراقب';
    return 'عضو';
}

function formatAccountDate(value) {
    if (!value) return 'غير متاح';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير متاح';

    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function loadSettingsPage(user) {
    const settingsPage = document.getElementById('settings-page');
    if (!settingsPage) return;

    const userRef = db.ref('users/' + user.uid);
    userRef.once('value').then((snapshot) => {
        const userData = snapshot.val() || {};
        const nameInput = document.getElementById('settingsName');
        const bioInput = document.getElementById('settingsBio');
        const phoneInput = document.getElementById('settingsPhone');
        const emailInput = document.getElementById('settingsEmail');
        const roleValue = document.getElementById('settingsRole');
        const createdValue = document.getElementById('settingsCreatedAt');

        if (nameInput) nameInput.value = userData.name || user.displayName || '';
        if (bioInput) bioInput.value = userData.bio || '';
        if (phoneInput) phoneInput.value = userData.phone || 'غير مسجل';
        if (emailInput) emailInput.value = user.email || userData.email || 'غير متاح';
        if (roleValue) roleValue.innerText = roleLabel(userData.role);
        if (createdValue) createdValue.innerText = formatAccountDate(userData.createdAtISO || userData.createdAt);
    }).catch((error) => {
        console.error('Profile failed to load:', error);
        showToast('تعذر تحميل بيانات الحساب حالياً.', 'error');
    });
}

function saveProfileSettings() {
    const user = auth.currentUser;
    const nameInput = document.getElementById('settingsName');
    const bioInput = document.getElementById('settingsBio');
    const saveButton = document.getElementById('save-settings-button');

    if (!user || !nameInput || !bioInput || !saveButton) return;

    const name = nameInput.value.trim();
    const bio = bioInput.value.trim();

    if (!name) {
        showToast('اكتب الاسم قبل حفظ التعديلات.', 'error');
        nameInput.focus();
        return;
    }

    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    user.updateProfile({ displayName: name })
        .then(() => db.ref('users/' + user.uid).update({
            name: name,
            bio: bio,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }))
        .then(() => {
            const displayUsername = document.getElementById('display-username');
            if (displayUsername) displayUsername.innerText = name;
            showToast('تم حفظ بيانات الحساب بنجاح.', 'success');
        })
        .catch((error) => {
            console.error('Profile update failed:', error);
            showToast('تعذر حفظ التعديلات. تحقق من اتصال Firebase وقواعد الصلاحيات.', 'error');
        })
        .finally(() => {
            saveButton.disabled = false;
            saveButton.innerHTML = originalText;
        });
}

function openPublishRequest() {
    showToast('زر طلب النشر جاهز، وسيتم تفعيل الإرسال بعد ربطه بمراجعة وموافقة الأدمن.', 'info');
}

function loadSidebarCategories() {
    const tabsList = document.getElementById('dynamic-tabs');
    if (!tabsList) return;

    const renderNoCategories = () => {
        tabsList.innerHTML = '<li class="sidebar-empty">لا توجد أقسام حالياً.</li>';
    };

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
            renderNoCategories();
        }
    }, (error) => {
        console.error('Categories failed to load:', error);
        renderNoCategories();
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

            loadSettingsPage(user);
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
    if (!sidebar || !content) return;

    if (window.innerWidth > 992) {
        sidebar.classList.remove('active');
        const isClosed = sidebar.classList.toggle('closed');
        content.style.marginRight = isClosed ? '0' : `${sidebar.offsetWidth}px`;
    } else {
        sidebar.classList.remove('closed');
        sidebar.classList.toggle('active');
        content.style.marginRight = '0';
    }
}
