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
    window.location.href = 'publish.html';
}

function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isAdmin(userData) {
    return userData && userData.role === 'admin';
}

function showAdminLinks(userData) {
    document.querySelectorAll('.admin-only-link').forEach((link) => {
        link.style.display = isAdmin(userData) ? 'flex' : 'none';
    });
}

function formatDateTime(value) {
    if (!value) return 'غير متاح';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير متاح';
    return date.toLocaleString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });
}

function requestStatusLabel(status) {
    if (status === 'approved') return 'تمت الموافقة';
    if (status === 'rejected') return 'مرفوض';
    return 'قيد المراجعة';
}

function loadPublishPage(user, userData) {
    const publishPage = document.getElementById('publish-page');
    if (!publishPage) return;

    const authorName = document.getElementById('publishAuthorName');
    const authorRole = document.getElementById('publishAuthorRole');
    const categorySelect = document.getElementById('publishCategory');
    if (authorName) authorName.innerText = userData.name || user.displayName || 'المستخدم';
    if (authorRole) authorRole.innerText = roleLabel(userData.role);

    if (categorySelect) {
        db.ref('categories').once('value').then((snapshot) => {
            categorySelect.innerHTML = '<option value="general" data-name="عام">عام</option>';
            if (snapshot.exists()) {
                categorySelect.innerHTML = '';
                snapshot.forEach((child) => {
                    const category = child.val() || {};
                    const option = document.createElement('option');
                    option.value = child.key;
                    option.dataset.name = category.name || child.key;
                    option.textContent = category.name || child.key;
                    categorySelect.appendChild(option);
                });
            }
        }).catch(() => {
            categorySelect.innerHTML = '<option value="general" data-name="عام">عام</option>';
        });
    }
}

function submitPublishRequest() {
    const user = auth.currentUser;
    const titleInput = document.getElementById('publishTitle');
    const bodyInput = document.getElementById('publishBody');
    const notesInput = document.getElementById('publishNotes');
    const categorySelect = document.getElementById('publishCategory');
    const submitButton = document.getElementById('submit-publish-button');

    if (!user || !titleInput || !bodyInput || !categorySelect || !submitButton) return;
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) {
        showToast('اكتب عنوان ومحتوى الطلب قبل الإرسال.', 'error');
        return;
    }

    const selectedCategory = categorySelect.options[categorySelect.selectedIndex];
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إرسال الطلب...';

    db.ref('users/' + user.uid).once('value')
        .then((snapshot) => {
            const userData = snapshot.val() || {};
            const requestRef = db.ref('publishRequests').push();
            return requestRef.set({
                title,
                body,
                notes: notesInput ? notesInput.value.trim() : '',
                categoryId: categorySelect.value || 'general',
                categoryName: selectedCategory ? (selectedCategory.dataset.name || selectedCategory.textContent) : 'عام',
                authorId: user.uid,
                authorName: userData.name || user.displayName || 'المستخدم',
                authorRole: userData.role || 'user',
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                createdAtISO: new Date().toISOString()
            });
        })
        .then(() => {
            showToast('تم إرسال طلبك للمراجعة. لن يظهر المحتوى قبل موافقة الأدمن.', 'success');
            titleInput.value = '';
            bodyInput.value = '';
            if (notesInput) notesInput.value = '';
        })
        .catch((error) => {
            console.error('Publish request failed:', error);
            showToast('تعذر إرسال الطلب. تحقق من صلاحيات Firebase.', 'error');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        });
}

