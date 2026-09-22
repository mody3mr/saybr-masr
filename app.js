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
// المصادقة (تسجيل الدخول والإنشاء)
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
                errorMsg = "تم إنشاء الحساب، لكن قاعدة البيانات رفضت حفظ بيانات المستخدم.";
            }
            showToast(errorMsg, "error");
        });
}

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

// =========================================
// دوال مساعدة (Helpers)
// =========================================
function roleLabel(role) {
    if (role === 'admin') return 'مشرف';
    if (role === 'moderator') return 'مراقب';
    if (role === 'employee') return 'موظف';
    return 'عضو';
}

function formatAccountDate(value) {
    if (!value) return 'غير متاح';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير متاح';
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value) {
    if (!value) return 'غير متاح';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير متاح';
    return date.toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
    return userData && (userData.role === 'admin' || userData.role === 'employee');
}

function showAdminLinks(userData) {
    document.querySelectorAll('.admin-only-link').forEach((link) => {
        link.style.display = isAdmin(userData) ? 'flex' : 'none';
    });
}

// =========================================
// صفحة الإعدادات (الملف الشخصي)
// =========================================
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
            showToast('تعذر حفظ التعديلات.', 'error');
        })
        .finally(() => {
            saveButton.disabled = false;
            saveButton.innerHTML = originalText;
        });
}

// =========================================
// طلبات النشر للأعضاء (المراجعة قبل النشر)
// =========================================
function openPublishRequest() {
    window.location.href = 'publish.html';
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
        // سحب الأقسام من dynamic_tabs الخاصة بلوحة التحكم
        db.ref('dynamic_tabs').once('value').then((snapshot) => {
            categorySelect.innerHTML = '<option value="" disabled selected>اختر القسم...</option>';
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const tab = child.val() || {};
                    if(tab.isActive) {
                        const option = document.createElement('option');
                        option.value = child.key;
                        option.dataset.name = tab.name || child.key;
                        option.textContent = tab.name || child.key;
                        categorySelect.appendChild(option);
                    }
                });
            }
        }).catch(() => {
            categorySelect.innerHTML = '<option value="" disabled selected>لا توجد أقسام</option>';
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
    const tabId = categorySelect.value;

    if (!title || !body || !tabId) {
        showToast('اكتب عنوان ومحتوى الطلب واختر القسم قبل الإرسال.', 'error');
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
                tabId: tabId,
                tabName: selectedCategory ? (selectedCategory.dataset.name || selectedCategory.textContent) : 'عام',
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
            categorySelect.value = '';
        })
        .catch((error) => {
            console.error('Publish request failed:', error);
            showToast('تعذر إرسال الطلب. تحقق من اتصالك بالإنترنت.', 'error');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        });
}

function requestStatusLabel(status) {
    if (status === 'approved') return 'تمت الموافقة';
    if (status === 'rejected') return 'مرفوض';
    return 'قيد المراجعة';
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
                        <span><i class="fas fa-folder"></i> ${escapeHTML(request.tabName || 'عام')}</span>
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
        
        // نقل المنشور لجدول posts عشان يظهر في المنصة وتشوفه في لوحة التحكم
        if (nextStatus === 'approved') {
            const newPostRef = db.ref('posts').push();
            updates['posts/' + newPostRef.key] = {
                title: request.title || '',
                body: request.body || '',
                tabId: request.tabId || 'general',
                authorId: request.authorId || '',
                authorName: request.authorName || 'مستخدم',
                isActive: true,
                views: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                sourceRequestId: requestId
            };
        }
        return db.ref().update(updates);
    }).then(() => {
        showToast(nextStatus === 'approved' ? 'تمت الموافقة ونشر المحتوى في المنصة.' : 'تم رفض طلب النشر.', 'success');
    }).catch((error) => {
        console.error('Publish review failed:', error);
        showToast(error.message === 'request-not-found' ? 'طلب النشر غير موجود.' : 'تعذر تحديث حالة الطلب.', 'error');
    });
}

