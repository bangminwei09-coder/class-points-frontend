class PointsManager {
    static rules = [];

    static init() {
        this.loadRules();
    }

    static loadRules() {
        this.rules = StorageManager.getItem('pointsRules', [
            { id: 'rule1', name: '课堂积极发言', points: 5, description: '在课堂上积极回答问题或参与讨论' },
            { id: 'rule2', name: '作业按时完成', points: 3, description: '所有作业按时提交且质量合格' },
            { id: 'rule3', name: '帮助同学', points: 2, description: '主动帮助有困难的同学' },
            { id: 'rule4', name: '小组合作优秀', points: 10, description: '在小组项目中表现出色，贡献突出' },
            { id: 'rule5', name: '迟到', points: -3, description: '上课迟到，影响纪律' },
            { id: 'rule6', name: '未交作业', points: -5, description: '未按时提交作业' },
            { id: 'rule7', name: '破坏公物', points: -10, description: '故意破坏班级或学校财物' }
        ]);
    }

    static saveRules() {
        StorageManager.saveItem('pointsRules', this.rules);
    }

    static getRuleById(id) {
        return this.rules.find(rule => rule.id === id);
    }

    static addRule(rule) {
        rule.id = Utils.generateUUID();
        this.rules.push(rule);
        this.saveRules();
        // No direct rendering for rules here, AppManager will handle page updates
        Utils.showToast('积分规则添加成功！', 'success');
    }

    static updateRule(id, updatedRule) {
        const index = this.rules.findIndex(rule => rule.id === id);
        if (index !== -1) {
            this.rules[index] = { ...this.rules[index], ...updatedRule };
            this.saveRules();
            Utils.showToast('积分规则更新成功！', 'success');
        }
    }

    static deleteRule(id) {
        UIManager.showModal(
            '确认删除规则',
            '确定要删除这条积分规则吗？',
            () => {
                this.rules = this.rules.filter(rule => rule.id !== id);
                this.saveRules();
                Utils.showToast('积分规则删除成功！', 'success');
            }
        );
    }
}
