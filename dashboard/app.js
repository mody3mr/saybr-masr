const dashboardState = {
    user: null,
    profile: null,
    requests: [],
    requestsListener: null
};

const dashboardElements = {
    loginScreen: document.getElementById('dashboard-login'),
    loginForm: document.getElementById('dashboard-login-form'),
    loginError: document.getElementById('dashboard-login-error'),
    email: document.getElementById('dashboard-email'),
    password: document.getElementById('dashboard-password'),
    app: document.getElementById('dashboard-app'),
    userName: document.getElementById('dashboard-user-name'),
    logout: document.getElementById('dashboard-logout'),
    requestsList: document.getElementById('requests-list'),
    pendingBadge: document.getElementById('pending-count-badge'),
    statUsers: document.getElementById('stat-users'),
    statCategories: document.getElementById('stat-categories'),
    statPending: document.getElementById('stat-pending'),
    toast: document.getElementById('dashboard-toast')
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(value) {
    if (!value) return 'غير متاح';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير متاح';
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function roleLabel(role) {
    if (role === 'admin') return 'مشرف';
    if (role === 'moderator') return 'مراقب';
    return 'عضو';
}

function showToast(message, type = 'success') {
    if (!dashboardElements.toast) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
    dashboardElements.toast.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3600);
}

function setLoginError(message = '') {
    dashboardElements.loginError.textContent = message;
}

function setAppVisible(isVisible) {
    dashboardElements.loginScreen.hidden = isVisible;
    dashboardElements.app.hidden = !isVisible;
}

function isAdmin(profile) {
    return profile && profile.role === 'admin';
}

function friendlyAuthError(error) {
    if (error && error.code === 'auth/invalid-credential') return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    if (error && error.code === 'auth/too-many-requests') return 'تم إيقاف المحاولات مؤقتاً. حاول لاحقاً.';
    return 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.';
}

async function handleDashboardLogin(event) {
    event.preventDefault();
    setLoginError('');

    const email = dashboardElements.email.value.trim();
    const password = dashboardElements.password.value;
    const button = dashboardElements.loginForm.querySelector('button[type="submit"]');
    const originalLabel = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> جاري التحقق...';

    try {
        const credential = await dashboardAuth.signInWithEmailAndPassword(email, password);
        const profileSnapshot = await dashboardDb.ref(`users/${credential.user.uid}`).once('value');
        const profile = profileSnapshot.val() || {};

        if (!isAdmin(profile)) {
            await dashboardAuth.signOut();
            throw new Error('not-admin');
        }

        setLoginError('');
        dashboardElements.loginForm.reset();
    } catch (error) {
        console.error('Dashboard login failed:', error);
        setLoginError(error.message === 'not-admin' ? 'هذا الحساب ليس لديه صلاحية دخول لوحة التحكم.' : friendlyAuthError(error));
    } finally {
        button.disabled = false;
        button.innerHTML = originalLabel;
    }
}

function renderRequests(requests) {
    dashboardElements.requestsList.innerHTML = '';

    if (!requests.length) {
        dashboardElements.requestsList.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox" aria-hidden="true"></i><span>لا توجد طلبات نشر حالياً.</span></div>';
        return;
    }

    requests.forEach((request) => {
        const card = document.createElement('article');
        card.className = 'request-card';
        card.innerHTML = `
            <div class="request-card-top">
                <div>
                    <span class="request-category">${escapeHtml(request.categoryName || 'عام')}</span>
                    <h2>${escapeHtml(request.title || 'بدون عنوان')}</h2>
                </div>
                <span class="request-status status-${escapeHtml(request.status || 'pending')}">${escapeHtml(request.status === 'approved' ? 'تم النشر' : request.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة')}</span>
            </div>
            <div class="request-meta">
                <span><i class="fa-solid fa-user" aria-hidden="true"></i>${escapeHtml(request.authorName || 'مستخدم')}</span>
                <span><i class="fa-solid fa-id-badge" aria-hidden="true"></i>${escapeHtml(roleLabel(request.authorRole))}</span>
                <span><i class="fa-solid fa-clock" aria-hidden="true"></i>${escapeHtml(formatDate(request.createdAtISO || request.createdAt))}</span>
            </div>
            <p class="request-body">${escapeHtml(request.body || '').replace(/\n/g, '<br>')}</p>
            ${request.notes ? `<p class="request-notes"><strong>ملاحظات:</strong> ${escapeHtml(request.notes)}</p>` : ''}
            ${request.status === 'pending' ? `
                <div class="request-actions">
                    <button class="approve-button" type="button" data-request-id="${escapeHtml(request.id)}" data-next-status="approved"><i class="fa-solid fa-check" aria-hidden="true"></i> الموافقة والنشر</button>
                    <button class="reject-button" type="button" data-request-id="${escapeHtml(request.id)}" data-next-status="rejected"><i class="fa-solid fa-xmark" aria-hidden="true"></i> رفض الطلب</button>
                </div>` : ''}
        `;
        dashboardElements.requestsList.appendChild(card);
    });
}

function updateRequestCounters(requests) {
    const pending = requests.filter((request) => request.status === 'pending').length;
    dashboardElements.pendingBadge.textContent = pending;
    dashboardElements.statPending.textContent = pending;
}

function listenForRequests() {
    if (dashboardState.requestsListener) {
        dashboardDb.ref('publishRequests').off('value', dashboardState.requestsListener);
    }

    dashboardState.requestsListener = (snapshot) => {
        const requests = [];
        snapshot.forEach((child) => requests.push({ id: child.key, ...(child.val() || {}) }));
        requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        dashboardState.requests = requests;
        updateRequestCounters(requests);
        renderRequests(requests);
    };

    dashboardDb.ref('publishRequests').on('value', dashboardState.requestsListener, () => {
        dashboardElements.requestsList.innerHTML = '<div class="empty-state error-state"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><span>تعذر تحميل الطلبات من Firebase.</span></div>';
    });
}

async function loadOverviewStats() {
    const [usersSnapshot, categoriesSnapshot] = await Promise.all([
        dashboardDb.ref('users').once('value'),
        dashboardDb.ref('categories').once('value')
    ]);

    dashboardElements.statUsers.textContent = usersSnapshot.exists() ? usersSnapshot.numChildren() : 0;
    dashboardElements.statCategories.textContent = categoriesSnapshot.exists() ? categoriesSnapshot.numChildren() : 0;
}

async function reviewRequest(requestId, nextStatus, button) {
    if (!dashboardState.user || !dashboardState.profile || !isAdmin(dashboardState.profile)) return;
    const request = dashboardState.requests.find((item) => item.id === requestId);
    if (!request) return showToast('طلب النشر غير موجود.', 'error');

    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> جاري الحفظ...';

    try {
        const updates = {};
        updates[`publishRequests/${requestId}/status`] = nextStatus;
        updates[`publishRequests/${requestId}/reviewedBy`] = dashboardState.user.uid;
        updates[`publishRequests/${requestId}/reviewedByName`] = dashboardState.profile.name || dashboardState.user.displayName || 'مشرف';
        updates[`publishRequests/${requestId}/reviewedAt`] = firebase.database.ServerValue.TIMESTAMP;

        if (nextStatus === 'approved') {
            const sectionId = request.categoryId || 'general';
            updates[`publishedContent/${sectionId}/${requestId}`] = {
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

        await dashboardDb.ref().update(updates);
        showToast(nextStatus === 'approved' ? 'تمت الموافقة ونشر المحتوى.' : 'تم رفض طلب النشر.');
    } catch (error) {
        console.error('Request review failed:', error);
        showToast('تعذر تحديث الطلب. تحقق من صلاحيات Firebase.', 'error');
        button.disabled = false;
        button.innerHTML = originalLabel;
    }
}

function activateDashboardSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach((section) => {
        const active = section.id === sectionId;
        section.hidden = !active;
        section.classList.toggle('active-section', active);
    });

    document.querySelectorAll('.dashboard-nav').forEach((button) => {
        button.classList.toggle('active', button.dataset.section === sectionId);
    });
}

async function showDashboard(user, profile) {
    dashboardState.user = user;
    dashboardState.profile = profile;
    dashboardElements.userName.textContent = profile.name || user.displayName || user.email;
    setAppVisible(true);
    activateDashboardSection('overview-section');
    listenForRequests();

    try {
        await loadOverviewStats();
    } catch (error) {
        console.error('Dashboard stats failed:', error);
        dashboardElements.statUsers.textContent = '--';
        dashboardElements.statCategories.textContent = '--';
    }
}

async function hideDashboard() {
    if (dashboardState.requestsListener) {
        dashboardDb.ref('publishRequests').off('value', dashboardState.requestsListener);
        dashboardState.requestsListener = null;
    }
    dashboardState.user = null;
    dashboardState.profile = null;
    setAppVisible(false);
}

dashboardElements.loginForm.addEventListener('submit', handleDashboardLogin);
dashboardElements.logout.addEventListener('click', () => dashboardAuth.signOut());

document.querySelectorAll('.dashboard-nav').forEach((button) => {
    button.addEventListener('click', () => activateDashboardSection(button.dataset.section));
});

dashboardElements.requestsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-request-id]');
    if (!button) return;
    reviewRequest(button.dataset.requestId, button.dataset.nextStatus, button);
});

dashboardAuth.onAuthStateChanged(async (user) => {
    if (!user) {
        await hideDashboard();
        return;
    }

    try {
        const profileSnapshot = await dashboardDb.ref(`users/${user.uid}`).once('value');
        const profile = profileSnapshot.val() || {};
        if (!isAdmin(profile)) {
            await dashboardAuth.signOut();
            setLoginError('هذا الحساب ليس لديه صلاحية دخول لوحة التحكم.');
            return;
        }
        await showDashboard(user, profile);
    } catch (error) {
        console.error('Dashboard authorization failed:', error);
        await dashboardAuth.signOut();
        setLoginError('تعذر التحقق من صلاحيات الحساب حالياً.');
    }
});
