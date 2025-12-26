class StatisticsManager {
    static init() {
        // No explicit init, calculations are on-demand
    }

    static renderStatistics() {
        const statisticsContent = document.getElementById('statisticsContent');
        if (!statisticsContent) return;

        const students = StudentManager.students;
        if (students.length === 0) {
            statisticsContent.innerHTML = '<p class="empty-state">暂无学生数据，无法生成统计。</p>';
            return;
        }

        const totalStudents = students.length;
        const totalPoints = students.reduce((sum, student) => sum + student.points, 0);
        const averagePoints = (totalPoints / totalStudents).toFixed(2);
        const maxPointsStudent = students.reduce((max, student) => (student.points > max.points ? student : max), { points: -1 });
        const minPointsStudent = students.reduce((min, student) => (student.points < min.points ? student : min), { points: Infinity });

        // Group statistics
        const groups = GroupManager.calculateGroupRanking();
        const groupStatsHtml = groups.length === 0 ? '<p>暂无小组统计数据。</p>' : `
            <div class="group-statistics">
                <h4>小组平均分排名</h4>
                <ul class="group-ranking-list">
                    ${groups.map(group => `
                        <li>
                            <span>#${group.rank} ${group.name}</span>
                            <span>${group.avgPoints} 分 (${group.memberCount}人)</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        statisticsContent.innerHTML = `
            <h3>整体班级概览</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-label">总学生数</span>
                    <span class="stat-value">${totalStudents}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">总积分</span>
                    <span class="stat-value">${totalPoints}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">平均积分</span>
                    <span class="stat-value">${averagePoints}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">最高分学生</span>
                    <span class="stat-value">${maxPointsStudent.name || '-'} (${maxPointsStudent.points}分)</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">最低分学生</span>
                    <span class="stat-value">${minPointsStudent.name || '-'} (${minPointsStudent.points}分)</span>
                </div>
            </div>

            <h3>积分分布 (简化版)</h3>
            <div class="chart-container">
                <p>此处将显示积分分布图表 (例如使用 Chart.js)</p>
            </div>
            
            ${groupStatsHtml}

            <h3>活跃度趋势 (简化版)</h3>
            <div class="chart-container">
                <p>此处将显示积分变化趋势图表</p>
            </div>
        `;

        // TODO: Integrate a charting library like Chart.js for actual charts
        // For now, it's just placeholder text.
    }
}
