const dashboardState = {
    user: null,
    profile: null,
    tabs: [],
    categories: [],
    posts: [], // إضافة مصفوفة المحتوى
    employees: [],
    members: [],
    complaints: [],
    notifications: [],
    logs: [],
    settings: {}
};

const elements = {
    loginScreen: document.getElementById('dashboard-login'),
    loginForm: document.getElementById('dashboard-login-form'),
    loginError: document.getElementById('dashboard-login-error'),
    email: document.getElementById('dashboard-email'),
    password: document.getElementById('dashboard-password'),
    app: document.getElementById('dashboard-app'),
    userName: document.getElementById('dashboard-user-name'),
    logoutBtn: document.getElementById('dashboard-logout'),
    toast: document.getElementById('dashboard-toast'),
    dynamicSidebarTabs: document.getElementById('dynamic-sidebar-tabs'),
    sidebar: document.querySelector('.dashboard-sidebar')
};

// ==========================================
// Utilities & Helpers
// ==========================================
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(timestamp) {
    if (!timestamp) return 'غير متاح';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'غير متاح';
    return date.toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function showToast(message, type = 'success') {
    if (!elements.toast) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span>${escapeHtml(message)}</span>`;
    elements.toast.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ==========================================
// Activity Logger
// ==========================================
async function logActivity(action, details) {
    if (!dashboardState.user) return;
    const logEntry = {
        uid: dashboardState.user.uid,
        adminName: dashboardState.profile?.name || dashboardState.user.email || 'إدارة',
        action: action,
        details: details,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    await dashboardDb.ref('activity_logs').push(logEntry);
}

// ==========================================
// Auth & Navigation
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    elements.loginError.textContent = '';
    const btn = elements.loginForm.querySelector('button');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';

    try {
        const credential = await dashboardAuth.signInWithEmailAndPassword(elements.email.value.trim(), elements.password.value);
        const snap = await dashboardDb.ref(`users/${credential.user.uid}`).once('value');
        const profile = snap.val() || {};

        if (profile.role !== 'admin' && profile.role !== 'employee') {
            await dashboardAuth.signOut();
            throw new Error('not-authorized');
        }
        
        elements.loginForm.reset();
        await logActivity('تسجيل دخول', 'تسجيل دخول ناجح للوحة التحكم');
    } catch (error) {
        elements.loginError.textContent = error.message === 'not-authorized' ? 'ليس لديك صلاحية للدخول.' : 'بيانات الدخول غير صحيحة.';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function activateSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        const isActive = sec.id === sectionId;
        sec.hidden = !isActive;
        sec.classList.toggle('active-section', isActive);
    });
    document.querySelectorAll('.dashboard-nav').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
}

// ==========================================
// Data Initialization & Listeners
// ==========================================
function initDashboardData() {
    dashboardDb.ref('users').on('value', snap => {
        const users = [];
        snap.forEach(child => users.push({ id: child.key, ...child.val() }));
        dashboardState.members = users;
        const activeCountElem = document.getElementById('stat-active-count');
        const bannedCountElem = document.getElementById('stat-banned-count');
        if (activeCountElem) activeCountElem.textContent = users.filter(u => !u.isBanned).length;
        if (bannedCountElem) bannedCountElem.textContent = users.filter(u => u.isBanned).length;
        renderMembers();
    });

    dashboardDb.ref('employees').on('value', snap => {
        const emps = [];
        snap.forEach(child => emps.push({ id: child.key, ...child.val() }));
        dashboardState.employees = emps;
        const empCountElem = document.getElementById('stat-emp-count');
        if (empCountElem) empCountElem.textContent = emps.length;
        renderEmployees();
    });

    dashboardDb.ref('dynamic_tabs').on('value', snap => {
        const tabs = [];
        snap.forEach(child => tabs.push({ id: child.key, ...child.val() }));
        dashboardState.tabs = tabs;
        renderTabs();
        updateCategoryTabSelect();
    });

    dashboardDb.ref('categories').on('value', snap => {
        const cats = [];
        snap.forEach(child => cats.push({ id: child.key, ...child.val() }));
        dashboardState.categories = cats;
        const catCountElem = document.getElementById('stat-cat-count');
        if (catCountElem) catCountElem.textContent = cats.length;
        renderCategories();
        updatePostCategorySelect(); // تحديث قائمة الأقسام في فورم إضافة منشور
    });

    dashboardDb.ref('posts').on('value', snap => {
        const p = [];
        snap.forEach(child => p.push({ id: child.key, ...child.val() }));
        dashboardState.posts = p;
        const postsCountElem = document.getElementById('stat-posts-count');
        if (postsCountElem) postsCountElem.textContent = p.length;
        renderPosts();
        renderCategories(); // إعادة حساب وتحديث عدد المنشورات لكل قسم
    });

    dashboardDb.ref('complaints').on('value', snap => {
        const comps = [];
        snap.forEach(child => comps.push({ id: child.key, ...child.val() }));
        dashboardState.complaints = comps;
        renderComplaints();
    });

    dashboardDb.ref('admin_notifications').on('value', snap => {
        const notifs = [];
        snap.forEach(child => notifs.push({ id: child.key, ...child.val() }));
        dashboardState.notifications = notifs;
        renderNotifications();
    });

    dashboardDb.ref('activity_logs').on('value', snap => {
        const logs = [];
        snap.forEach(child => logs.push({ id: child.key, ...child.val() }));
        dashboardState.logs = logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderLogs();
    });

    dashboardDb.ref('settings').on('value', snap => {
        dashboardState.settings = snap.val() || {};
        populateSettings();
    });

    // Mock stats (مؤقت لحين توفر بيانات حقيقية للزيارات)
    const visitsCount = document.getElementById('stat-visits-count');
    const onlineCount = document.getElementById('stat-online-count');
    if (visitsCount) visitsCount.textContent = Math.floor(Math.random() * 5000) + 1000;
    if (onlineCount) onlineCount.textContent = Math.floor(Math.random() * 150) + 10;
}

// ==========================================
// Tab 2: Dynamic Tabs
// ==========================================
document.getElementById('add-tab-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-tab-name');
    const name = nameInput.value.trim();
    if (!name) return;

    await dashboardDb.ref('dynamic_tabs').push({ name, isActive: true, createdAt: firebase.database.ServerValue.TIMESTAMP });
    await logActivity('إضافة تاب', `تم إضافة تاب جديد باسم: ${name}`);
    showToast('تمت إضافة التاب بنجاح');
    nameInput.value = '';
});

function renderTabs() {
    const list = document.getElementById('dynamic-tabs-list');
    if (!list || !elements.dynamicSidebarTabs) return;
    
    elements.dynamicSidebarTabs.innerHTML = '';
    list.innerHTML = '';

    dashboardState.tabs.forEach(tab => {
        if (tab.isActive) {
            const btn = document.createElement('button');
            btn.className = 'dashboard-nav dynamic-nav';
            btn.type = 'button';
            btn.dataset.section = 'content-section'; 
            btn.innerHTML = `<i class="fa-solid fa-folder-open"></i><span>${escapeHtml(tab.name)}</span>`;
            elements.dynamicSidebarTabs.appendChild(btn);
        }

        list.innerHTML += `
            <tr>
                <td>${escapeHtml(tab.name)} ${!tab.isActive ? '<span class="status-badge status-banned">معطل</span>' : ''}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="toggleTabStatus('${tab.id}')" title="${tab.isActive ? 'تعطيل' : 'تفعيل'}"><i class="fa-solid ${tab.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                        <button class="action-btn delete" onclick="deleteTab('${tab.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

window.toggleTabStatus = async (id) => {
    const tab = dashboardState.tabs.find(t => t.id === id);
    if (!tab) return;
    await dashboardDb.ref(`dynamic_tabs/${id}`).update({ isActive: !tab.isActive });
    await logActivity('تعديل تاب', `تم ${tab.isActive ? 'تعطيل' : 'تفعيل'} تاب`);
    showToast('تم تحديث حالة التاب');
};

window.deleteTab = async (id) => {
    const tab = dashboardState.tabs.find(t => t.id === id);
    if (!tab) return;
    if (!confirm(`هل أنت متأكد من حذف تاب "${tab.name}"؟`)) return;
    await dashboardDb.ref(`dynamic_tabs/${id}`).remove();
    await logActivity('حذف تاب', `تم حذف تاب باسم: ${tab.name}`);
    showToast('تم الحذف بنجاح');
};

// ==========================================
// Tab 3: Categories
// ==========================================
function updateCategoryTabSelect() {
    let select = document.getElementById('category-parent-tab');
    const formWrap = document.getElementById('add-category-form');
    if (!formWrap) return;

    if (!select) {
        select = document.createElement('select');
        select.id = 'category-parent-tab';
        select.className = 'dashboard-select';
        select.required = true;
        formWrap.insertBefore(select, formWrap.firstChild);
    }
    
    select.innerHTML = '<option value="" disabled selected>اختر التاب التابع له...</option>';
    dashboardState.tabs.filter(t => t.isActive).forEach(tab => {
        select.innerHTML += `<option value="${tab.id}">${escapeHtml(tab.name)}</option>`;
    });
}

document.getElementById('add-category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-category-name').value.trim();
    const tabId = document.getElementById('category-parent-tab').value;
    
    if (!name || !tabId) {
        showToast('يجب اختيار تاب وإدخال اسم القسم', 'error');
        return;
    }

    await dashboardDb.ref('categories').push({ name, tabId, isActive: true, createdAt: firebase.database.ServerValue.TIMESTAMP });
    await logActivity('إضافة قسم', `إضافة قسم جديد "${name}"`);
    showToast('تمت إضافة القسم');
    e.target.reset();
});

function renderCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    list.innerHTML = '';
    
    dashboardState.categories.forEach(cat => {
        const parentTab = dashboardState.tabs.find(t => t.id === cat.tabId);
        // حساب عدد المنشورات الموجودة بداخل القسم
        const postCount = dashboardState.posts.filter(p => p.categoryId === cat.id).length;

        list.innerHTML += `
            <tr>
                <td>
                    <strong>${escapeHtml(cat.name)}</strong>
                    <div class="text-muted text-small">تابع لـ: ${escapeHtml(parentTab?.name || 'غير محدد')}</div>
                </td>
                <td><span class="status-badge status-pending">${postCount} منشور</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="toggleCategory('${cat.id}')"><i class="fa-solid ${cat.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                        <button class="action-btn delete" onclick="deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

window.toggleCategory = async (id) => {
    const cat = dashboardState.categories.find(c => c.id === id);
    if (!cat) return;
    await dashboardDb.ref(`categories/${id}`).update({ isActive: !cat.isActive });
    await logActivity('تعديل قسم', `تعديل حالة قسم`);
};

window.deleteCategory = async (id) => {
    const cat = dashboardState.categories.find(c => c.id === id);
    if (!cat) return;
    if (!confirm('تأكيد حذف القسم؟ قد يؤثر ذلك على المنشورات المرتبطة به.')) return;
    await dashboardDb.ref(`categories/${id}`).remove();
    await logActivity('حذف قسم', `حذف قسم: ${cat.name}`);
};

// ==========================================
// Tab 4: Content (المحتوى) - NEW
// ==========================================
document.getElementById('btn-show-add-post')?.addEventListener('click', () => {
    const panel = document.getElementById('add-post-panel');
    if (panel) panel.hidden = false;
});

document.getElementById('btn-cancel-post')?.addEventListener('click', () => {
    const panel = document.getElementById('add-post-panel');
    const form = document.getElementById('add-post-form');
    if (panel) panel.hidden = true;
    if (form) form.reset();
});

function updatePostCategorySelect() {
    const select = document.getElementById('post-category');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>اختر القسم...</option>';
    dashboardState.categories.filter(c => c.isActive).forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
    });
}

document.getElementById('add-post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value.trim();
    const categoryId = document.getElementById('post-category').value;
    const imageUrl = document.getElementById('post-image-url').value.trim();
    const body = document.getElementById('post-body').value.trim();
    const isActive = document.getElementById('post-status-active').checked;
    
    if (!title || !categoryId || !body) {
        showToast('برجاء إكمال البيانات المطلوبة', 'error');
        return;
    }

    const newPost = {
        title,
        categoryId,
        imageUrl,
        body,
        isActive,
        views: 0,
        authorId: dashboardState.user.uid,
        authorName: dashboardState.profile?.name || 'الإدارة',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    await dashboardDb.ref('posts').push(newPost);
    await logActivity('نشر محتوى', `تم إضافة منشور جديد: ${title}`);
    
    showToast('تم حفظ ونشر المحتوى بنجاح');
    e.target.reset();
    document.getElementById('add-post-panel').hidden = true;
});

function renderPosts(filter = '') {
    const list = document.getElementById('content-list');
    if (!list) return;
    list.innerHTML = '';
    
    const filteredPosts = dashboardState.posts.filter(p => (p.title || '').includes(filter));
    
    filteredPosts.forEach(post => {
        const cat = dashboardState.categories.find(c => c.id === post.categoryId);
        list.innerHTML += `
            <tr>
                <td><strong>${escapeHtml(post.title)}</strong></td>
                <td>${escapeHtml(cat?.name || 'غير محدد')}</td>
                <td>${post.views || 0}</td>
                <td>${formatDate(post.createdAt)}</td>
                <td><span class="status-badge ${post.isActive ? 'status-active' : 'status-banned'}">${post.isActive ? 'منشور' : 'مخفي'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="togglePost('${post.id}')" title="${post.isActive ? 'إخفاء' : 'إظهار'}"><i class="fa-solid ${post.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                        <button class="action-btn delete" onclick="deletePost('${post.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

document.getElementById('search-content')?.addEventListener('input', (e) => renderPosts(e.target.value));

window.togglePost = async (id) => {
    const post = dashboardState.posts.find(p => p.id === id);
    if (!post) return;
    await dashboardDb.ref(`posts/${id}`).update({ isActive: !post.isActive });
    await logActivity('تعديل محتوى', `تم تغيير حالة المنشور`);
};

window.deletePost = async (id) => {
    const post = dashboardState.posts.find(p => p.id === id);
    if (!post) return;
    if (!confirm('تأكيد حذف المنشور نهائياً؟')) return;
    await dashboardDb.ref(`posts/${id}`).remove();
    await logActivity('حذف محتوى', `تم حذف منشور: ${post.title}`);
    showToast('تم حذف المنشور بنجاح');
};


// ==========================================
// Tab 5: Employees
// ==========================================
document.getElementById('add-employee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('emp-name').value.trim();
    const phone = document.getElementById('emp-phone').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    
    const perms = Array.from(document.querySelectorAll('#add-employee-form input[type="checkbox"]:checked')).map(cb => cb.value);

    await dashboardDb.ref('employees').push({
        name, phone, email, permissions: perms, isActive: true, role: 'employee', createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    await logActivity('إضافة موظف', `إنشاء حساب موظف: ${name}`);
    showToast('تمت إضافة بيانات الموظف بنجاح');
    e.target.reset();
});

function renderEmployees(filter = '') {
    const list = document.getElementById('employees-list');
    if (!list) return;
    list.innerHTML = '';
    const emps = dashboardState.employees.filter(e => (e.name || '').includes(filter) || (e.phone || '').includes(filter));
    
    emps.forEach(emp => {
        list.innerHTML += `
            <tr>
                <td><strong>${escapeHtml(emp.name)}</strong></td>
                <td>${escapeHtml(emp.email)}</td>
                <td>${escapeHtml(emp.phone)}</td>
                <td><span class="status-badge ${emp.isActive ? 'status-active' : 'status-banned'}">${emp.isActive ? 'نشط' : 'معطل'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="toggleEmployee('${emp.id}')"><i class="fa-solid fa-power-off"></i></button>
                        <button class="action-btn delete" onclick="deleteEmployee('${emp.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}
document.getElementById('search-employee')?.addEventListener('input', (e) => renderEmployees(e.target.value));

window.toggleEmployee = async (id) => {
    const emp = dashboardState.employees.find(e => e.id === id);
    if (!emp) return;
    await dashboardDb.ref(`employees/${id}`).update({ isActive: !emp.isActive });
    await logActivity('تعديل موظف', `تغيير حالة الموظف`);
};

window.deleteEmployee = async (id) => {
    const emp = dashboardState.employees.find(e => e.id === id);
    if (!emp) return;
    if (!confirm('حذف الموظف نهائياً؟')) return;
    await dashboardDb.ref(`employees/${id}`).remove();
    await logActivity('حذف موظف', `حذف الموظف: ${emp.name}`);
};

// ==========================================
// Tab 6: Members
// ==========================================
function renderMembers(filter = '') {
    const list = document.getElementById('members-list');
    if (!list) return;
    list.innerHTML = '';
    const mems = dashboardState.members.filter(m => (m.name || '').includes(filter) || (m.phone || '').includes(filter));
    
    mems.forEach(m => {
        list.innerHTML += `
            <tr>
                <td><strong>${escapeHtml(m.name || 'مستخدم')}</strong><br><span class="text-small text-muted">${escapeHtml(m.phone || m.email)}</span></td>
                <td>${formatDate(m.createdAt)}</td>
                <td>${m.postCount || 0}</td>
                <td><span class="status-badge ${m.isBanned ? 'status-banned' : 'status-active'}">${m.isBanned ? 'محظور' : 'نشط'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn ban" onclick="toggleBan('${m.id}')" title="${m.isBanned ? 'إلغاء الحظر' : 'حظر'}"><i class="fa-solid fa-ban"></i></button>
                        <button class="action-btn delete" onclick="deleteMember('${m.id}')" title="حذف العضو"><i class="fa-solid fa-user-xmark"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}
document.getElementById('search-member')?.addEventListener('input', (e) => renderMembers(e.target.value));

window.toggleBan = async (id) => {
    const mem = dashboardState.members.find(m => m.id === id);
    if (!mem) return;
    await dashboardDb.ref(`users/${id}`).update({ isBanned: !mem.isBanned });
    await logActivity('تعديل عضو', `تم ${!mem.isBanned ? 'حظر' : 'إلغاء حظر'} العضو ${id}`);
};

window.deleteMember = async (id) => {
    if (!confirm('تحذير: سيتم مسح بيانات العضو الأساسية من قاعدة البيانات. هل أنت متأكد؟')) return;
    await dashboardDb.ref(`users/${id}`).remove();
    await logActivity('حذف عضو', `تم مسح بيانات العضو ${id} نهائياً`);
    showToast('تم حذف بيانات العضو');
};

// ==========================================
// Tab 7: Complaints
// ==========================================
function renderComplaints() {
    const list = document.getElementById('complaints-list');
    if (!list) return;
    list.innerHTML = '';
    dashboardState.complaints.forEach(comp => {
        list.innerHTML += `
            <tr>
                <td>${escapeHtml(comp.authorName || 'عضو')}</td>
                <td>${escapeHtml(comp.issueType || 'مشكلة فنية')}</td>
                <td>${formatDate(comp.createdAt)}</td>
                <td><span class="status-badge ${comp.status === 'resolved' ? 'status-active' : 'status-pending'}">${comp.status === 'resolved' ? 'محلولة' : 'قيد المراجعة'}</span></td>
                <td>
                    <div class="flex-gap">
                        <button class="action-btn view" onclick="viewComplaint('${comp.id}')"><i class="fa-solid fa-eye"></i></button>
                        <select class="dashboard-select" style="padding: 5px; width: 130px; font-size: 11px;" onchange="resolveComplaint('${comp.id}', this)">
                            <option value="" disabled selected>تحديث الحالة...</option>
                            <option value="تم حل المشكلة بنجاح">تم الحل</option>
                            <option value="تم تعديل البيانات">تم التعديل</option>
                            <option value="تم الحذف">تم الحذف</option>
                            <option value="لا يوجد مشكلة فنية">لا توجد مشكلة</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    });
}

window.viewComplaint = (id) => {
    const comp = dashboardState.complaints.find(c => c.id === id);
    if (comp) {
        alert(`تفاصيل البلاغ:\n${comp.details || 'لا توجد تفاصيل إضافية'}`);
    }
};

window.resolveComplaint = async (compId, selectElement) => {
    const resolutionMsg = selectElement.value;
    if (!resolutionMsg) return;
    const comp = dashboardState.complaints.find(c => c.id === compId);
    if (!comp) return;

    await dashboardDb.ref(`complaints/${compId}`).update({ status: 'resolved', resolution: resolutionMsg });
    
    if (comp.authorId) {
        await dashboardDb.ref(`user_notifications/${comp.authorId}`).push({
            title: 'تحديث بخصوص بلاغك',
            body: `الرد الإداري: ${resolutionMsg}`,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    await logActivity('معالجة شكوى', `تم معالجة شكوى برسالة: ${resolutionMsg}`);
    showToast('تمت معالجة الشكوى وإرسال إشعار للعضو');
};

// ==========================================
// Tab 8: Notifications
// ==========================================
document.getElementById('notif-target')?.addEventListener('change', (e) => {
    const wrap = document.getElementById('notif-uid-wrap');
    if (wrap) wrap.hidden = e.target.value !== 'specific';
});

document.getElementById('send-notification-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = document.getElementById('notif-target').value;
    const uid = document.getElementById('notif-uid').value.trim();
    const msg = document.getElementById('notif-message').value.trim();

    const notifObj = { message: msg, createdAt: firebase.database.ServerValue.TIMESTAMP, target: target === 'all' ? 'الجميع' : uid };
    await dashboardDb.ref('admin_notifications').push(notifObj);
    
    if(target === 'all') {
        await dashboardDb.ref('global_notifications').push({ title: 'إشعار إداري', body: msg, createdAt: firebase.database.ServerValue.TIMESTAMP });
    } else if(uid) {
        await dashboardDb.ref(`user_notifications/${uid}`).push({ title: 'إشعار إداري', body: msg, createdAt: firebase.database.ServerValue.TIMESTAMP });
    }

    await logActivity('إرسال إشعار', `إرسال إشعار لـ ${target === 'all' ? 'الجميع' : uid}`);
    showToast('تم إرسال الإشعار');
    e.target.reset();
});

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    list.innerHTML = '';
    dashboardState.notifications.forEach(n => {
        list.innerHTML += `
            <tr>
                <td>${escapeHtml(n.target)}</td>
                <td>${escapeHtml(n.message)}</td>
                <td>${formatDate(n.createdAt)}</td>
                <td><button class="action-btn delete" onclick="deleteNotification('${n.id}')"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
}

window.deleteNotification = async (id) => {
    await dashboardDb.ref(`admin_notifications/${id}`).remove();
    showToast('تم حذف الإشعار من السجل');
};

document.getElementById('delete-all-notifs')?.addEventListener('click', async () => {
    if(!confirm('مسح جميع سجل الإشعارات؟')) return;
    await dashboardDb.ref('admin_notifications').remove();
    showToast('تم تفريغ السجل');
});

// ==========================================
// Tab 9: Activity Logs
// ==========================================
function renderLogs() {
    const list = document.getElementById('activity-list');
    const empSelect = document.getElementById('log-emp-filter');
    if (!list || !empSelect) return;
    
    list.innerHTML = '';
    
    if (empSelect.options.length <= 1) {
        const uniqueAdmins = [...new Set(dashboardState.logs.map(l => l.adminName).filter(Boolean))];
        uniqueAdmins.forEach(admin => {
            empSelect.innerHTML += `<option value="${escapeHtml(admin)}">${escapeHtml(admin)}</option>`;
        });
    }

    const dateFilter = document.getElementById('log-date-filter').value;
    const empFilter = empSelect.value;

    const filteredLogs = dashboardState.logs.filter(log => {
        let matchDate = true;
        if(dateFilter) {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            matchDate = logDate === dateFilter;
        }
        const matchEmp = empFilter === 'all' || log.adminName === empFilter;
        return matchDate && matchEmp;
    });

    filteredLogs.forEach(log => {
        list.innerHTML += `
            <tr>
                <td><strong>${escapeHtml(log.adminName)}</strong></td>
                <td><span class="status-badge status-pending">${escapeHtml(log.action)}</span></td>
                <td>${escapeHtml(log.details)}</td>
                <td>${formatDate(log.timestamp)}</td>
            </tr>
        `;
    });
}

document.getElementById('log-date-filter')?.addEventListener('change', renderLogs);
document.getElementById('log-emp-filter')?.addEventListener('change', renderLogs);

document.getElementById('archive-logs')?.addEventListener('click', async () => {
    if(!confirm('سيتم مسح السجل الحالي نهائياً (أرشفة). هل أنت متأكد؟')) return;
    await dashboardDb.ref('activity_logs').remove();
    showToast('تمت الأرشفة بنجاح');
});

document.getElementById('export-excel')?.addEventListener('click', () => {
    let csv = '\uFEFFالموظف,الإجراء,التفاصيل,التاريخ\n';
    dashboardState.logs.forEach(log => {
        csv += `"${escapeHtml(log.adminName)}","${escapeHtml(log.action)}","${escapeHtml(log.details)}","${new Date(log.timestamp).toLocaleString('ar-EG')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "activity_logs.csv";
    link.click();
});

document.getElementById('export-pdf')?.addEventListener('click', () => {
    window.print();
});

// ==========================================
// Tab 10: Settings
// ==========================================
function populateSettings() {
    const s = dashboardState.settings;
    if(!s) return;
    const bindVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const bindCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    bindVal('setting-site-name', s.siteName || '');
    bindCheck('setting-maintenance', s.maintenanceMode || false);
    bindVal('setting-maintenance-msg', s.maintenanceMsg || '');
    
    bindCheck('setting-contact-enable', s.enableContact ?? true);
    bindCheck('setting-terms-enable', s.enableTerms ?? true);
    
    bindCheck('setting-footer-visitors', s.showFooterVisitors ?? false);
    bindCheck('setting-footer-members', s.showFooterMembers ?? false);
    bindCheck('setting-report-issue', s.enableReporting ?? true);
    
    bindVal('setting-social-fb', s.socialFb || '');
    bindVal('setting-social-ig', s.socialIg || '');
    bindVal('setting-social-tt', s.socialTt || '');
    bindCheck('setting-social-enable', s.enableSocial ?? true);
}

document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const getCheck = (id) => document.getElementById(id)?.checked || false;

    const settings = {
        siteName: getVal('setting-site-name'),
        maintenanceMode: getCheck('setting-maintenance'),
        maintenanceMsg: getVal('setting-maintenance-msg'),
        
        enableContact: getCheck('setting-contact-enable'),
        enableTerms: getCheck('setting-terms-enable'),
        
        showFooterVisitors: getCheck('setting-footer-visitors'),
        showFooterMembers: getCheck('setting-footer-members'),
        enableReporting: getCheck('setting-report-issue'),
        
        socialFb: getVal('setting-social-fb'),
        socialIg: getVal('setting-social-ig'),
        socialTt: getVal('setting-social-tt'),
        enableSocial: getCheck('setting-social-enable')
    };

    await dashboardDb.ref('settings').set(settings);
    await logActivity('تعديل إعدادات', 'تم تحديث الإعدادات العامة للموقع');
    showToast('تم حفظ الإعدادات بنجاح');
});

// ==========================================
// Core Events & Initialization
// ==========================================
if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', () => dashboardAuth.signOut());

if (elements.sidebar) {
    elements.sidebar.addEventListener('click', (e) => {
        const btn = e.target.closest('.dashboard-nav');
        if (!btn) return;
        const targetSection = btn.dataset.section;
        if (targetSection) activateSection(targetSection);
    });
}

dashboardAuth.onAuthStateChanged(async (user) => {
    if (!user) {
        if (elements.loginScreen) elements.loginScreen.hidden = false;
        if (elements.app) elements.app.hidden = true;
        dashboardState.user = null;
        return;
    }
    try {
        const snap = await dashboardDb.ref(`users/${user.uid}`).once('value');
        const profile = snap.val() || {};
        
        if (profile.role !== 'admin' && profile.role !== 'employee') {
            await dashboardAuth.signOut();
            return;
        }

        dashboardState.user = user;
        dashboardState.profile = profile;
        if (elements.userName) elements.userName.textContent = profile.name || user.email;
        
        if (elements.loginScreen) elements.loginScreen.hidden = true;
        if (elements.app) elements.app.hidden = false;
        
        activateSection('statistics-section');
        initDashboardData();
        
    } catch (error) {
        console.error('Auth check error:', error);
        await dashboardAuth.signOut();
    }
});
