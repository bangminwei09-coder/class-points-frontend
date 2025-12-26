class Utils {
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.innerHTML = `
            <span class="toast-icon">${Utils.getToastIcon(type)}</span>
            <div class="toast-content">${message}</div>
            <button class="toast-close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Force reflow to enable animation
        void toast.offsetWidth;

        toast.style.setProperty('--toast-duration', `${duration / 1000}s`);
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => Utils.hideToast(toast));

        setTimeout(() => Utils.hideToast(toast), duration);
    }

    static hideToast(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }

    static getToastIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '';
        }
    }

    static generateDefaultAvatar(name = '') {
        const firstLetter = name ? name.charAt(0).toUpperCase() : '?';
        const colors = [
            { bg: '#EF4444', text: '#FEE2E2' }, // Red
            { bg: '#F97316', text: '#FFEDD5' }, // Orange
            { bg: '#F59E0B', text: '#FFFBEB' }, // Amber
            { bg: '#EAB308', text: '#FEFCE8' }, // Yellow
            { bg: '#84CC16', text: '#F7FEE7' }, // Lime
            { bg: '#22C55E', text: '#ECFDF5' }, // Green
            { bg: '#10B981', text: '#D1FAE5' }, // Emerald
            { bg: '#06B6D4', text: '#ECFEFF' }, // Cyan
            { bg: '#0EA5E9', text: '#E0F7FA' }, // Light Blue
            { bg: '#3B82F6', text: '#DBEAFE' }, // Blue
            { bg: '#6366F1', text: '#EEF2FF' }, // Indigo
            { bg: '#8B5CF6', text: '#F5F3FF' }, // Violet
            { bg: '#D946EF', text: '#FAE8FF' }, // Fuchsia
            { bg: '#EC4899', text: '#FDF2F8' }, // Pink
            { bg: '#F43F5E', text: '#FEF2F2' }  // Rose
        ];
        let colorIndex = 0;
        if (name) {
            for (let i = 0; i < name.length; i++) {
                colorIndex += name.charCodeAt(i);
            }
            colorIndex = colorIndex % colors.length;
        }
        const color = colors[colorIndex];
        const svg = `
            <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="200" height="200" fill="${color.bg}"/>
                <text
                    x="100"
                    y="100"
                    font-family="Arial, sans-serif"
                    font-size="80"
                    font-weight="bold"
                    fill="${color.text}"
                    text-anchor="middle"
                    dominant-baseline="central">
                    ${firstLetter}
                </text>
            </svg>
        `.trim();
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    static getSafeAvatarUrl(avatarUrl, name = '') {
        if (avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) && avatarUrl !== 'null') {
            return avatarUrl;
        }
        return this.generateDefaultAvatar(name);
    }

    static getFormattedDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
}
