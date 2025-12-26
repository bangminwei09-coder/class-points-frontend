class RulesManager {
    static rules = [];

    static init() {
        this.loadRules();
        this.renderRulesList();
    }

    static loadRules() {
        this.rules = StorageManager.getItem('pointsRules', [
            { id: Utils.generateUUID(), name: '课堂积极发言', points: 5, description: '在课堂上积极回答问题或参与讨论' },
            { id: Utils.generateUUID(), name: '作业按时完成', points: 3, description: '所有作业按时提交且质量合格' },
            { id: Utils.generateUUID(), name: '帮助同学', points: 2, description: '主动帮助有困难的同学' },
            { id: Utils.generateUUID(), name: '小组合作优秀', points: 10, description: '在小组项目中表现出色，贡献突出' },
            { id: Utils.generateUUID(), name: '迟到', points: -3, description: '上课迟到，影响纪律' },
            { id: Utils.generateUUID(), name: '未交作业', points: -5, description: '未按时提交作业' },
            { id: Utils.generateUUID(), name: '破坏公物', points: -10, description: '故意破坏班级或学校财物' }
        ]);
    }

    static saveRules() {
        StorageManager.saveItem('pointsRules', this.rules);
    }

    static getRuleById(id) {
        return this.rules.find(rule => rule.id === id);
    }

    static renderRulesList() {
        const rulesListContainer = document.getElementById('rulesList');
        if (!rulesListContainer) return;

        if (this.rules.length === 0) {
            rulesListContainer.innerHTML = '<p class="empty-state">没有积分规则。点击 "新增规则" 添加。</p>';
            return;
        }

        const html = this.rules.map(rule => `
            <div class="rule-card" data-rule-id="${rule.id}">
                <div class="rule-card-header">
                    <div class="rule-name">${rule.name}</div>
                    <div class="rule-points ${rule.points < 0 ? 'negative' : ''}">${rule.points > 0 ? '+ ' : ''}${rule.points}分</div>
                </div>
                <div class="rule-description">${rule.description}</div>
                <div class="rule-card-footer">
                    <button class="btn btn-sm btn-secondary edit-rule-btn" data-rule-id="${rule.id}">
                        <span class="icon">✏️</span>编辑
                    </button>
                    <button class="btn btn-sm btn-danger delete-rule-btn" data-rule-id="${rule.id}">
                        <span class="icon">🗑️</span>删除
                    </button>
                </div>
            </div>
        `).join('');

        rulesListContainer.innerHTML = html;
        this.bindRuleEvents();
    }

    static bindRuleEvents() {
        const rulesListContainer = document.getElementById('rulesList');
        if (!rulesListContainer) return;

        rulesListContainer.addEventListener('click', (e) => {
            const ruleCard = e.target.closest('.rule-card');
            if (!ruleCard) return;

            const ruleId = ruleCard.dataset.ruleId;

            if (e.target.classList.contains('edit-rule-btn')) {
                this.showEditDialog(ruleId);
            } else if (e.target.classList.contains('delete-rule-btn')) {
                this.deleteRule(ruleId);
            }
        });

        document.getElementById('addRuleBtn').addEventListener('click', () => this.showAddDialog());
    }

    static showAddDialog() {
        UIManager.showModal(
            '新增积分规则',
            `
                <form id="addRuleForm" class="modal-form">
                    <div class="form-group">
                        <label for="addRuleName">规则名称</label>
                        <input type="text" id="addRuleName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="addRulePoints">分值</label>
                        <input type="number" id="addRulePoints" class="form-control" value="1" required>
                    </div>
                    <div class="form-group">
                        <label for="addRuleDescription">描述 (可选)</label>
                        <textarea id="addRuleDescription" class="form-control"></textarea>
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('addRuleName').value;
                const points = parseInt(document.getElementById('addRulePoints').value);
                const description = document.getElementById('addRuleDescription').value;

                if (!name) {
                    Utils.showToast('规则名称不能为空！', 'error');
                    return false;
                }
                if (isNaN(points)) {
                    Utils.showToast('分值必须是数字！', 'error');
                    return false;
                }

                this.addRule({ name, points, description });
                this.renderRulesList(); // Re-render after adding
                return true;
            }
        );
    }

    static addRule(rule) {
        rule.id = Utils.generateUUID();
        this.rules.push(rule);
        this.saveRules();
        Utils.showToast('积分规则添加成功！', 'success');
    }

    static showEditDialog(ruleId) {
        const rule = this.getRuleById(ruleId);
        if (!rule) return;

        UIManager.showModal(
            `编辑规则: ${rule.name}`,
            `
                <form id="editRuleForm" class="modal-form">
                    <div class="form-group">
                        <label for="editRuleName">规则名称</label>
                        <input type="text" id="editRuleName" class="form-control" value="${rule.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editRulePoints">分值</label>
                        <input type="number" id="editRulePoints" class="form-control" value="${rule.points}" required>
                    </div>
                    <div class="form-group">
                        <label for="editRuleDescription">描述 (可选)</label>
                        <textarea id="editRuleDescription" class="form-control">${rule.description || ''}</textarea>
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('editRuleName').value;
                const points = parseInt(document.getElementById('editRulePoints').value);
                const description = document.getElementById('editRuleDescription').value;

                if (!name) {
                    Utils.showToast('规则名称不能为空！', 'error');
                    return false;
                }
                if (isNaN(points)) {
                    Utils.showToast('分值必须是数字！', 'error');
                    return false;
                }

                this.updateRule(ruleId, { name, points, description });
                this.renderRulesList(); // Re-render after updating
                return true;
            }
        );
    }

    static updateRule(ruleId, updatedRule) {
        const index = this.rules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
            this.rules[index] = { ...this.rules[index], ...updatedRule };
            this.saveRules();
            Utils.showToast('积分规则更新成功！', 'success');
        }
    }

    static deleteRule(ruleId) {
        UIManager.showModal(
            '确认删除规则',
            '确定要删除这条积分规则吗？此操作不可撤销！',
            () => {
                this.rules = this.rules.filter(rule => rule.id !== ruleId);
                this.saveRules();
                this.renderRulesList(); // Re-render after deleting
                Utils.showToast('积分规则删除成功！', 'success');
            }
        );
    }
}
