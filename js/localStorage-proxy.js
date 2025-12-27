// localStorage 代理 - 自动将localStorage操作转换为云端API调用
(function() {
  'use strict';

  const API_BASE = 'https://class-points-backend-production.up.railway.app/api';
  let authToken = localStorage.getItem('auth_token');
  let syncQueue = [];
  let isSyncing = false;

  // 云端数据缓存
  let cloudData = {
    students: [],
    groups: [],
    rules: [],
    shopItems: [],
    pointHistory: {},
    state: {}
  };

  // API请求封装
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.error('认证失败，需要重新登录');
          return null;
        }
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      return null;
    }
  }

  // 初始化 - 从云端加载数据
  async function initCloudData() {
    console.log('🔄 正在从云端加载数据...');
    
    try {
      // 加载学生数据
      const studentsRes = await apiRequest('/students');
      if (studentsRes && studentsRes.success) {
        cloudData.students = studentsRes.data;
        console.log('✅ 学生数据加载完成:', cloudData.students.length, '个学生');
      }

      // 加载小组数据
      const groupsRes = await apiRequest('/groups');
      if (groupsRes && groupsRes.success) {
        cloudData.groups = groupsRes.data;
        console.log('✅ 小组数据加载完成:', cloudData.groups.length, '个小组');
      }

      // 加载规则数据
      const rulesRes = await apiRequest('/rules');
      if (rulesRes && rulesRes.success) {
        cloudData.rules = rulesRes.data;
        console.log('✅ 规则数据加载完成:', cloudData.rules.length, '条规则');
      }

      // 加载商城数据
      const shopRes = await apiRequest('/shop');
      if (shopRes && shopRes.success) {
        cloudData.shopItems = shopRes.data;
        console.log('✅ 商城数据加载完成:', cloudData.shopItems.length, '个商品');
      }

      console.log('✅ 云端数据加载完成');
      return true;
    } catch (error) {
      console.error('❌ 云端数据加载失败:', error);
      return false;
    }
  }

  // 将云端数据转换为localStorage格式
  function convertCloudDataToLocalStorage() {
    // 转换学生数据
    const students = cloudData.students.map(s => ({
      id: s._id,
      name: s.name,
      points: s.points || 0,
      totalEarned: s.totalEarned || 0,
      group: s.group || '',
      avatar: s.avatar || '',
      avatarKey: s.avatarKey || '',
      createdAt: s.createdAt
    }));

    // 转换小组数据
    const groups = cloudData.groups.map(g => ({
      id: g._id,
      name: g.name,
      members: g.members || [],
      createdAt: g.createdAt
    }));

    // 转换规则数据
    const rules = cloudData.rules.map(r => ({
      id: r._id,
      name: r.name,
      points: r.points,
      description: r.description || '',
      createdAt: r.createdAt
    }));

    // 转换商城数据
    const shopItems = cloudData.shopItems.map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      stock: item.stock,
      description: item.description || '',
      createdAt: item.createdAt
    }));

    // 构建state对象
    const state = {
      students,
      groups,
      rules,
      history: []
    };

    return {
      state,
      shopItems,
      pointHistory: cloudData.pointHistory || {}
    };
  }

  // 拦截localStorage.setItem
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    console.log('📝 localStorage.setItem:', key);
    
    // 先保存到原始localStorage（作为缓存）
    originalSetItem(key, value);

    // 如果是重要数据，加入同步队列
    if (key.startsWith('cpm_state_') || 
        key === 'cpm_mall' || 
        key === 'cpm_point_history') {
      syncQueue.push({ key, value, action: 'set' });
      scheduleSyncToCloud();
    }
  };

  // 拦截localStorage.getItem
  const originalGetItem = localStorage.getItem.bind(localStorage);
  localStorage.getItem = function(key) {
    const value = originalGetItem(key);
    
    // 如果是state数据且云端有数据，优先返回云端数据
    if (key.startsWith('cpm_state_') && cloudData.state[key]) {
      return cloudData.state[key];
    }
    
    return value;
  };

  // 调度云端同步
  function scheduleSyncToCloud() {
    if (isSyncing || syncQueue.length === 0) return;

    // 防抖：500ms后执行同步
    setTimeout(() => {
      syncToCloud();
    }, 500);
  }

  // 同步到云端
  async function syncToCloud() {
    if (syncQueue.length === 0 || isSyncing) return;

    isSyncing = true;
    console.log('🔄 开始同步到云端...', syncQueue.length, '个变更');

    const batch = [...syncQueue];
    syncQueue = [];

    try {
      for (const item of batch) {
        await syncSingleItem(item);
      }
      console.log('✅ 云端同步完成');
    } catch (error) {
      console.error('❌ 云端同步失败:', error);
      // 失败的项目重新加入队列
      syncQueue.push(...batch);
    } finally {
      isSyncing = false;
    }
  }

  // 同步单个项目
  async function syncSingleItem(item) {
    const { key, value } = item;

    try {
      // 解析数据
      const data = JSON.parse(value);

      // 根据key类型决定同步方式
      if (key.startsWith('cpm_state_')) {
        // 状态数据：包含students, groups, rules
        await syncStateData(data);
      } else if (key === 'cpm_mall') {
        // 商城数据
        await syncMallData(data);
      } else if (key === 'cpm_point_history') {
        // 积分历史
        await syncPointHistory(data);
      }
    } catch (error) {
      console.error('同步项目失败:', key, error);
    }
  }

  // 同步状态数据
  async function syncStateData(state) {
    // 同步学生数据
    if (state.students && Array.isArray(state.students)) {
      for (const student of state.students) {
        // 检查是否是新学生或已更新
        const existing = cloudData.students.find(s => s._id === student.id);
        if (!existing) {
          // 新学生
          await apiRequest('/students', {
            method: 'POST',
            body: JSON.stringify({
              name: student.name,
              points: student.points || 0,
              group: student.group || ''
            })
          });
        } else {
          // 更新学生
          await apiRequest(`/students/${student.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: student.name,
              points: student.points || 0,
              group: student.group || ''
            })
          });
        }
      }
    }

    // 同步小组数据
    if (state.groups && Array.isArray(state.groups)) {
      for (const group of state.groups) {
        const existing = cloudData.groups.find(g => g._id === group.id);
        if (!existing) {
          await apiRequest('/groups', {
            method: 'POST',
            body: JSON.stringify({
              name: group.name,
              members: group.members || []
            })
          });
        } else {
          await apiRequest(`/groups/${group.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: group.name,
              members: group.members || []
            })
          });
        }
      }
    }

    // 同步规则数据
    if (state.rules && Array.isArray(state.rules)) {
      for (const rule of state.rules) {
        const existing = cloudData.rules.find(r => r._id === rule.id);
        if (!existing) {
          await apiRequest('/rules', {
            method: 'POST',
            body: JSON.stringify({
              name: rule.name,
              points: rule.points,
              description: rule.description || ''
            })
          });
        } else {
          await apiRequest(`/rules/${rule.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: rule.name,
              points: rule.points,
              description: rule.description || ''
            })
          });
        }
      }
    }
  }

  // 同步商城数据
  async function syncMallData(mallItems) {
    if (!Array.isArray(mallItems)) return;

    for (const item of mallItems) {
      const existing = cloudData.shopItems.find(s => s._id === item.id);
      if (!existing) {
        await apiRequest('/shop', {
          method: 'POST',
          body: JSON.stringify({
            name: item.name,
            price: item.price,
            stock: item.stock,
            description: item.description || ''
          })
        });
      } else {
        await apiRequest(`/shop/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: item.name,
            price: item.price,
            stock: item.stock,
            description: item.description || ''
          })
        });
      }
    }
  }

  // 同步积分历史
  async function syncPointHistory(history) {
    // 积分历史暂时保存在localStorage
    // 后续可以扩展后端API支持积分历史
    console.log('积分历史同步（暂存本地）');
  }

  // 页面加载时初始化
  window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 localStorage代理已启动');
    
    // 检查是否已登录
    if (authToken) {
      // 从云端加载数据
      const success = await initCloudData();
      if (success) {
        // 将云端数据写入localStorage
        const localData = convertCloudDataToLocalStorage();
        
        // 假设当前班级ID
        const classId = 'default';
        const stateKey = `cpm_state_${classId}`;
        
        originalSetItem(stateKey, JSON.stringify(localData.state));
        originalSetItem('cpm_mall', JSON.stringify(localData.shopItems));
        originalSetItem('cpm_point_history', JSON.stringify(localData.pointHistory));
        
        console.log('✅ 云端数据已同步到本地');
      }
    }
  });

  // 定期同步
  setInterval(() => {
    if (syncQueue.length > 0) {
      syncToCloud();
    }
  }, 5000); // 每5秒检查一次

  console.log('✅ localStorage云端代理已加载');
})();
