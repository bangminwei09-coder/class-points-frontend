class StudentManager {
    static _isRendering = false;
    static _pendingRender = false;
    static students = [];

    static init() {
        this.loadStudents();
        this.renderStudentList();
    }

    static loadStudents() {
        this.students = StorageManager.getItem('students', []);
        // Sort students by pinyin of name
        this.students.sort((a, b) => {
            return a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'accent' });
        });
    }

    static saveStudents() {
        StorageManager.saveItem('students', this.students);
    }

    static getStudentById(id) {
        return this.students.find(student => student.id === id);
    }

    static addStudent(student) {
        student.id = Utils.generateUUID();
        student.points = 0;
        student.badges = [];
        student.history = [];
        this.students.push(student);
        this.saveStudents();
        this.renderStudentList();
        Utils.showToast('学生添加成功！', 'success');
    }

    static updateStudent(id, updatedStudent) {
        const index = this.students.findIndex(student => student.id === id);
        if (index !== -1) {
            this.students[index] = { ...this.students[index], ...updatedStudent };
            this.saveStudents();
            this.renderStudentList();
            Utils.showToast('学生信息更新成功！', 'success');
        }
    }

    static deleteStudent(id) {
        UIManager.showModal(
            '确认删除',
            '确定要删除这位学生吗？所有相关数据将一并删除，此操作不可撤销！',
            () => {
                this.students = this.students.filter(student => student.id !== id);
                this.saveStudents();
                this.renderStudentList();
                Utils.showToast('学生删除成功！', 'success');
            },
            true
        );
    }

    static addPoints(studentId, points, reason) {
        const student = this.getStudentById(studentId);
        if (student) {
            student.points += points;
            student.history.unshift({
                id: Utils.generateUUID(),
                type: 'add',
                points: points,
                reason: reason,
                timestamp: Date.now()
            });
            this.saveStudents();
            this.renderStudentList();
            Utils.showToast(`${student.name} 积分增加 ${points}！`, 'success');
        }
    }

    static reducePoints(studentId, points, reason) {
        const student = this.getStudentById(studentId);
        if (student) {
            student.points = Math.max(0, student.points - points);
            student.history.unshift({
                id: Utils.generateUUID(),
                type: 'reduce',
                points: points,
                reason: reason,
                timestamp: Date.now()
            });
            this.saveStudents();
            this.renderStudentList();
            Utils.showToast(`${student.name} 积分减少 ${points}！`, 'warning');
        }
    }

    static renderStudentList() {
        if (StudentManager._isRendering) {
            console.log('正在渲染中，标记待处理渲染请求');
            StudentManager._pendingRender = true;
            return;
        }
        StudentManager._isRendering = true;
        StudentManager._pendingRender = false;

        requestAnimationFrame(() => {
            try {
                const studentListContainer = document.getElementById('studentList');
                if (!studentListContainer) return;

                const searchInput = document.getElementById('searchInput');
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

                const filteredStudents = this.students.filter(student =>
                    student.name.toLowerCase().includes(searchTerm) ||
                    (student.studentNo && student.studentNo.toLowerCase().includes(searchTerm))
                );

                if (filteredStudents.length === 0) {
                    studentListContainer.innerHTML = '<p class="empty-state">没有找到学生。点击 "新增学生" 添加。</p>';
                    return;
                }

                const groupedStudents = filteredStudents.reduce((acc, student) => {
                    const firstLetter = student.name.charAt(0).toUpperCase();
                    if (!acc[firstLetter]) {
                        acc[firstLetter] = [];
                    }
                    acc[firstLetter].push(student);
                    return acc;
                }, {});

                const sortedLetters = Object.keys(groupedStudents).sort();

                let html = '';
                sortedLetters.forEach(letter => {
                    html += `
                        <div class="letter-group">
                            <div class="letter-group-header">
                                <span class="letter-group-letter">${letter}</span>
                                <span class="letter-group-count">${groupedStudents[letter].length}人</span>
                            </div>
                            <div class="students-container">
                                ${groupedStudents[letter].map(student => this.renderStudentCard(student)).join('')}
                            </div>
                        </div>
                    `;
                });

                studentListContainer.innerHTML = html;
                this.bindStudentCardEvents();
            } finally {
                // Release the lock after a short delay to prevent flickering from rapid re-renders
                setTimeout(() => {
                    StudentManager._isRendering = false;
                    if (StudentManager._pendingRender) {
                        console.log('执行待处理的渲染请求');
                        StudentManager.renderStudentList();
                    }
                }, 200);
            }
        });
    }

    static renderStudentCard(student) {
        const safeAvatarUrl = Utils.getSafeAvatarUrl(student.avatar, student.name);
        const group = GroupManager.getGroupById(student.groupId);
        const groupName = group ? group.name : '未分组';
        return `
            <div class="student-card" data-student-id="${student.id}">
                <input type="checkbox" class="student-card-checkbox" data-student-id="${student.id}">
                <div class="student-card-header">
                    <div class="student-avatar-wrapper">
                        <img src="${safeAvatarUrl}"
                             alt="${student.name}"
                             class="student-avatar">
                        <div class="student-badges">
                            ${this.renderBadges(student)}
                        </div>
                    </div>
                    <div class="student-name">${student.name}</div>
                    <div class="student-no">${student.studentNo || ''}</div>
                </div>
                <div class="student-card-body">
                    <div class="student-points">${student.points}</div>
                    <div class="student-points-label">总积分</div>
                    <div class="student-rank">
                        <span>排名: ${student.rank || '-'}</span>
                        ${student.rankChange ? `<span class="rank-change ${student.rankChange > 0 ? 'up' : 'down'}">${student.rankChange > 0 ? '▲' : '▼'} ${Math.abs(student.rankChange)}</span>` : ''}
                    </div>
                    <div class="student-group">
                        <span>小组: ${groupName}</span>
                    </div>
                </div>
                <div class="student-card-actions">
                    <button class="btn btn-success btn-add" data-student-id="${student.id}"><span class="icon">➕</span>加分</button>
                    <button class="btn btn-danger btn-reduce" data-student-id="${student.id}"><span class="icon">➖</span>减分</button>
                </div>
                <div class="student-card-footer">
                    <button class="card-footer-btn view-history-btn" data-student-id="${student.id}">
                        <span class="icon">📜</span>
                        <span>历史</span>
                    </button>
                    <button class="card-footer-btn edit-student-btn" data-student-id="${student.id}">
                        <span class="icon">✏️</span>
                        <span>编辑</span>
                    </button>
                    <button class="card-footer-btn delete-student-btn" data-student-id="${student.id}">
                        <span class="icon">🗑️</span>
                        <span>删除</span>
                    </button>
                </div>
            </div>
        `;
    }

    static renderBadges(student) {
        if (!student.badges || student.badges.length === 0) return '';
        return student.badges.map(badge => `
            <div class="badge-icon" title="${badge.name}">${badge.icon}</div>
        `).join('');
    }

    static bindStudentCardEvents() {
        const studentList = document.getElementById('studentList');
        if (!studentList) return;

        studentList.addEventListener('click', (e) => {
            const studentCard = e.target.closest('.student-card');
            if (!studentCard) return;

            const studentId = studentCard.dataset.studentId;
            const student = this.getStudentById(studentId);

            if (e.target.classList.contains('btn-add')) {
                this.showAddPointsDialog(studentId);
            } else if (e.target.classList.contains('btn-reduce')) {
                this.showReducePointsDialog(studentId);
            } else if (e.target.classList.contains('view-history-btn')) {
                this.showHistoryDialog(student);
            } else if (e.target.classList.contains('edit-student-btn')) {
                this.showEditDialog(studentId);
            } else if (e.target.classList.contains('delete-student-btn')) {
                this.deleteStudent(studentId);
            } else if (e.target.classList.contains('student-card-checkbox')) {
                // Handle checkbox selection
                studentCard.classList.toggle('selected', e.target.checked);
                this.updateBatchActionButtons();
            }
        });
    }

    static showAddDialog() {
        UIManager.showModal(
            '新增学生',
            `
                <form id="addStudentForm" class="modal-form">
                    <div class="form-group">
                        <label for="addStudentName">学生姓名</label>
                        <input type="text" id="addStudentName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="addStudentNo">学号 (可选)</label>
                        <input type="text" id="addStudentNo" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="addStudentGroup">选择小组 (可选)</label>
                        <select id="addStudentGroup" class="form-control">
                            <option value="">未分组</option>
                            ${GroupManager.getGroups().map(group => `<option value="${group.id}">${group.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="addStudentAvatar">头像 URL (可选)</label>
                        <div class="avatar-upload-preview">
                            <img src="${Utils.generateDefaultAvatar('新')}" class="avatar-preview" id="addAvatarPreview">
                            <input type="text" id="addStudentAvatar" class="form-control" placeholder="图片URL或留空生成默认头像">
                            <input type="file" id="addAvatarFile" accept="image/*" style="display: none;">
                            <button type="button" class="btn btn-secondary btn-sm" id="uploadAddAvatarBtn">上传图片</button>
                        </div>
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('addStudentName').value;
                const studentNo = document.getElementById('addStudentNo').value;
                const groupId = document.getElementById('addStudentGroup').value;
                const avatar = document.getElementById('addStudentAvatar').value;

                if (!name) {
                    Utils.showToast('学生姓名不能为空！', 'error');
                    return false; // Prevent modal from closing
                }

                StudentManager.addStudent({ name, studentNo, groupId, avatar });
                return true; // Allow modal to close
            }
        );

        // Bind avatar preview and upload logic
        const addAvatarPreview = document.getElementById('addAvatarPreview');
        const addStudentAvatarInput = document.getElementById('addStudentAvatar');
        const addAvatarFileInput = document.getElementById('addAvatarFile');
        const uploadAddAvatarBtn = document.getElementById('uploadAddAvatarBtn');

        addStudentAvatarInput.addEventListener('input', (e) => {
            addAvatarPreview.src = Utils.getSafeAvatarUrl(e.target.value, '新');
        });

        uploadAddAvatarBtn.addEventListener('click', () => {
            addAvatarFileInput.click();
        });

        addAvatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    addAvatarPreview.src = event.target.result;
                    addStudentAvatarInput.value = event.target.result; // Set URL to input field
                };
                reader.readAsDataURL(file);
            }
        });
    }

    static showEditDialog(studentId) {
        const student = this.getStudentById(studentId);
        if (!student) return;

        UIManager.showModal(
            `编辑学生: ${student.name}`,
            `
                <form id="editStudentForm" class="modal-form">
                    <div class="form-group">
                        <label for="editStudentName">学生姓名</label>
                        <input type="text" id="editStudentName" class="form-control" value="${student.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStudentNo">学号 (可选)</label>
                        <input type="text" id="editStudentNo" class="form-control" value="${student.studentNo || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editStudentGroup">选择小组 (可选)</label>
                        <select id="editStudentGroup" class="form-control">
                            <option value="">未分组</option>
                            ${GroupManager.getGroups().map(group => `<option value="${group.id}" ${student.groupId === group.id ? 'selected' : ''}>${group.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editStudentAvatar">头像 URL (可选)</label>
                        <div class="avatar-upload-preview">
                            <img src="${Utils.getSafeAvatarUrl(student.avatar, student.name)}"
                                 class="avatar-preview" id="editAvatarPreview">
                            <input type="text" id="editStudentAvatar" class="form-control" value="${student.avatar || ''}" placeholder="图片URL或留空生成默认头像">
                            <input type="file" id="editAvatarFile" accept="image/*" style="display: none;">
                            <button type="button" class="btn btn-secondary btn-sm" id="uploadEditAvatarBtn">上传图片</button>
                        </div>
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('editStudentName').value;
                const studentNo = document.getElementById('editStudentNo').value;
                const groupId = document.getElementById('editStudentGroup').value;
                const avatar = document.getElementById('editStudentAvatar').value;

                if (!name) {
                    Utils.showToast('学生姓名不能为空！', 'error');
                    return false; // Prevent modal from closing
                }

                StudentManager.updateStudent(studentId, { name, studentNo, groupId, avatar });
                return true; // Allow modal to close
            }
        );

        // Bind avatar preview and upload logic
        const editAvatarPreview = document.getElementById('editAvatarPreview');
        const editStudentAvatarInput = document.getElementById('editStudentAvatar');
        const editAvatarFileInput = document.getElementById('editAvatarFile');
        const uploadEditAvatarBtn = document.getElementById('uploadEditAvatarBtn');

        editStudentAvatarInput.addEventListener('input', (e) => {
            editAvatarPreview.src = Utils.getSafeAvatarUrl(e.target.value, student.name);
        });

        uploadEditAvatarBtn.addEventListener('click', () => {
            editAvatarFileInput.click();
        });

        editAvatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    editAvatarPreview.src = event.target.result;
                    editStudentAvatarInput.value = event.target.result; // Set URL to input field
                };
                reader.readAsDataURL(file);
            }
        });
    }

    static showAddPointsDialog(studentId) {
        const student = this.getStudentById(studentId);
        if (!student) return;

        UIManager.showModal(
            `为 ${student.name} 加分`,
            `
                <form id="addPointsForm" class="modal-form">
                    <div class="form-group">
                        <label for="pointsAmount">分数</label>
                        <input type="number" id="pointsAmount" class="form-control" value="1" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="pointsReason">原因</label>
                        <input type="text" id="pointsReason" class="form-control" required>
                    </div>
                </form>
            `,
            () => {
                const pointsAmount = parseInt(document.getElementById('pointsAmount').value);
                const pointsReason = document.getElementById('pointsReason').value;

                if (isNaN(pointsAmount) || pointsAmount <= 0) {
                    Utils.showToast('分数必须是正整数！', 'error');
                    return false;
                }
                if (!pointsReason) {
                    Utils.showToast('加分原因不能为空！', 'error');
                    return false;
                }
                this.addPoints(studentId, pointsAmount, pointsReason);
                return true;
            }
        );
    }

    static showReducePointsDialog(studentId) {
        const student = this.getStudentById(studentId);
        if (!student) return;

        UIManager.showModal(
            `为 ${student.name} 减分`,
            `
                <form id="reducePointsForm" class="modal-form">
                    <div class="form-group">
                        <label for="pointsAmount">分数</label>
                        <input type="number" id="pointsAmount" class="form-control" value="1" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="pointsReason">原因</label>
                        <input type="text" id="pointsReason" class="form-control" required>
                    </div>
                </form>
            `,
            () => {
                const pointsAmount = parseInt(document.getElementById('pointsAmount').value);
                const pointsReason = document.getElementById('pointsReason').value;

                if (isNaN(pointsAmount) || pointsAmount <= 0) {
                    Utils.showToast('分数必须是正整数！', 'error');
                    return false;
                }
                if (!pointsReason) {
                    Utils.showToast('减分原因不能为空！', 'error');
                    return false;
                }
                this.reducePoints(studentId, pointsAmount, pointsReason);
                return true;
            }
        );
    }

    static showHistoryDialog(student) {
        if (!student) return;

        const historyHtml = student.history.length === 0
            ? '<p>暂无积分历史记录。</p>'
            : `
                <ul class="points-history-list">
                    ${student.history.map(item => `
                        <li class="points-history-item ${item.type === 'add' ? 'add' : 'reduce'}">
                            <span class="history-type">${item.type === 'add' ? '➕' : '➖'}</span>
                            <span class="history-points">${item.type === 'add' ? '+ ' : '- '}${item.points}分</span>
                            <span class="history-reason">${item.reason}</span>
                            <span class="history-timestamp">${Utils.getFormattedDate(item.timestamp)}</span>
                        </li>
                    `).join('')}
                </ul>
            `;

        UIManager.showModal(
            `${student.name} 的积分历史`,
            historyHtml,
            () => {},
            false // No cancel button
        );
    }

    static updateBatchActionButtons() {
        const selectedCheckboxes = document.querySelectorAll('.student-card-checkbox:checked');
        const hasSelection = selectedCheckboxes.length > 0;

        document.getElementById('batchDeleteBtn').disabled = !hasSelection;
        document.getElementById('batchAddPointsBtn').disabled = !hasSelection;
        document.getElementById('batchReducePointsBtn').disabled = !hasSelection;
        document.getElementById('toggleSelectAllBtn').textContent = selectedCheckboxes.length === this.students.length ? '取消全选' : '全选';
    }

    static getSelectedStudentIds() {
        const selectedCheckboxes = document.querySelectorAll('.student-card-checkbox:checked');
        return Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.studentId);
    }

    static handleBatchDelete() {
        const selectedIds = this.getSelectedStudentIds();
        if (selectedIds.length === 0) {
            Utils.showToast('请选择要删除的学生！', 'info');
            return;
        }

        UIManager.showModal(
            '确认批量删除',
            `确定要删除选中的 ${selectedIds.length} 位学生吗？此操作不可撤销！`,
            () => {
                this.students = this.students.filter(student => !selectedIds.includes(student.id));
                this.saveStudents();
                this.renderStudentList();
                Utils.showToast(`${selectedIds.length} 位学生已删除！`, 'success');
            }
        );
    }

    static handleBatchAddPoints() {
        const selectedIds = this.getSelectedStudentIds();
        if (selectedIds.length === 0) {
            Utils.showToast('请选择要加分的学生！', 'info');
            return;
        }

        UIManager.showModal(
            `为 ${selectedIds.length} 位学生批量加分`,
            `
                <form id="batchAddPointsForm" class="modal-form">
                    <div class="form-group">
                        <label for="batchPointsAmount">分数</label>
                        <input type="number" id="batchPointsAmount" class="form-control" value="1" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="batchPointsReason">原因</label>
                        <input type="text" id="batchPointsReason" class="form-control" required>
                    </div>
                </form>
            `,
            () => {
                const pointsAmount = parseInt(document.getElementById('batchPointsAmount').value);
                const pointsReason = document.getElementById('batchPointsReason').value;

                if (isNaN(pointsAmount) || pointsAmount <= 0) {
                    Utils.showToast('分数必须是正整数！', 'error');
                    return false;
                }
                if (!pointsReason) {
                    Utils.showToast('加分原因不能为空！', 'error');
                    return false;
                }

                selectedIds.forEach(id => {
                    this.addPoints(id, pointsAmount, pointsReason);
                });
                // Re-render and update buttons after all points are added
                this.renderStudentList();
                this.updateBatchActionButtons();
                Utils.showToast(`${selectedIds.length} 位学生已批量加分 ${pointsAmount}！`, 'success');
                return true;
            }
        );
    }

    static handleBatchReducePoints() {
        const selectedIds = this.getSelectedStudentIds();
        if (selectedIds.length === 0) {
            Utils.showToast('请选择要减分的学生！', 'info');
            return;
        }

        UIManager.showModal(
            `为 ${selectedIds.length} 位学生批量减分`,
            `
                <form id="batchReducePointsForm" class="modal-form">
                    <div class="form-group">
                        <label for="batchPointsAmount">分数</label>
                        <input type="number" id="batchPointsAmount" class="form-control" value="1" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="batchPointsReason">原因</label>
                        <input type="text" id="batchPointsReason" class="form-control" required>
                    </div>
                </form>
            `,
            () => {
                const pointsAmount = parseInt(document.getElementById('batchPointsAmount').value);
                const pointsReason = document.getElementById('batchPointsReason').value;

                if (isNaN(pointsAmount) || pointsAmount <= 0) {
                    Utils.showToast('分数必须是正整数！', 'error');
                    return false;
                }
                if (!pointsReason) {
                    Utils.showToast('减分原因不能为空！', 'error');
                    return false;
                }

                selectedIds.forEach(id => {
                    this.reducePoints(id, pointsAmount, pointsReason);
                });
                // Re-render and update buttons after all points are reduced
                this.renderStudentList();
                this.updateBatchActionButtons();
                Utils.showToast(`${selectedIds.length} 位学生已批量减分 ${pointsAmount}！`, 'warning');
                return true;
            }
        );
    }

    static toggleSelectAll() {
        const allCheckboxes = document.querySelectorAll('.student-card-checkbox');
        const selectAllBtn = document.getElementById('toggleSelectAllBtn');
        const isAllSelected = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);

        allCheckboxes.forEach(cb => {
            cb.checked = !isAllSelected;
            cb.closest('.student-card').classList.toggle('selected', !isAllSelected);
        });
        this.updateBatchActionButtons();
    }

    static handleSearch() {
        this.renderStudentList(); // Re-render list based on search input
    }
}
