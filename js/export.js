class ExportManager {
    static exportStudentsToJson() {
        const students = StorageManager.getItem('students', []);
        if (students.length === 0) {
            Utils.showToast('没有学生数据可导出', 'info');
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        Utils.showToast('学生数据已成功导出为 JSON', 'success');
    }

    static exportGroupsToJson() {
        const groups = StorageManager.getItem('groups', []);
        if (groups.length === 0) {
            Utils.showToast('没有小组数据可导出', 'info');
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groups, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `groups_export_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        Utils.showToast('小组数据已成功导出为 JSON', 'success');
    }

    static exportAllDataToJson() {
        const allData = {
            students: StorageManager.getItem('students', []),
            groups: StorageManager.getItem('groups', []),
            pointsRules: StorageManager.getItem('pointsRules', []),
            shopGoods: StorageManager.getItem('shopGoods', []),
            // Add other data types here as they are implemented
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `all_data_export_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        Utils.showToast('所有数据已成功导出为 JSON', 'success');
    }

    // TODO: Implement export to Excel and PDF
}
