class GroupManager {
    static groups = [];

    static init() {
        this.loadGroups();
    }

    static loadGroups() {
        this.groups = StorageManager.getItem('groups', []);
    }

    static saveGroups() {
        StorageManager.saveItem('groups', this.groups);
    }

    static getGroupById(id) {
        return this.groups.find(group => group.id === id);
    }

    static getGroups() {
        return this.groups;
    }

    static calculateGroupScore(groupId) {
        const groupMembers = StudentManager.students.filter(student => student.groupId === groupId);
        const totalPoints = groupMembers.reduce((sum, member) => sum + member.points, 0);
        const memberCount = groupMembers.length;
        const avgPoints = memberCount > 0 ? (totalPoints / memberCount).toFixed(1) : 0;
        return { totalPoints, memberCount, avgPoints: parseFloat(avgPoints) };
    }

    static calculateGroupRanking() {
        const groupsWithScores = this.groups.map(group => {
            const { totalPoints, memberCount, avgPoints } = this.calculateGroupScore(group.id);
            return { ...group, totalPoints, memberCount, avgPoints };
        });

        // Sort groups by average points in descending order
        const sortedGroups = groupsWithScores.sort((a, b) => b.avgPoints - a.avgPoints);

        let currentRank = 1;
        let previousAvgPoints = null;
        for (let i = 0; i < sortedGroups.length; i++) {
            const group = sortedGroups[i];
            if (previousAvgPoints !== null && group.avgPoints < previousAvgPoints) {
                currentRank = i + 1;
            }
            group.rank = currentRank;
            previousAvgPoints = group.avgPoints;
        }

        return sortedGroups;
    }