// =========================================
// استعراض المنشورات والأقسام (متطابق مع لوحة التحكم)
// =========================================
function loadSidebarCategories() {
    const tabsList = document.getElementById('dynamic-tabs');
    if (!tabsList) return;

    const renderNoCategories = () => {
        tabsList.innerHTML = '<li class="sidebar-empty">لا توجد أقسام حالياً.</li>';
    };

    db.ref('dynamic_tabs').on('value', (snapshot) => {
        tabsList.innerHTML = '';
        if (snapshot.exists()) {
            let hasActive = false;
            snapshot.forEach((childSnapshot) => {
                const tab = childSnapshot.val();
                if (!tab.isActive) return;
                hasActive = true;
                
                let icon = 'fa-folder';
                if (tab.name.includes('ويندوز') || tab.name.includes('سيرفرات') || tab.name.includes('السيرفرات')) icon = 'fa-windows';
                else if (tab.name.includes('مهندس') || tab.name.includes('شحن') || tab.name.includes('موثوقين')) icon = 'fa-user-tie';
                else if (tab.name.includes('مشاكل') || tab.name.includes('حلول')) icon = 'fa-wrench';
                else if (tab.name.includes('برامج') || tab.name.includes('تعريفات')) icon = 'fa-laptop-code';
                
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHTML(tab.name)}</span>`;
                
                li.onclick = () => {
                    loadPublishedSection(childSnapshot.key, tab.name, icon);
                    if (window.innerWidth <= 992) {
                        toggleSidebar();
                    }
                };
                tabsList.appendChild(li);
            });
            if (!hasActive) renderNoCategories();
        } else {
            renderNoCategories();
        }
    }, (error) => {
        console.error('Tabs failed to load:', error);
        renderNoCategories();
    });
}

function loadPublishedSection(tabId, tabName, icon) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="content-card section-loading">
            <h2><i class="fas ${escapeHTML(icon)}"></i> ${escapeHTML(tabName)}</h2>
            <p>جاري تحميل البيانات...</p>
        </div>`;

    db.ref('posts').once('value').then((snapshot) => {
        const items = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const post = child.val();
                if (post.tabId === tabId && post.isActive !== false) {
                    items.push({ id: child.key, ...post });
                }
            });
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="content-card">
                    <h2><i class="fas ${escapeHTML(icon)}"></i> ${escapeHTML(tabName)}</h2>
                    <p>لا توجد بيانات منشورة في هذا القسم حالياً.</p>
                </div>`;
            return;
        }

        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        container.innerHTML = `
            <div class="content-card section-content-card">
                <h2><i class="fas ${escapeHTML(icon)}"></i> ${escapeHTML(tabName)}</h2>
                <div class="published-items" id="posts-container"></div>
            </div>`;

        const list = document.getElementById('posts-container');
        
        items.forEach((item) => {
            const article = document.createElement('article');
            article.className = 'published-item';
            
            // الصورة
            let mediaHtml = '';
            if (item.imageUrl) {
                mediaHtml = `<div style="text-align: center; margin-bottom: 20px;">
                                <img src="${escapeHTML(item.imageUrl)}" alt="صورة توضيحية" style="max-width: 100%; border-radius: 8px; max-height: 350px; object-fit: cover; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                             </div>`;
            }

            // الأزرار والتواصل
            let actionsHtml = '<div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px;">';
            
            if (item.link) {
                actionsHtml += `<a href="${escapeHTML(item.link)}" target="_blank" class="settings-button" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-download"></i> رابط التحميل / الموقع</a>`;
            }
            if (item.dellDriver) {
                actionsHtml += `<a href="${escapeHTML(item.dellDriver)}" target="_blank" class="settings-button" style="background: linear-gradient(45deg, #0076ce, #005c9e); text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-microchip"></i> تعريف DELL</a>`;
            }
            if (item.phone) {
                actionsHtml += `<a href="tel:${escapeHTML(item.phone)}" class="settings-button" style="background: linear-gradient(45deg, #28a745, #20c997); text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-phone-alt"></i> ${escapeHTML(item.phone)}</a>`;
            }
            if (item.whatsapp) {
                let waNum = item.whatsapp.trim();
                if (waNum.startsWith('0')) waNum = '2' + waNum;
                else if (waNum.startsWith('+')) waNum = waNum.substring(1);
                
                actionsHtml += `<a href="https://wa.me/${escapeHTML(waNum)}" target="_blank" class="settings-button" style="background: linear-gradient(45deg, #25D366, #128C7E); text-decoration: none; display: inline-flex; align-items: center; gap: 8px;"><i class="fab fa-whatsapp"></i> تواصل واتساب</a>`;
            }
            actionsHtml += '</div>';

            if (!item.link && !item.dellDriver && !item.phone && !item.whatsapp) {
                actionsHtml = '';
            }

            // الكارت
            article.innerHTML = `
                ${mediaHtml}
                <div class="published-item-header" style="flex-direction: row; flex-wrap: wrap; justify-content: space-between;">
                    <h3 style="color: var(--secondary-neon); font-size: 22px; margin-bottom: 5px;">${escapeHTML(item.title || 'بدون عنوان')}</h3>
                    <span style="background: rgba(0,212,255,0.1); padding: 4px 10px; border-radius: 20px; font-size: 11px;">${escapeHTML(formatDateTime(item.createdAt))}</span>
                </div>
                <p style="white-space: pre-line; margin-top: 10px; font-size: 15px; color: var(--text-light); line-height: 1.8;">${escapeHTML(item.body || '')}</p>
                ${actionsHtml}
                <div class="published-item-meta" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; margin-top: 20px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user-shield" style="color: var(--text-muted);"></i> <span style="color: var(--text-muted);">نُشر بواسطة ${escapeHTML(item.authorName || 'الإدارة')}</span>
                </div>`;
                
            list.appendChild(article);
            
            // عداد المشاهدات
            if (item.id) {
                db.ref(`posts/${item.id}/views`).transaction((currentViews) => {
                    return (currentViews || 0) + 1;
                }).catch(() => {});
            }
        });
    }).catch((error) => {
        console.error('Posts failed to load:', error);
        container.innerHTML = `
            <div class="content-card">
                <h2><i class="fas fa-triangle-exclamation"></i> تعذر تحميل القسم</h2>
                <p>حدث خطأ أثناء الاتصال بقاعدة البيانات.</p>
            </div>`;
    });
}

// =========================================
// الإشعارات والبحث والفوتر
// =========================================
function loadNotifications() {
    const notiList = document.getElementById('noti-list');
    const notiCount = document.getElementById('noti-count');
    if (!notiList) return;

    db.ref('global_notifications').on('value', (snapshot) => {
        if (snapshot.exists()) {
            let count = 0;
            notiList.innerHTML = '';
            snapshot.forEach((child) => {
                const noti = child.val();
                count++;
                notiList.innerHTML += `<div class="noti-item">${escapeHTML(noti.title || noti.body)}</div>`;
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
                    <h2><i class="fas fa-search"></i> نتائج البحث عن: "${escapeHTML(query)}"</h2>
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
        if (snapshot.exists()) footerContainer.innerHTML = snapshot.val().htmlContent || ''; 
        else footerContainer.innerHTML = '';
    });
}

// =========================================
// حالة المستخدم والتوجيه (Auth State)
// =========================================
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

// =========================================
// تفاعلات واجهة المستخدم (UI Toggles)
// =========================================
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
