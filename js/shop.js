class ShopManager {
    static goods = [];

    static init() {
        this.loadGoods();
        this.renderGoodsList();
    }

    static loadGoods() {
        this.goods = StorageManager.getItem('shopGoods', [
            { id: Utils.generateUUID(), name: '精美文具套装', description: '包含笔、本、橡皮等实用文具', pointsCost: 20, imageUrl: 'https://via.placeholder.com/150/8B5CF6/FFFFFF?text=文具', stock: 10 },
            { id: Utils.generateUUID(), name: '卡通贴纸包', description: '多种可爱卡通形象贴纸，点缀你的生活', pointsCost: 10, imageUrl: 'https://via.placeholder.com/150/EC4899/FFFFFF?text=贴纸', stock: 25 },
            { id: Utils.generateUUID(), name: '定制笔记本', description: '可印制姓名或班级口号的专属笔记本', pointsCost: 30, imageUrl: 'https://via.placeholder.com/150/3B82F6/FFFFFF?text=笔记本', stock: 5 },
            { id: Utils.generateUUID(), name: '电影兑换券', description: '电影院观影券一张，享受周末时光', pointsCost: 50, imageUrl: 'https://via.placeholder.com/150/10B981/FFFFFF?text=电影票', stock: 3 },
        ]);
    }

    static saveGoods() {
        StorageManager.saveItem('shopGoods', this.goods);
    }

    static getGoodById(id) {
        return this.goods.find(good => good.id === id);
    }

    static renderGoodsList() {
        const goodsListContainer = document.getElementById('goodsList');
        if (!goodsListContainer) return;

        if (this.goods.length === 0) {
            goodsListContainer.innerHTML = '<p class="empty-state">商城暂无商品。点击 "新增商品" 添加。</p>';
            return;
        }

        const html = this.goods.map(good => `
            <div class="good-card" data-good-id="${good.id}">
                <img src="${good.imageUrl}" alt="${good.name}" class="good-image">
                <div class="good-info">
                    <div class="good-name">${good.name}</div>
                    <div class="good-description">${good.description}</div>
                    <div class="good-price"><span class="icon">⭐</span>${good.pointsCost} 积分</div>
                </div>
                <div class="good-card-footer">
                    <div class="good-stock">库存: ${good.stock}</div>
                    <button class="btn btn-primary btn-sm exchange-good-btn" data-good-id="${good.id}" ${good.stock <= 0 ? 'disabled' : ''}>
                        <span class="icon">兑换</span>
                    </button>
                    <button class="btn btn-secondary btn-sm edit-good-btn" data-good-id="${good.id}">
                        <span class="icon">✏️</span>编辑
                    </button>
                    <button class="btn btn-danger btn-sm delete-good-btn" data-good-id="${good.id}">
                        <span class="icon">🗑️</span>删除
                    </button>
                </div>
            </div>
        `).join('');

        goodsListContainer.innerHTML = html;
        this.bindShopEvents();
    }

    static bindShopEvents() {
        const goodsListContainer = document.getElementById('goodsList');
        if (!goodsListContainer) return;

        goodsListContainer.addEventListener('click', (e) => {
            const goodCard = e.target.closest('.good-card');
            if (!goodCard) return;

            const goodId = goodCard.dataset.goodId;

            if (e.target.classList.contains('exchange-good-btn')) {
                this.showExchangeDialog(goodId);
            } else if (e.target.classList.contains('edit-good-btn')) {
                this.showEditDialog(goodId);
            } else if (e.target.classList.contains('delete-good-btn')) {
                this.deleteGood(goodId);
            }
        });

        document.getElementById('addGoodBtn').addEventListener('click', () => this.showAddDialog());
    }

    static showAddDialog() {
        UIManager.showModal(
            '新增商品',
            `
                <form id="addGoodForm" class="modal-form">
                    <div class="form-group">
                        <label for="addGoodName">商品名称</label>
                        <input type="text" id="addGoodName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="addGoodDescription">商品描述 (可选)</label>
                        <textarea id="addGoodDescription" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="addGoodPointsCost">所需积分</label>
                        <input type="number" id="addGoodPointsCost" class="form-control" value="10" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="addGoodStock">库存</label>
                        <input type="number" id="addGoodStock" class="form-control" value="1" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="addGoodImageUrl">图片 URL (可选)</label>
                        <input type="text" id="addGoodImageUrl" class="form-control" placeholder="图片URL">
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('addGoodName').value;
                const description = document.getElementById('addGoodDescription').value;
                const pointsCost = parseInt(document.getElementById('addGoodPointsCost').value);
                const stock = parseInt(document.getElementById('addGoodStock').value);
                const imageUrl = document.getElementById('addGoodImageUrl').value;

                if (!name) {
                    Utils.showToast('商品名称不能为空！', 'error');
                    return false;
                }
                if (isNaN(pointsCost) || pointsCost <= 0) {
                    Utils.showToast('所需积分必须是正整数！', 'error');
                    return false;
                }
                if (isNaN(stock) || stock < 0) {
                    Utils.showToast('库存必须是大于等于0的整数！', 'error');
                    return false;
                }

                this.addGood({ name, description, pointsCost, stock, imageUrl });
                this.renderGoodsList(); // Re-render after adding
                return true;
            }
        );
    }

    static addGood(good) {
        good.id = Utils.generateUUID();
        this.goods.push(good);
        this.saveGoods();
        Utils.showToast('商品添加成功！', 'success');
    }

    static showEditDialog(goodId) {
        const good = this.getGoodById(goodId);
        if (!good) return;

        UIManager.showModal(
            `编辑商品: ${good.name}`,
            `
                <form id="editGoodForm" class="modal-form">
                    <div class="form-group">
                        <label for="editGoodName">商品名称</label>
                        <input type="text" id="editGoodName" class="form-control" value="${good.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editGoodDescription">商品描述 (可选)</label>
                        <textarea id="editGoodDescription" class="form-control">${good.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="editGoodPointsCost">所需积分</label>
                        <input type="number" id="editGoodPointsCost" class="form-control" value="${good.pointsCost}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="editGoodStock">库存</label>
                        <input type="number" id="editGoodStock" class="form-control" value="${good.stock}" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="editGoodImageUrl">图片 URL (可选)</label>
                        <input type="text" id="editGoodImageUrl" class="form-control" value="${good.imageUrl || ''}" placeholder="图片URL">
                    </div>
                </form>
            `,
            () => {
                const name = document.getElementById('editGoodName').value;
                const description = document.getElementById('editGoodDescription').value;
                const pointsCost = parseInt(document.getElementById('editGoodPointsCost').value);
                const stock = parseInt(document.getElementById('editGoodStock').value);
                const imageUrl = document.getElementById('editGoodImageUrl').value;

                if (!name) {
                    Utils.showToast('商品名称不能为空！', 'error');
                    return false;
                }
                if (isNaN(pointsCost) || pointsCost <= 0) {
                    Utils.showToast('所需积分必须是正整数！', 'error');
                    return false;
                }
                if (isNaN(stock) || stock < 0) {
                    Utils.showToast('库存必须是大于等于0的整数！', 'error');
                    return false;
                }

                this.updateGood(goodId, { name, description, pointsCost, stock, imageUrl });
                this.renderGoodsList(); // Re-render after updating
                return true;
            }
        );
    }

    static updateGood(goodId, updatedGood) {
        const index = this.goods.findIndex(good => good.id === goodId);
        if (index !== -1) {
            this.goods[index] = { ...this.goods[index], ...updatedGood };
            this.saveGoods();
            Utils.showToast('商品信息更新成功！', 'success');
        }
    }

    static deleteGood(goodId) {
        UIManager.showModal(
            '确认删除商品',
            '确定要删除这件商品吗？此操作不可撤销！',
            () => {
                this.goods = this.goods.filter(good => good.id !== goodId);
                this.saveGoods();
                this.renderGoodsList(); // Re-render after deleting
                Utils.showToast('商品删除成功！', 'success');
            }
        );
    }

    static showExchangeDialog(goodId) {
        const good = this.getGoodById(goodId);
        if (!good) return;

        if (good.stock <= 0) {
            Utils.showToast('该商品库存不足！', 'error');
            return;
        }

        const students = StudentManager.students.filter(s => s.points >= good.pointsCost);

        if (students.length === 0) {
            UIManager.showModal(
                '兑换商品',
                `<p>没有学生积分足够兑换 <b>${good.name}</b>。</p>`,
                () => {},
                false
            );
            return;
        }

        const studentOptions = students.map(student => `
            <option value="${student.id}">${student.name} (${student.points} 积分)</option>
        `).join('');

        UIManager.showModal(
            `兑换商品: ${good.name}`,
            `
                <form id="exchangeGoodForm" class="modal-form">
                    <p>所需积分: <span class="icon">⭐</span><b>${good.pointsCost}</b></p>
                    <div class="form-group">
                        <label for="exchangeStudentSelect">选择兑换学生</label>
                        <select id="exchangeStudentSelect" class="form-control" required>
                            <option value="">请选择学生</option>
                            ${studentOptions}
                        </select>
                    </div>
                </form>
            `,
            () => {
                const studentId = document.getElementById('exchangeStudentSelect').value;
                if (!studentId) {
                    Utils.showToast('请选择兑换学生！', 'error');
                    return false;
                }
                this.exchangeGood(goodId, studentId);
                return true;
            }
        );
    }

    static exchangeGood(goodId, studentId) {
        const good = this.getGoodById(goodId);
        const student = StudentManager.getStudentById(studentId);

        if (!good || !student) {
            Utils.showToast('商品或学生不存在！', 'error');
            return;
        }

        if (good.stock <= 0) {
            Utils.showToast('该商品库存不足！', 'error');
            return;
        }

        if (student.points < good.pointsCost) {
            Utils.showToast(`${student.name} 的积分不足以兑换 ${good.name}！`, 'error');
            return;
        }

        // Perform exchange
        student.points -= good.pointsCost;
        good.stock--;

        // Add to student history (optional, but good for tracking)
        student.history.unshift({
            id: Utils.generateUUID(),
            type: 'exchange',
            points: -good.pointsCost,
            reason: `兑换商品: ${good.name}`,
            timestamp: Date.now()
        });

        StudentManager.saveStudents();
        this.saveGoods();
        this.renderGoodsList(); // Re-render shop to update stock/buttons
        StudentManager.renderStudentList(); // Re-render student list to update points
        Utils.showToast(`${student.name} 成功兑换 ${good.name}！`, 'success');
    }
}
