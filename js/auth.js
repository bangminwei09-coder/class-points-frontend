// 简单的前端认证系统（方案二）
class AuthManager {
    static USERS_KEY = 'cpm_users';
    static CURRENT_USER_KEY = 'cpm_current_user';

    // 初始化认证系统
    static init() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            this.showLoginPage();
        } else {
            this.showMainApp();
        }
    }

    // 获取当前登录用户
    static getCurrentUser() {
        return localStorage.getItem(this.CURRENT_USER_KEY);
    }

    // 获取所有用户
    static getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : {};
    }

    // 保存用户
    static saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    // 注册新用户
    static register(username, password, className) {
        if (!username || !password) {
            Utils.showToast('用户名和密码不能为空！', 'error');
            return false;
        }

        const users = this.getUsers();
        if (users[username]) {
            Utils.showToast('用户名已存在！', 'error');
            return false;
        }

        // 简单的密码哈希（实际应用应使用更安全的方法）
        const hashedPassword = btoa(password); // Base64编码，仅作演示
        users[username] = {
            password: hashedPassword,
            className: className || '未命名班级',
            createdAt: new Date().toISOString()
        };

        this.saveUsers(users);
        Utils.showToast('注册成功！', 'success');
        return true;
    }

    // 登录
    static login(username, password) {
        const users = this.getUsers();
        const user = users[username];

        if (!user) {
            Utils.showToast('用户不存在！', 'error');
            return false;
        }

        const hashedPassword = btoa(password);
        if (user.password !== hashedPassword) {
            Utils.showToast('密码错误！', 'error');
            return false;
        }

        // 设置当前用户
        localStorage.setItem(this.CURRENT_USER_KEY, username);
        Utils.showToast(`欢迎回来，${username}！`, 'success');
        this.showMainApp();
        return true;
    }

    // 登出
    static logout() {
        UIManager.showModal(
            '确认退出',
            '确定要退出登录吗？',
            () => {
                localStorage.removeItem(this.CURRENT_USER_KEY);
                this.showLoginPage();
                Utils.showToast('已退出登录', 'info');
            }
        );
    }

    // 显示登录页面
    static showLoginPage() {
        document.getElementById('app').style.display = 'none';
        
        let loginContainer = document.getElementById('loginContainer');
        if (!loginContainer) {
            loginContainer = document.createElement('div');
            loginContainer.id = 'loginContainer';
            document.body.appendChild(loginContainer);
        }

        loginContainer.innerHTML = `
            <div class="login-wrapper">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-logo">📚</div>
                        <h1>班级积分管理系统</h1>
                        <p>教师登录</p>
                    </div>
                    
                    <div class="login-tabs">
                        <button class="tab-btn active" data-tab="login">登录</button>
                        <button class="tab-btn" data-tab="register">注册</button>
                    </div>

                    <!-- 登录表单 -->
                    <form id="loginForm" class="login-form active">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="loginUsername" class="form-control" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="loginPassword" class="form-control" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">登录</button>
                    </form>

                    <!-- 注册表单 -->
                    <form id="registerForm" class="login-form">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="registerUsername" class="form-control" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="registerPassword" class="form-control" placeholder="请输入密码" required>
                        </div>
                        <div class="form-group">
                            <label>确认密码</label>
                            <input type="password" id="registerPasswordConfirm" class="form-control" placeholder="请再次输入密码" required>
                        </div>
                        <div class="form-group">
                            <label>班级名称</label>
                            <input type="text" id="registerClassName" class="form-control" placeholder="例如：三年级1班" required>
                        </div>
                        <button type="submit" class="btn btn-success btn-block">注册</button>
                    </form>

                    <div class="login-footer">
                        <p>💡 提示：数据存储在本地浏览器，请勿清除浏览器数据</p>
                    </div>
                </div>
            </div>
        `;

        loginContainer.style.display = 'flex';
        this.bindLoginEvents();
    }

    // 显示主应用
    static showMainApp() {
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }
        document.getElementById('app').style.display = 'flex';
        
        // 更新用户信息显示
        this.updateUserInfo();
        
        // 重新加载当前用户的数据
        this.loadUserData();
    }

    // 更新用户信息显示
    static updateUserInfo() {
        const username = this.getCurrentUser();
        const users = this.getUsers();
        const user = users[username];
        
        // 在侧边栏添加用户信息
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter && user) {
            const userInfoHtml = `
                <div class="user-info">
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">${username}</div>
                        <div class="user-class">${user.className}</div>
                    </div>
                </div>
                <button class="btn btn-secondary btn-block" id="logoutBtn">
                    <span class="icon">🚪</span>退出登录
                </button>
            `;
            sidebarFooter.innerHTML = userInfoHtml + sidebarFooter.innerHTML;
            
            document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        }
    }

    // 加载用户数据（数据隔离）
    static loadUserData() {
        const username = this.getCurrentUser();
        if (!username) return;

        // 为每个用户创建独立的存储空间
        const userPrefix = `user_${username}_`;
        
        // 修改 StorageManager 使其支持用户前缀
        StorageManager.userPrefix = userPrefix;
        
        // 重新初始化所有管理器
        StudentManager.init();
        GroupManager.init();
        RankingManager.init();
        RulesManager.init();
        ShopManager.init();
        StatisticsManager.init();
    }

    // 绑定登录页面事件
    static bindLoginEvents() {
        // 切换登录/注册标签
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(`${tab}Form`).classList.add('active');
            });
        });

        // 登录表单提交
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            this.login(username, password);
        });

        // 注册表单提交
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
            const className = document.getElementById('registerClassName').value.trim();

            if (password !== passwordConfirm) {
                Utils.showToast('两次输入的密码不一致！', 'error');
                return;
            }

            if (this.register(username, password, className)) {
                // 注册成功后自动登录
                setTimeout(() => {
                    this.login(username, password);
                }, 500);
            }
        });
    }
}

// 修改 StorageManager 支持用户数据隔离
class StorageManagerWithAuth extends StorageManager {
    static userPrefix = '';

    static saveItem(key, value) {
        const fullKey = this.userPrefix + key;
        localStorage.setItem(fullKey, JSON.stringify(value));
    }

    static getItem(key, defaultValue) {
        const fullKey = this.userPrefix + key;
        const data = localStorage.getItem(fullKey);
        return data ? JSON.parse(data) : defaultValue;
    }

    static deleteItem(key) {
        const fullKey = this.userPrefix + key;
        localStorage.removeItem(fullKey);
    }
}

// 替换原有的 StorageManager
window.StorageManager = StorageManagerWithAuth;
