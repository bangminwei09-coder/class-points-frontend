// API 配置
const API_CONFIG = {
    baseURL: 'https://class-points-backend-production.up.railway.app/api', // 等你获取Railway地址后替换
    timeout: 30000
};

// API 请求封装
class API {
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    static setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    static removeToken() {
        localStorage.removeItem('auth_token');
    }

    static async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
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
            headers,
            timeout: API_CONFIG.timeout
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Token 过期，自动登出
                if (response.status === 401) {
                    this.removeToken();
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

    static get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// ==================== 认证 API ====================
class AuthAPI {
    static async register(username, password, className, email) {
        const response = await API.post('/auth/register', {
            username,
            password,
            className,
            email
        });
        if (response.success && response.data.token) {
            API.setToken(response.data.token);
        }
        return response;
    }

    static async login(username, password) {
        const response = await API.post('/auth/login', {
            username,
            password
        });
        if (response.success && response.data.token) {
            API.setToken(response.data.token);
        }
        return response;
    }

    static async getMe() {
        return await API.get('/auth/me');
    }

    static async changePassword(oldPassword, newPassword) {
        return await API.put('/auth/change-password', {
            oldPassword,
            newPassword
        });
    }

    static async updateProfile(data) {
        return await API.put('/auth/profile', data);
    }

    static logout() {
        API.removeToken();
    }
}

// ==================== 学生 API ====================
class StudentAPI {
    static async getAll() {
        return await API.get('/students');
    }

    static async getById(id) {
        return await API.get(`/students/${id}`);
    }

    static async create(studentData) {
        return await API.post('/students', studentData);
    }

    static async batchCreate(students) {
        return await API.post('/students/batch', { students });
    }

    static async update(id, studentData) {
        return await API.put(`/students/${id}`, studentData);
    }

    static async adjustPoints(id, points, reason, type) {
        return await API.post(`/students/${id}/points`, {
            points,
            reason,
            type
        });
    }

    static async batchAdjustPoints(studentIds, points, reason, type) {
        return await API.post('/students/batch/points', {
            studentIds,
            points,
            reason,
            type
        });
    }

    static async delete(id) {
        return await API.delete(`/students/${id}`);
    }

    static async batchDelete(studentIds) {
        return await API.post('/students/batch/delete', { studentIds });
    }
}

// ==================== 小组 API ====================
class GroupAPI {
    static async getAll() {
        return await API.get('/groups');
    }

    static async create(groupData) {
        return await API.post('/groups', groupData);
    }

    static async update(id, groupData) {
        return await API.put(`/groups/${id}`, groupData);
    }

    static async delete(id) {
        return await API.delete(`/groups/${id}`);
    }
}

// ==================== 规则 API ====================
class RuleAPI {
    static async getAll() {
        return await API.get('/rules');
    }

    static async create(ruleData) {
        return await API.post('/rules', ruleData);
    }

    static async update(id, ruleData) {
        return await API.put(`/rules/${id}`, ruleData);
    }

    static async delete(id) {
        return await API.delete(`/rules/${id}`);
    }
}

// ==================== 商城 API ====================
class ShopAPI {
    static async getAll() {
        return await API.get('/shop');
    }

    static async create(itemData) {
        return await API.post('/shop', itemData);
    }

    static async update(id, itemData) {
        return await API.put(`/shop/${id}`, itemData);
    }

    static async delete(id) {
        return await API.delete(`/shop/${id}`);
    }
}

// ==================== 数据 API ====================
class DataAPI {
    static async export() {
        return await API.get('/data/export');
    }

    static async import(data, replaceExisting = false) {
        return await API.post('/data/import', {
            ...data,
            replaceExisting
        });
    }

    static async getStatistics() {
        return await API.get('/data/statistics');
    }
}

// 导出所有 API
window.AuthAPI = AuthAPI;
window.StudentAPI = StudentAPI;
window.GroupAPI = GroupAPI;
window.RuleAPI = RuleAPI;
window.ShopAPI = ShopAPI;
window.DataAPI = DataAPI;