function loadAdminDashboard(user, userData) {
    const dashboard = document.getElementById('admin-dashboard-page');
    if (!dashboard) return;

    const list = document.getElementById('publish-requests-list');
    const accessMessage = document.getElementById('admin-access-message');
    if (!isAdmin(userData)) {
        if (accessMessage) {
            accessMessage.innerHTML = '<i class="fas fa-lock"></i><span>هذه الصفحة متاحة للمشرفين فقط.</span>';
            accessMessage.style.display = 'flex';
        }
        if (list) list.innerHTML = '';
        return;
    }
    if (accessMessage) accessMessage.style.display = 'none';
    if (!list) return;

    db.ref('publishRequests').on('value', (snapshot) => {
        list.innerHTML = '';
        if (!snapshot.exists()) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><span>لا توجد طلبات نشر حالياً.</span></div>';
            return;
        }

        const requests = [];
        snapshot.forEach((child) => requests.push({ id: child.key, ...(child.val() || {}) }));
        requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        requests.forEach((request) => {
            list.insertAdjacentHTML('beforeend', renderPublishRequestCard(request));
        });
    }, (error) => {
        console.error('Publish requests failed to load:', error);
        list.innerHTML = '<div class="empty-state error-state"><i class="fas fa-triangle-exclamation"></i><span>تعذر تحميل طلبات النشر.</span></div>';
    });
}

function renderPublishRequestCard(request) {
    const status = request.status || 'pending';
    const actions = status === 'pending' ? `
        <div class="dashboard-actions">
            <button class="settings-button" type="button" onclick="reviewPublishRequest('${escapeHTML(request.id)}', 'approved')"><i class="fas fa-check"></i> الموافقة والنشر</button>
            <button class="danger-button" type="button" onclick="reviewPublishRequest('${escapeHTML(request.id)}', 'rejected')"><i class="fas fa-xmark"></i> رفض الطلب</button>
        </div>` : '';

    return `
        <article class="request-card">
            <div class="request-card-header">
                <div>
                    <h2>${escapeHTML(request.title || 'بدون عنوان')}</h2>
                    <div class="request-meta">
                        <span><i class="fas fa-user"></i> ${escapeHTML(request.authorName || 'مستخدم')}</span>
                        <span><i class="fas fa-id-badge"></i> ${escapeHTML(roleLabel(request.authorRole))}</span>
                        <span><i class="fas fa-folder"></i> ${escapeHTML(request.categoryName || 'عام')}</span>
                        <span><i class="fas fa-clock"></i> ${escapeHTML(formatDateTime(request.createdAtISO || request.createdAt))}</span>
                    </div>
                </div>
                <span class="status-pill status-${escapeHTML(status)}">${escapeHTML(requestStatusLabel(status))}</span>
            </div>
            <div class="request-body">${escapeHTML(request.body || '').replace(/\n/g, '<br>')}</div>
            ${request.notes ? `<div class="request-notes"><strong>ملاحظات صاحب الطلب:</strong> ${escapeHTML(request.notes)}</div>` : ''}
            ${actions}
        </article>`;
}

