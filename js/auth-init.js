// 认证初始化脚本 - 在页面加载时注入登录界面
(function() {
  'use strict';

  const API_BASE = 'https://class-points-backend-production.up.railway.app/api';

  // 辅助函数
  function showAuthError(msg) {
    const errorEl = document.getElementById('authError');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  function hideAuthError() {
    const errorEl = document.getElementById('authError');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  function showAuthLoading() {
    const loading = document.getElementById('authLoading');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loading) loading.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
  }

  function hideAuthLoading() {
    const loading = document.getElementById('authLoading');
    if (loading) loading.style.display = 'none';
  }

  function showMainApp() {
    const overlay = document.getElementById('authOverlay');
    const mainApp = document.getElementById('mainApp');
    if (overlay) overlay.classList.add('hidden');
    if (mainApp) mainApp.classList.add('show');
  }

  // 全局函数 - 登录注册界面切换
  window.showAuthLogin = function() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    tabs[0].classList.add('active');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    hideAuthError();
  };

  window.showAuthRegister = function() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    tabs[1].classList.add('active');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    hideAuthError();
  };

  // 创建登录界面HTML
  function createAuthOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.innerHTML = `
      <div class="auth-card">
        <h1 class="auth-title">📚 班级积分管理系统</h1>
        <p class="auth-subtitle">教师登录 · 云端同步</p>

        <div class="auth-tabs">
          <div class="auth-tab active" onclick="window.showAuthLogin()">登录</div>
          <div class="auth-tab" onclick="window.showAuthRegister()">注册</div>
        </div>

        <div class="auth-error" id="authError"></div>
        <div class="auth-loading" id="authLoading">
          <div class="auth-spinner"></div>
          <p style="margin-top: 10px; color: #666;">加载中...</p>
        </div>

        <form id="loginForm" onsubmit="window.handleAuthLogin(event); return false;">
          <div class="auth-form-group">
            <label class="auth-label">用户名</label>
            <input type="text" class="auth-input" id="loginUsername" required placeholder="请输入用户名">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">密码</label>
            <input type="password" class="auth-input" id="loginPassword" required placeholder="请输入密码">
          </div>
          <button type="submit" class="auth-btn">登录</button>
          <p class="auth-hint">💡 提示：数据保存在云端，可在任何设备访问</p>
        </form>

        <form id="registerForm" onsubmit="window.handleAuthRegister(event); return false;">
          <div class="auth-form-group">
            <label class="auth-label">用户名</label>
            <input type="text" class="auth-input" id="regUsername" required placeholder="请输入用户名">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">密码</label>
            <input type="password" class="auth-input" id="regPassword" required placeholder="请输入密码（至少6位）" minlength="6">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">班级名称</label>
            <input type="text" class="auth-input" id="regClassName" required placeholder="例如：四年级三班">
          </div>
          <div class="auth-form-group">
            <label class="auth-label">邮箱（选填）</label>
            <input type="email" class="auth-input" id="regEmail" placeholder="用于找回密码">
          </div>
          <button type="submit" class="auth-btn">注册</button>
          <p class="auth-hint">💡 注册后即可开始使用云端同步功能</p>
        </form>
      </div>
    `;
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  // 创建主应用容器
  function createMainAppContainer() {
    const mainApp = document.createElement('div');
    mainApp.id = 'mainApp';
    
    // 将body的所有子元素（除了authOverlay）移到mainApp中
    const children = Array.from(document.body.children);
    children.forEach(child => {
      if (child.id !== 'authOverlay') {
        mainApp.appendChild(child);
      }
    });
    
    document.body.appendChild(mainApp);
  }



  // 登录处理
  window.handleAuthLogin = async function(e) {
    e.preventDefault();
    hideAuthError();
    showAuthLoading();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_info', JSON.stringify(data.data.user));
        
        console.log('✅ 登录成功，正在加载数据...');
        showMainApp();
        
        // 触发数据加载
        if (window.cloudStorage) {
          await window.cloudStorage.initCloudData();
        }
      } else {
        hideAuthLoading();
        window.showAuthLogin();
        showAuthError(data.message || '登录失败');
      }
    } catch (error) {
      hideAuthLoading();
      window.showAuthLogin();
      showAuthError('网络错误，请检查连接');
      console.error('Login error:', error);
    }
  };

  // 注册处理
  window.handleAuthRegister = async function(e) {
    e.preventDefault();
    hideAuthError();
    showAuthLoading();

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const className = document.getElementById('regClassName').value;
    const email = document.getElementById('regEmail').value;

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, className, email })
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_info', JSON.stringify(data.data.user));
        
        console.log('✅ 注册成功，正在加载数据...');
        showMainApp();
        
        // 触发数据加载
        if (window.cloudStorage) {
          await window.cloudStorage.initCloudData();
        }
      } else {
        hideAuthLoading();
        window.showAuthRegister();
        showAuthError(data.message || '注册失败');
      }
    } catch (error) {
      hideAuthLoading();
      window.showAuthRegister();
      showAuthError('网络错误，请检查连接');
      console.error('Register error:', error);
    }
  };

  // 检查登录状态
  async function checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ 已登录，用户:', data.data.username);
          showMainApp();
          
          // 触发数据加载
          if (window.cloudStorage) {
            await window.cloudStorage.initCloudData();
          }
          return true;
        }
      } catch (error) {
        console.error('验证token失败:', error);
      }
      
      // Token无效，清除
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    }
    return false;
  }

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      console.log('🚀 认证系统初始化...');
      createAuthOverlay();
      createMainAppContainer();
      await checkAuthStatus();
    });
  } else {
    (async () => {
      console.log('🚀 认证系统初始化...');
      createAuthOverlay();
      createMainAppContainer();
      await checkAuthStatus();
    })();
  }

  console.log('✅ 认证初始化脚本已加载');
})();
