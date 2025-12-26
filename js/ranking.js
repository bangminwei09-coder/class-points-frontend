class RankingManager {
    static currentMode = 'total'; // 'total' | 'progress'
    static PROGRESS_DAYS = 7; // 进步榜统计最近 7 天

    static init() {
        // No explicit init needed, calculations are on-demand
    }

    static calculateTotalRanking(students) {
        if (!students || students.length === 0) return [];

        const sortedStudents = [...students].sort((a, b) => b.points - a.points);

        let currentRank = 1;
        let previousPoints = null;

        for (let i = 0; i < sortedStudents.length; i++) {
            const student = sortedStudents[i];

            if (previousPoints !== null && student.points < previousPoints) {
                currentRank = i + 1;
            }
            student.rank = currentRank;
            previousPoints = student.points;

            // TODO: Implement rank change logic (requires historical ranking data)
            student.rankChange = 0; // Placeholder
        }

        return sortedStudents;
    }

    static calculateProgressValue(student) {
        // 根据最近 PROGRESS_DAYS 天的积分变动，计算“进步值”
        if (!student.history || student.history.length === 0) return 0;

        const now = Date.now();
        const threshold = now - this.PROGRESS_DAYS * 24 * 60 * 60 * 1000;
        let delta = 0;

        student.history.forEach(item => {
            if (!item.timestamp || item.timestamp < threshold) return;
            if (item.type === 'exchange') {
                // 兑换商品导致的积分变化不计入进步榜
                return;
            }
            if (item.type === 'reduce') {
                delta -= item.points || 0;
            } else {
                // add / other 增量统一按正值累加
                delta += item.points || 0;
            }
        });

        return delta;
    }

    static calculateProgressRanking(students) {
        if (!students || students.length === 0) return [];

        const listWithProgress = students.map(stu => {
            const progress = this.calculateProgressValue(stu);
            return { student: stu, progress };
        });

        // 只显示有进步的学生（progress > 0）
        const filtered = listWithProgress.filter(item => item.progress > 0);

        filtered.sort((a, b) => b.progress - a.progress);

        // 为进步榜单独标注 rank（第几名）
        filtered.forEach((item, index) => {
            item.student.progressRank = index + 1;
        });

        return filtered;
    }

    static renderRankingList(mode) {
        if (mode) {
            this.currentMode = mode;
        } else {
            mode = this.currentMode;
        }

        const rankingListContainer = document.getElementById('rankingList');
        if (!rankingListContainer) return;

        const allStudents = StudentManager.students;

        if (!allStudents || allStudents.length === 0) {
            rankingListContainer.innerHTML = '<p class="empty-state">暂无学生数据。</p>';
            return;
        }

        let html = '';

        if (mode === 'progress') {
            const progressList = this.calculateProgressRanking(allStudents);

            if (progressList.length === 0) {
                rankingListContainer.innerHTML = `<p class="empty-state">最近 ${this.PROGRESS_DAYS} 天内暂无进步记录。</p>`;
                return;
            }

            html = progressList.map(item => {
                const student = item.student;
                const safeAvatarUrl = Utils.getSafeAvatarUrl(student.avatar, student.name);
                const rankNo = student.progressRank;
                const rankClass = rankNo <= 3 ? `rank-${rankNo}` : '';
                return `
                    <div class="ranking-item ${rankClass}" data-student-id="${student.id}">
                        <div class="ranking-number">#${rankNo}</div>
                        <img src="${safeAvatarUrl}"
                             alt="${student.name}"
                             class="ranking-avatar">
                        <div class="ranking-info">
                            <div class="ranking-name">${student.name}</div>
                            <div class="ranking-points">最近 ${this.PROGRESS_DAYS} 天净增：+${item.progress} 分（当前总分：${student.points}）</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            const rankedStudents = this.calculateTotalRanking(allStudents);

            if (rankedStudents.length === 0) {
                rankingListContainer.innerHTML = '<p class="empty-state">暂无学生排名数据。</p>';
                return;
            }

            html = rankedStudents.map(student => {
                const safeAvatarUrl = Utils.getSafeAvatarUrl(student.avatar, student.name);
                const rankClass = student.rank <= 3 ? `rank-${student.rank}` : '';
                return `
                    <div class="ranking-item ${rankClass}" data-student-id="${student.id}">
                        <div class="ranking-number">#${student.rank}</div>
                        <img src="${safeAvatarUrl}"
                             alt="${student.name}"
                             class="ranking-avatar">
                        <div class="ranking-info">
                            <div class="ranking-name">${student.name}</div>
                            <div class="ranking-points">${student.points} 积分</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        rankingListContainer.innerHTML = html;
    }
}
