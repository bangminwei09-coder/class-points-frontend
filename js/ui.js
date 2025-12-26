class UIManager {
    static showModal(title, content, onConfirm, showCancelButton = true) {
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) return;

        const modalHtml = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    ${showCancelButton ? '<button class="btn btn-secondary modal-cancel">取消</button>' : ''}
                    <button class="btn btn-primary modal-confirm">确定</button>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalHtml;
        modalContainer.classList.add('show');

        const confirmBtn = modalContainer.querySelector('.modal-confirm');
        const cancelBtn = modalContainer.querySelector('.modal-cancel');
        const closeBtn = modalContainer.querySelector('.modal-close');

        const closeModal = () => {
            modalContainer.classList.remove('show');
            modalContainer.innerHTML = '';
        };

        confirmBtn.onclick = () => {
            onConfirm();
            closeModal();
        };

        if (cancelBtn) {
            cancelBtn.onclick = closeModal;
        }
        closeBtn.onclick = closeModal;

        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }

    static hideModal() {
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) {
            modalContainer.classList.remove('show');
            modalContainer.innerHTML = '';
        }
    }

    static showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }

    static hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    static enterProjectionMode(students, currentRank = 1) {
        // This is a simplified version. A full implementation would involve
        // creating a new window or fullscreen mode, and dynamic updates.
        const projectionContent = `
            <div class="projection-container">
                <div class="projection-header">
                    <h2 class="projection-title">班级实时排名</h2>
                    <div class="projection-time">${Utils.getFormattedDate(Date.now())}</div>
                </div>
                <div class="projection-content">
                    ${students.map(student => {
                        const safeAvatarUrl = Utils.getSafeAvatarUrl(student.avatar, student.name);
                        return `
                            <div class="projection-ranking-item">
                                <div class="projection-rank projection-rank-${student.rank}">#${student.rank}</div>
                                <img src="${safeAvatarUrl}"
                                    alt="${student.name}"
                                    class="projection-avatar">
                                <div class="projection-name">${student.name}</div>
                                <div class="projection-points">${student.points}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="projection-footer">
                    <p>Powered by 班级积分管理系统</p>
                </div>
            </div>
        `;
        const newWindow = window.open('', '_blank', 'fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
        if (newWindow) {
            newWindow.document.write(`
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>实时排名投影</title>
                    <link rel="stylesheet" href="css/main.css">
                    <link rel="stylesheet" href="css/components.css">
                    <link rel="stylesheet" href="css/themes.css">
                    <style>
                        body {
                            background-color: var(--bg-primary);
                            color: var(--text-primary);
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }
                        .projection-container {
                            width: 95%;
                            height: 95vh;
                            background: var(--white);
                            border-radius: var(--radius-lg);
                            box-shadow: var(--shadow-lg);
                            display: flex;
                            flex-direction: column;
                            padding: var(--spacing-xl);
                            box-sizing: border-box;
                        }
                        .projection-header {
                            text-align: center;
                            margin-bottom: var(--spacing-lg);
                            border-bottom: 2px solid var(--border-color);
                            padding-bottom: var(--spacing-md);
                        }
                        .projection-title {
                            font-size: 3rem;
                            font-weight: 800;
                            color: var(--primary-color);
                            margin-bottom: var(--spacing-sm);
                        }
                        .projection-time {
                            font-size: 1.2rem;
                            color: var(--text-secondary);
                        }
                        .projection-content {
                            flex-grow: 1;
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                            gap: var(--spacing-lg);
                            padding: var(--spacing-md) 0;
                            overflow-y: auto;
                        }
                        .projection-ranking-item {
                            background: var(--bg-secondary);
                            border-radius: var(--radius-lg);
                            padding: var(--spacing-md);
                            display: flex;
                            align-items: center;
                            gap: var(--spacing-md);
                            box-shadow: var(--shadow-sm);
                        }
                        .projection-rank {
                            font-size: 2.5rem;
                            font-weight: 900;
                            color: var(--text-tertiary);
                            min-width: 60px;
                            text-align: center;
                        }
                        .projection-rank.projection-rank-1 { color: #FFD700; }
                        .projection-rank.projection-rank-2 { color: #C0C0C0; }
                        .projection-rank.projection-rank-3 { color: #CD7F32; }
                        .projection-avatar {
                            width: 70px;
                            height: 70px;
                            border-radius: var(--radius-full);
                            object-fit: cover;
                            border: 3px solid var(--primary-light);
                            background: var(--white);
                        }
                        .projection-name {
                            font-size: 1.8rem;
                            font-weight: 700;
                            color: var(--text-primary);
                            flex-grow: 1;
                        }
                        .projection-points {
                            font-size: 2rem;
                            font-weight: 800;
                            color: var(--primary-color);
                        }
                        .projection-footer {
                            text-align: center;
                            margin-top: var(--spacing-lg);
                            padding-top: var(--spacing-md);
                            border-top: 1px solid var(--border-color);
                            font-size: 0.9rem;
                            color: var(--text-secondary);
                        }
                    </style>
                </head>
                <body>
                    ${projectionContent}
                </body>
                </html>
            `);
            newWindow.document.close();
        } else {
            Utils.showToast('无法打开投影窗口，请检查浏览器设置。', 'error');
        }
    }
}
