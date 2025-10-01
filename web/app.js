// State
let cutRequests = [];
let results = [];
let histories = [];
const colors = ['#2979ff', '#19be6b', '#ff9900', '#9c26b0', '#e51c23'];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadHistories();
    addRequest();
});

// Board Size Functions
function resetBoardSize() {
    document.getElementById('boardLength').value = '244';
    document.getElementById('boardWidth').value = '122';
}

function formatNumber(num) {
    let str = Number(num).toFixed(10);
    let value = parseFloat(str);
    if (Number.isInteger(value)) {
        return value.toString();
    }
    return value.toFixed(2);
}

// Cut Request Functions
function addRequest() {
    const container = document.getElementById('cutRequests');
    const index = cutRequests.length;

    cutRequests.push({ width: '', count: '' });

    const div = document.createElement('div');
    div.className = 'cut-item';
    div.innerHTML = `
        <div class="input-group">
            <input type="number" placeholder="宽度(cm)" oninput="updateRequest(${index}, 'width', this.value)">
            <input type="number" placeholder="数量" oninput="updateRequest(${index}, 'count', this.value)">
            ${cutRequests.length > 1 ? `<button class="delete-btn" onclick="deleteRequest(${index})">×</button>` : ''}
        </div>
    `;

    container.appendChild(div);
}

function updateRequest(index, field, value) {
    cutRequests[index][field] = value;
}

function deleteRequest(index) {
    if (cutRequests.length <= 1) return;

    cutRequests.splice(index, 1);
    renderCutRequests();
}