    static renderGroupList() {
        const container = document.getElementById('groupsContainer');
        if (!container) return;

        const groups = this.calculateGroupRanking();

        if (groups.length === 0) {
            container.innerHTML = '<p class="empty-state">没有小组。点击 "新增小组" 添加。</p>';
            return;
        }

        const html = groups.map(group => `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-card-header">
                    <div class="group-rank rank-${group.rank}">#${group.rank}</div>
                    <div class="group-info">
                        <div class="group-name">${group.name}</div>
                        <div class="group-meta">${group.memberCount}人</div>
                    </div>
                    <div class="group-score">
                        <div class="score-value">${group.avgPoints}</div>
                        <div class="score-label">平均分</div>
                    </div>
                </div>
                <div class="group-card-body">
                    <div class="group-stats">
                        <div class="stat-item">
                            <div class="stat-label">总积分</div>
                            <div class="stat-value">${group.totalPoints}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">成员</div>
                            <div class="stat-value">${group.memberCount}人</div>
                        </div>
                    </div>
                    <div class="group-members-preview">
                        ${this.renderMembersPreview(group.id)}
                    </div>
                </div>
                <div class="group-card-footer">
                    <button class="btn btn-sm btn-secondary" onclick="GroupManager.showMembersDialog('${group.id}')">
                        <span class="icon">👥</span>
                        <span>成员</span>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="GroupManager.showEditDialog('${group.id}')">
                        <span class="icon">✏️</span>
                        <span>编辑</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="GroupManager.deleteGroup('${group.id}')">
                        <span class="icon">🗑️</span>
                        <span>删除</span>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
        this.bindGroupCardEvents();
    }

    static renderMembersPreview(groupId) {
        const members = StudentManager.students.filter(student => student.groupId === groupId);
        if (members.length === 0) return '<p class="empty-state">暂无成员</p>';

        const previewCount = 4; // Display up to 4 members
        const previewMembers = members.slice(0, previewCount);

        let html = previewMembers.map(member => {
            const safeAvatarUrl = Utils.getSafeAvatarUrl(member.avatar, member.name);
            return `
                <div class="member-preview-item" title="${member.name}">
                    <img src="${safeAvatarUrl}" alt="${member.name}" class="member-preview-avatar">
                    <span class="member-preview-name">${member.name}</span>
                </div>
            `;
        }).join('');

        if (members.length > previewCount) {
            html += `
                <div class="member-preview-item more-members" title="更多成员">
                    <div class="member-preview-avatar" style="background-color: var(--bg-secondary); display: flex; align-items: center; justify-content: center;">+${members.length - previewCount}</div>
                    <span class="member-preview-name">更多</span>
                </div>
            `;
        }

        return html;
    }

    static bindGroupCardEvents() {
        const groupsContainer = document.getElementById('groupsContainer');
        if (!groupsContainer) return;

        // Event delegation for dynamically added buttons
        groupsContainer.addEventListener('click', (e) => {
            // Handled by inline onclick for now, but good practice for future refactoring
        });

        document.getElementById('addGroupBtn').addEventListener('click', () => this.showAddDialog());
    }

    static showAddDialog() {
        UIManager.showModal(
            '新增小组',
            `
                <form id="addGroupForm" class="modal-form">
                    <div class="form-group">
                        <label for="groupName">小组名称</label>
                        <input type="text" id="groupName" class="form-control" required>
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('groupName').value;
                if (!name) {
                    Utils.showToast('小组名称不能为空！', 'error');
                    return false;
                }
                this.addGroup({ name });
                AppManager.renderPage('groups'); // Re-render group page
                return true;
            }
        );
    }

    static addGroup(group) {
        group.id = Utils.generateUUID();
        this.groups.push(group);
        this.saveGroups();
        Utils.showToast('小组添加成功！', 'success');
    }

    static showEditDialog(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return;

        UIManager.showModal(
            `编辑小组: ${group.name}`,
            `
                <form id="editGroupForm" class="modal-form">
                    <div class="form-group">
                        <label for="editGroupName">小组名称</label>
                        <input type="text" id="editGroupName" class="form-control" value="${group.name}" required>
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('editGroupName').value;
                if (!name) {
                    Utils.showToast('小组名称不能为空！', 'error');
                    return false;
                }
                this.updateGroup(groupId, { name });
                AppManager.renderPage('groups'); // Re-render group page
                return true;
            }
        );
    }

    static updateGroup(groupId, updatedGroup) {
        const index = this.groups.findIndex(group => group.id === groupId);
        if (index !== -1) {
            this.groups[index] = { ...this.groups[index], ...updatedGroup };
            this.saveGroups();
            Utils.showToast('小组信息更新成功！', 'success');
        }
    }

    static deleteGroup(groupId) {
        UIManager.showModal(
            '确认删除小组',
            '确定要删除这个小组吗？小组内的学生将变为未分组状态。此操作不可撤销！',
            () => {
                // Remove group from students
                StudentManager.students.forEach(student => {
                    if (student.groupId === groupId) {
                        student.groupId = '';
                    }
                });
                StudentManager.saveStudents();

                this.groups = this.groups.filter(group => group.id !== groupId);
                this.saveGroups();
                AppManager.renderPage('groups'); // Re-render group page
                StudentManager.renderStudentList(); // Re-render student list to update group info
                Utils.showToast('小组删除成功！', 'success');
            }
        );
    }

    static showMembersDialog(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return;

        const allStudents = StudentManager.students;
        const groupMembers = allStudents.filter(student => student.groupId === groupId);
        const unassignedStudents = allStudents.filter(student => student.groupId !== groupId);

        const membersListHtml = groupMembers.length === 0
            ? '<p>本小组暂无成员。</p>'
            : `
                <ul class="member-list">
                    ${groupMembers.map(member => `
                        <li class="member-item">
                            <img src="${Utils.getSafeAvatarUrl(member.avatar, member.name)}" alt="${member.name}" class="member-avatar-sm">
                            <span>${member.name} (${member.points}分)</span>
                            <button class="btn btn-danger btn-sm" onclick="GroupManager.removeMember('${groupId}', '${member.id}')">移出</button>
                        </li>
                    `).join('')}
                </ul>
            `;

        const addMemberOptionsHtml = unassignedStudents.length === 0
            ? '<option value="" disabled>没有可添加的学生</option>'
            : unassignedStudents.map(student => `<option value="${student.id}">${student.name} (${student.points}分)</option>`).join('');

        UIManager.showModal(
            `管理小组: ${group.name} 成员`,
            `
                <div class="group-members-manager">
                    <h4>当前成员 (${groupMembers.length}人)</h4>
                    ${membersListHtml}

                    <h4 style="margin-top: 20px;">添加成员</h4>
                    <div class="add-member-section">
                        <select id="addMemberSelect" class="form-control">
                            <option value="">请选择学生</option>
                            ${addMemberOptionsHtml}
                        </select>
                        <button class="btn btn-primary btn-sm" id="addMemberBtn">添加</button>
                    </div>
                </div>
            `,
            () => {},
            false // No confirm button, only close
        );

        // Bind add member event
        document.getElementById('addMemberBtn').addEventListener('click', () => {
            const selectElement = document.getElementById('addMemberSelect');
            const studentIdToAdd = selectElement.value;
            if (studentIdToAdd) {
                this.addMember(groupId, studentIdToAdd);
                UIManager.hideModal(); // Close and re-open to refresh content
                this.showMembersDialog(groupId);
            } else {
                Utils.showToast('请选择一个学生添加！', 'info');
            }
        });
    }

    static addMember(groupId, studentId) {
        const student = StudentManager.getStudentById(studentId);
        if (student) {
            student.groupId = groupId;
            StudentManager.saveStudents();
            StudentManager.renderStudentList(); // Update student card to reflect group change
            Utils.showToast(`${student.name} 已加入小组！`, 'success');
        }
    }

    static removeMember(groupId, studentId) {
        UIManager.showModal(
            '移出成员',
            '确定要将该学生移出小组吗？',
            () => {
                const student = StudentManager.getStudentById(studentId);
                if (student) {
                    student.groupId = ''; // Set to unassigned
                    StudentManager.saveStudents();
                    StudentManager.renderStudentList(); // Update student card
                    Utils.showToast(`${student.name} 已移出小组！`, 'warning');
                    UIManager.hideModal(); // Close and re-open to refresh content
                    this.showMembersDialog(groupId);
                }
            }
        );
    }
}
