class AppManager {
    static currentPage = 'students';
    static currentTheme = 'light';

    static init() {
        this.loadSettings();
        this.setupEventListeners();
        this.renderInitialData();
        this.switchPage(this.currentPage);
    }

    static loadSettings() {
        this.currentTheme = StorageManager.getItem('theme', 'light');
        document.body.classList.toggle('dark-theme', this.currentTheme === 'dark');
    }

    static setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.switchPage(page);
            });
        });

        // Theme Toggle
        document.getElementById('toggleThemeBtn').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Student Page specific buttons
        document.getElementById('addStudentBtn').addEventListener('click', () => StudentManager.showAddDialog());
        document.getElementById('searchInput').addEventListener('input', () => StudentManager.handleSearch());
        document.getElementById('searchBtn').addEventListener('click', () => StudentManager.handleSearch());
        document.getElementById('batchDeleteBtn').addEventListener('click', () => StudentManager.handleBatchDelete());
        document.getElementById('batchAddPointsBtn').addEventListener('click', () => StudentManager.handleBatchAddPoints());
        document.getElementById('batchReducePointsBtn').addEventListener('click', () => StudentManager.handleBatchReducePoints());
        document.getElementById('toggleSelectAllBtn').addEventListener('click', () => StudentManager.toggleSelectAll());
        document.getElementById('projectionModeBtn').addEventListener('click', () => UIManager.enterProjectionMode(RankingManager.calculateRanking(StudentManager.students)));

        // Group Page specific buttons (addGroupBtn is handled in GroupManager.bindGroupCardEvents)

        // Points Rules Page specific buttons (addRuleBtn is handled in RulesManager.bindRuleEvents)

        // Shop Page specific buttons (addGoodBtn is handled in ShopManager.bindShopEvents)

        // Ranking Page specific buttons
        const totalRankingBtn = document.getElementById('totalRankingBtn');
        const progressRankingBtn = document.getElementById('progressRankingBtn');
        if (totalRankingBtn && progressRankingBtn) {
            totalRankingBtn.addEventListener('click', () => {
                totalRankingBtn.classList.add('btn-primary');
                totalRankingBtn.classList.remove('btn-secondary');
                progressRankingBtn.classList.add('btn-secondary');
                progressRankingBtn.classList.remove('btn-info');
                RankingManager.renderRankingList('total');
            });
            progressRankingBtn.addEventListener('click', () => {
                progressRankingBtn.classList.add('btn-info');
                progressRankingBtn.classList.remove('btn-secondary');
                totalRankingBtn.classList.add('btn-secondary');
                totalRankingBtn.classList.remove('btn-primary');
                RankingManager.renderRankingList('progress');
            });
        }

        // Import/Export Page specific buttons
        document.getElementById('exportStudentsJsonBtn').addEventListener('click', () => ExportManager.exportStudentsToJson());
        document.getElementById('exportGroupsJsonBtn').addEventListener('click', () => ExportManager.exportGroupsToJson());
        document.getElementById('exportAllDataJsonBtn').addEventListener('click', () => ExportManager.exportAllDataToJson());
        ImportManager.init(); // Initialize import events


        // Initialize managers
        StudentManager.init();
        GroupManager.init();
        RankingManager.init();
        RulesManager.init();
        ShopManager.init();
        StatisticsManager.init();
    }

    static renderInitialData() {
        // This will be called on app start for the initial active page
        // Other pages will render when navigated to.
    }

    static switchPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        // Deactivate all nav items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

        // Show the selected page and activate its nav item
        document.getElementById(`${page}Page`).classList.add('active');
        document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
        document.getElementById('currentPageTitle').textContent = document.querySelector(`.nav-item[data-page="${page}"] span:last-child`).textContent;

        this.currentPage = page;
        window.location.hash = page; // Update URL hash

        // Render content for the switched page
        switch (page) {
            case 'students':
                StudentManager.renderStudentList();
                StudentManager.updateBatchActionButtons();
                break;
            case 'groups':
                GroupManager.renderGroupList();
                break;
            case 'ranking':
                RankingManager.renderRankingList(); // 默认显示总积分榜
                break;
            case 'points':
                RulesManager.renderRulesList();
                break;
            case 'shop':
                ShopManager.renderGoodsList();
                break;
            case 'statistics':
                StatisticsManager.renderStatistics();
                break;
            case 'import-export':
                // ImportManager init is handled in setupEventListeners
                // ExportManager functions are called directly from buttons
                break;
            case 'settings':
                // SettingsManager.renderSettings(); // To be implemented
                break;
            default:
                break;
        }
    }

    static toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme', this.currentTheme === 'dark');
        StorageManager.saveItem('theme', this.currentTheme);
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // 先初始化认证系统
    AuthManager.init();
    
    // 只有登录后才初始化主应用
    const currentUser = AuthManager.getCurrentUser();
    if (currentUser) {
        AppManager.init();

        // Handle initial page load from URL hash
        if (window.location.hash) {
            const initialPage = window.location.hash.substring(1);
            AppManager.switchPage(initialPage);
        } else {
            AppManager.switchPage('students'); // Default page
        }
    }
});