function renderCutRequests() {
    const container = document.getElementById('cutRequests');
    container.innerHTML = '';

    const tempRequests = [...cutRequests];
    cutRequests = [];

    tempRequests.forEach(req => {
        const currentIndex = cutRequests.length;
        cutRequests.push(req);

        const div = document.createElement('div');
        div.className = 'cut-item';
        div.innerHTML = `
            <div class="input-group">
                <input type="number" placeholder="宽度(cm)" value="${req.width}" oninput="updateRequest(${currentIndex}, 'width', this.value)">
                <input type="number" placeholder="数量" value="${req.count}" oninput="updateRequest(${currentIndex}, 'count', this.value)">
                ${cutRequests.length > 1 ? `<button class="delete-btn" onclick="deleteRequest(${currentIndex})">×</button>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// Validation
function validate() {
    const boardLength = parseFloat(document.getElementById('boardLength').value);
    const boardWidth = parseFloat(document.getElementById('boardWidth').value);

    if (!boardLength || !boardWidth || boardLength <= 0 || boardWidth <= 0) {
        alert('板材尺寸必须大于0');
        return false;
    }

    const MAX_SIZE = 10000;
    if (boardLength > MAX_SIZE || boardWidth > MAX_SIZE) {
        alert('板材尺寸不能超过100米');
        return false;
    }

    const MAX_PIECES = 1000;
    let totalPieces = 0;

    for (let req of cutRequests) {
        if (!req.width || !req.count) {
            alert('请填写完整的宽度和数量');
            return false;
        }

        const width = parseFloat(req.width);
        const count = parseInt(req.count);

        if (width > boardWidth) {
            alert('裁切宽度不能超过板材宽度');
            return false;
        }

        if (width <= 0 || count <= 0) {
            alert('宽度和数量必须大于0');
            return false;
        }

        if (count > MAX_PIECES) {
            alert('单个尺寸数量不能超过1000');
            return false;
        }

        totalPieces += count;
        if (totalPieces > MAX_PIECES) {
            alert('总裁切数量不能超过1000');
            return false;
        }
    }

    return true;
}

// Calculate
function calculate() {
    if (!validate()) return;

    const boardWidth = parseFloat(document.getElementById('boardWidth').value);
    const boardLength = parseFloat(document.getElementById('boardLength').value);

    // Convert requests
    const requests = cutRequests.map(req => ({
        width: parseFloat(req.width),
        count: parseInt(req.count)
    }));

    // Calculate cutting plan
    results = calculateCutPlan(requests, boardWidth);

    // Format results
    results.forEach(board => {
        board.remain = formatNumber(board.remain);
        board.pieces.forEach(piece => {
            piece.width = formatNumber(piece.width);
        });
    });

    // Display results
    displayResults(boardLength, boardWidth);

    // Save to history
    saveHistory(boardLength, boardWidth, requests, results);
}

function calculateCutPlan(requests, boardWidth) {
    // Expand all requests into individual pieces
    let pieces = [];
    requests.forEach(req => {
        for (let i = 0; i < req.count; i++) {
            pieces.push(parseFloat(req.width));
        }
    });

    // Sort by width (largest first)
    pieces.sort((a, b) => b - a);

    let boards = [];

    for (let width of pieces) {
        let placed = false;

        for (let board of boards) {
            const remainWidth = parseFloat(board.remain);
            if (remainWidth >= width - 0.01) {
                board.pieces.push({ width: formatNumber(width) });
                board.remain = formatNumber(remainWidth - width);
                placed = true;
                break;
            }
        }

        if (!placed) {
            boards.push({
                pieces: [{ width: formatNumber(width) }],
                remain: formatNumber(boardWidth - width)
            });
        }
    }

    return boards;
}

function displayResults(boardLength, boardWidth) {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('hidden');

    // Calculate waste rate
    const totalArea = results.length * boardLength * boardWidth;
    const usedArea = results.reduce((sum, board) => {
        return sum + board.pieces.reduce((s, p) => s + parseFloat(p.width) * boardLength, 0);
    }, 0);
    const wasteRate = ((totalArea - usedArea) / totalArea * 100).toFixed(2);

    document.getElementById('totalBoards').textContent = `共需要 ${results.length} 块板材`;
    document.getElementById('wasteRate').textContent = `总废料率: ${wasteRate}%`;

    // Display boards
    const boardsView = document.getElementById('boardsView');
    boardsView.innerHTML = '';

    results.forEach((board, boardIndex) => {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'board-item';

        let piecesHTML = '';
        board.pieces.forEach((piece, pieceIndex) => {
            const percentage = (parseFloat(piece.width) / boardWidth * 100);
            const color = colors[pieceIndex % colors.length];
            piecesHTML += `
                <div class="piece" style="width: ${percentage}%; background-color: ${color};">
                    <span class="piece-width">${piece.width}cm</span>
                </div>
            `;
        });

        if (board.remain > 0) {
            const percentage = (parseFloat(board.remain) / boardWidth * 100);
            piecesHTML += `
                <div class="piece remain" style="width: ${percentage}%;">
                    <span class="piece-width">${board.remain}cm</span>
                </div>
            `;
        }

        boardDiv.innerHTML = `
            <div class="board-header">
                <span class="board-title">板材 ${boardIndex + 1}</span>
                <span class="board-remain">剩余: ${board.remain}cm</span>
            </div>
            <div class="board-visual">
                ${piecesHTML}
            </div>
        `;

        boardsView.appendChild(boardDiv);
    });
}

// History Functions
function saveHistory(boardLength, boardWidth, requests, results) {
    const history = {
        date: new Date().toLocaleString(),
        boardLength: formatNumber(boardLength),
        boardWidth: formatNumber(boardWidth),
        requests: requests.map(req => ({
            width: formatNumber(req.width),
            count: req.count
        })),
        results: results,
        totalBoards: results.length,
        totalPieces: requests.reduce((sum, req) => sum + req.count, 0)
    };

    histories.unshift(history);
    if (histories.length > 20) histories.pop();

    localStorage.setItem('cut-histories', JSON.stringify(histories));
    displayHistories();
}

function loadHistories() {
    const stored = localStorage.getItem('cut-histories');
    if (stored) {
        histories = JSON.parse(stored);
        displayHistories();
    }
}

function displayHistories() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (histories.length === 0) {
        historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暂无历史记录</div>';
        return;
    }

    histories.forEach((history, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => loadHistory(index);
        div.innerHTML = `
            <span class="history-date">${history.date}</span>
            <span class="history-board-size">${history.boardLength}×${history.boardWidth}cm</span>
            <div class="history-summary">${history.totalBoards}块板材 · ${history.totalPieces}个裁片</div>
        `;
        historyList.appendChild(div);
    });
}

function loadHistory(index) {
    const history = histories[index];

    document.getElementById('boardLength').value = history.boardLength;
    document.getElementById('boardWidth').value = history.boardWidth;

    cutRequests = JSON.parse(JSON.stringify(history.requests));
    renderCutRequests();

    results = history.results;
    displayResults(parseFloat(history.boardLength), parseFloat(history.boardWidth));
}
