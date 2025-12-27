// 云端存储适配器 - 替代 localStorage
class CloudStorage {
  constructor() {
    this.API_BASE = 'https://class-points-backend-production.up.railway.app/api';
    this.token = localStorage.getItem('auth_token');
    this.cache = {}; // 本地缓存
  }

  // 获取 token
  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  // 设置 token
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // API 请求封装
  async request(endpoint, options = {}) {
    const url = `${this.API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token 过期，需要重新登录
          this.clearAuth();
          window.location.reload();
        }
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API 请求错误:', error);
      throw error;
    }
  }

  // 清除认证信息
  clearAuth() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  }

  // ==================== 学生管理 API ====================
  
  async getStudents() {
    try {
      const response = await this.request('/students', { method: 'GET' });
      if (response.success) {
        this.cache.students = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取学生列表失败:', error);
      return this.cache.students || [];
    }
  }

  async createStudent(studentData) {
    const response = await this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '创建学生失败');
  }

  async updateStudent(id, studentData) {
    const response = await this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '更新学生失败');
  }

  async deleteStudent(id) {
    const response = await this.request(`/students/${id}`, {
      method: 'DELETE'
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.message || '删除学生失败');
  }

  async batchDeleteStudents(studentIds) {
    const response = await this.request('/students/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ studentIds })
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.message || '批量删除失败');
  }

  async adjustPoints(studentId, points, reason, type = 'adjust') {
    const response = await this.request(`/students/${studentId}/points`, {
      method: 'POST',
      body: JSON.stringify({ points, reason, type })
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '积分调整失败');
  }

  async batchAdjustPoints(studentIds, points, reason, type = 'adjust') {
    const response = await this.request('/students/batch/points', {
      method: 'POST',
      body: JSON.stringify({ studentIds, points, reason, type })
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '批量调整失败');
  }

  // ==================== 小组管理 API ====================
  
  async getGroups() {
    try {
      const response = await this.request('/groups', { method: 'GET' });
      if (response.success) {
        this.cache.groups = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取小组列表失败:', error);
      return this.cache.groups || [];
    }
  }

  async createGroup(groupData) {
    const response = await this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '创建小组失败');
  }

  async updateGroup(id, groupData) {
    const response = await this.request(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '更新小组失败');
  }

  async deleteGroup(id) {
    const response = await this.request(`/groups/${id}`, {
      method: 'DELETE'
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.message || '删除小组失败');
  }

  // ==================== 规则管理 API ====================
  
  async getRules() {
    try {
      const response = await this.request('/rules', { method: 'GET' });
      if (response.success) {
        this.cache.rules = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取规则列表失败:', error);
      return this.cache.rules || [];
    }
  }

  async createRule(ruleData) {
    const response = await this.request('/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '创建规则失败');
  }

  async updateRule(id, ruleData) {
    const response = await this.request(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '更新规则失败');
  }

  async deleteRule(id) {
    const response = await this.request(`/rules/${id}`, {
      method: 'DELETE'
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.message || '删除规则失败');
  }

  // ==================== 商城管理 API ====================
  
  async getShopItems() {
    try {
      const response = await this.request('/shop', { method: 'GET' });
      if (response.success) {
        this.cache.shopItems = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return this.cache.shopItems || [];
    }
  }

  async createShopItem(itemData) {
    const response = await this.request('/shop', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '创建商品失败');
  }

  async updateShopItem(id, itemData) {
    const response = await this.request(`/shop/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '更新商品失败');
  }

  async deleteShopItem(id) {
    const response = await this.request(`/shop/${id}`, {
      method: 'DELETE'
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.message || '删除商品失败');
  }

  // ==================== 初始化数据加载 ====================
  
  async initCloudData() {
    console.log('🔄 正在从云端加载所有数据...');
    try {
      await Promise.all([
        this.getStudents(),
        this.getGroups(),
        this.getRules(),
        this.getShopItems()
      ]);
      console.log('✅ 云端数据初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 云端数据初始化失败:', error);
      return false;
    }
  }

  // ==================== 数据导入导出 API ====================
  
  async exportData() {
    try {
      const response = await this.request('/data/export', { method: 'GET' });
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('导出数据失败:', error);
      return null;
    }
  }

  async importData(data, replaceExisting = false) {
    const response = await this.request('/data/import', {
      method: 'POST',
      body: JSON.stringify({ ...data, replaceExisting })
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || '导入数据失败');
  }

  async getStatistics() {
    try {
      const response = await this.request('/data/statistics', { method: 'GET' });
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return null;
    }
  }
}

// 创建全局实例
window.cloudStorage = new CloudStorage();