function reviewPublishRequest(requestId, nextStatus) {
    const user = auth.currentUser;
    if (!user || !requestId || !['approved', 'rejected'].includes(nextStatus)) return;

    db.ref('users/' + user.uid).once('value').then((adminSnapshot) => {
        const adminData = adminSnapshot.val() || {};
        if (!isAdmin(adminData)) throw new Error('not-admin');
        return db.ref('publishRequests/' + requestId).once('value').then((requestSnapshot) => ({
            adminData,
            request: requestSnapshot.val()
        }));
    }).then(({ adminData, request }) => {
        if (!request) throw new Error('request-not-found');

        const updates = {};
        updates['publishRequests/' + requestId + '/status'] = nextStatus;
        updates['publishRequests/' + requestId + '/reviewedBy'] = user.uid;
        updates['publishRequests/' + requestId + '/reviewedByName'] = adminData.name || user.displayName || 'مشرف';
        updates['publishRequests/' + requestId + '/reviewedAt'] = firebase.database.ServerValue.TIMESTAMP;
        if (nextStatus === 'approved') {
            const sectionId = request.categoryId || 'general';
            updates['publishedContent/' + sectionId + '/' + requestId] = {
                title: request.title || '',
                body: request.body || '',
                categoryId: sectionId,
                categoryName: request.categoryName || 'عام',
                authorId: request.authorId || '',
                authorName: request.authorName || 'مستخدم',
                authorRole: request.authorRole || 'user',
                publishedAt: firebase.database.ServerValue.TIMESTAMP,
                publishedAtISO: new Date().toISOString(),
                sourceRequestId: requestId
            };
        }
        return db.ref().update(updates);
    }).then(() => {
        showToast(nextStatus === 'approved' ? 'تمت الموافقة ونشر المحتوى.' : 'تم رفض طلب النشر.', 'success');
    }).catch((error) => {
        console.error('Publish review failed:', error);
        showToast(error.message === 'request-not-found' ? 'طلب النشر غير موجود.' : 'تعذر تحديث حالة الطلب.', 'error');
    });
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
                    loadPublishedSection(childSnapshot.key, cat.name || 'القسم', icon);
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

function loadPublishedSection(categoryId, categoryName, icon) {
    const container = document.getElementById('content-container');
    if (!container) return;
    container.innerHTML = `
        <div class="content-card section-loading">
            <h2><i class="fas ${escapeHTML(icon)}"></i> ${escapeHTML(categoryName)}</h2>
            <p>جاري تحميل البيانات المنشورة...</p>
        </div>`;

    db.ref('publishedContent/' + categoryId).once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            container.innerHTML = `
                <div class="content-card">
                    <h2><i class="fas ${escapeHTML(icon)}"></i> ${escapeHTML(categoryName)}</h2>
                    <p>لا توجد بيانات منشورة في هذا القسم حالياً.</p>
                </div>`;
            return;
        }

        const items = [];
        snapshot.forEach((child) => items.push(child.val() || {}));
        items.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        container.innerHTML = `
            <div class="content-card section-content-card">
                <h2><i class="fas ${escapeHTML(icon)}"></i> ${escapeHTML(categoryName)}</h2>
                <div class="published-items"></div>
            </div>`;

        const list = container.querySelector('.published-items');
        items.forEach((item) => {
            const article = document.createElement('article');
            article.className = 'published-item';
            article.innerHTML = `
                <div class="published-item-header">
                    <h3>${escapeHTML(item.title || 'بدون عنوان')}</h3>
                    <span>${escapeHTML(formatDateTime(item.publishedAtISO || item.publishedAt))}</span>
                </div>
                <p>${escapeHTML(item.body || '').replace(/\n/g, '<br>')}</p>
                <div class="published-item-meta"><i class="fas fa-user"></i> نشر بواسطة ${escapeHTML(item.authorName || 'مستخدم')} - ${escapeHTML(roleLabel(item.authorRole))}</div>`;
            list.appendChild(article);
        });
    }).catch((error) => {
        console.error('Published content failed to load:', error);
        container.innerHTML = `
            <div class="content-card">
                <h2><i class="fas fa-triangle-exclamation"></i> تعذر تحميل القسم</h2>
                <p>تحقق من اتصال Firebase وصلاحيات القراءة.</p>
            </div>`;
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
                const userData = snapshot.val() || {};
                if (userData && userData.name) {
                    document.getElementById('display-username').innerText = userData.name;
                } else if (user.displayName) {
                    document.getElementById('display-username').innerText = user.displayName;
                } else {
                    document.getElementById('display-username').innerText = 'المستخدم';
                }
                showAdminLinks(userData);
                loadPublishPage(user, userData);
                loadAdminDashboard(user, userData);
            }).catch((error) => {
                console.error('User profile failed to load:', error);
                document.getElementById('display-username').innerText = user.displayName || 'المستخدم';
                showAdminLinks({});
                loadPublishPage(user, {});
                loadAdminDashboard(user, {});
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
    if (!userDrop) return;
    userDrop.style.display = userDrop.style.display === 'flex' ? 'none' : 'flex';
    if (notiDrop) notiDrop.style.display = 'none';
}

function toggleNotifications() {
    const notiDrop = document.getElementById('noti-dropdown');
    const userDrop = document.getElementById('user-dropdown');
    if (!notiDrop) return;
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
