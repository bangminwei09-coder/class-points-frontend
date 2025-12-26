class ImportManager {
    static init() {
        const importFileInput = document.getElementById('importFileInput');
        const importBtn = document.getElementById('importBtn');

        if (importFileInput && importBtn) {
            importBtn.addEventListener('click', () => this.handleImport(importFileInput.files[0]));
        }
    }

    static handleImport(file) {
        if (!file) {
            Utils.showToast('请选择一个文件进行导入！', 'info');
            return;
        }

        UIManager.showLoading();

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let importedData;

                if (file.name.endsWith('.json')) {
                    importedData = JSON.parse(content);
                    this.importJsonData(importedData);
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
                    Utils.showToast('Excel/CSV 导入功能暂未实现，请导入 JSON 文件。' , 'warning');
                    // TODO: Implement Excel/CSV parsing using a library like SheetJS
                } else {
                    Utils.showToast('不支持的文件格式。请导入 JSON、Excel 或 CSV 文件。' , 'error');
                }
            } catch (error) {
                console.error('导入文件解析失败:', error);
                Utils.showToast('导入文件解析失败，请检查文件格式。' , 'error');
            } finally {
                UIManager.hideLoading();
            }
        };

        reader.onerror = () => {
            UIManager.hideLoading();
            Utils.showToast('文件读取失败。' , 'error');
        };

        reader.readAsText(file);
    }

    static importJsonData(data) {
        // Assuming 'data' could be a single array of students or an object containing different data types
        if (Array.isArray(data)) {
            // Assume it's an array of students
            this.importStudents(data);
        } else if (typeof data === 'object' && data !== null) {
            if (data.students) this.importStudents(data.students);
            if (data.groups) this.importGroups(data.groups);
            if (data.pointsRules) this.importPointsRules(data.pointsRules);
            // TODO: Add other data types as they are implemented (e.g., shopGoods, studentHistory, etc.)

            Utils.showToast('JSON 数据已导入！', 'success');
        } else {
            Utils.showToast('JSON 文件格式不正确，无法导入。' , 'error');
        }
    }

    static importStudents(newStudents) {
        // Merge or replace existing students. For simplicity, we'll replace for now.
        // In a real app, you might want to ask the user to merge or overwrite.
        StudentManager.students = newStudents;
        StudentManager.saveStudents();
        StudentManager.renderStudentList();
        Utils.showToast(`${newStudents.length} 位学生数据已导入。`, 'success');
    }

    static importGroups(newGroups) {
        GroupManager.groups = newGroups;
        GroupManager.saveGroups();
        GroupManager.renderGroupList();
        Utils.showToast(`${newGroups.length} 个小组数据已导入。`, 'success');
    }

    static importPointsRules(newRules) {
        RulesManager.rules = newRules;
        RulesManager.saveRules();
        RulesManager.renderRulesList();
        Utils.showToast(`${newRules.length} 条积分规则已导入。`, 'success');
    }

    // TODO: Implement import methods for other data types (shopGoods, etc.)
}
