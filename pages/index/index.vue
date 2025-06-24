<template>
	<view class="container">
		<!-- 输入区域 -->
		<view class="input-section">
			<view class="board-info">
				<text class="section-title">板材规格</text>
				<view class="board-size-inputs">
					<view class="input-group">
						<text>长：</text>
						<input type="digit" v-model="boardLength" placeholder="长度(cm)" @blur="validateBoardSize" />
						<text>cm</text>
					</view>
					<text class="multiply-symbol">×</text>
					<view class="input-group">
						<text>宽：</text>
						<input type="digit" v-model="boardWidth" placeholder="宽度(cm)" @blur="validateBoardSize" />
						<text>cm</text>
					</view>
					<button class="reset-btn" @click="resetBoardSize">重置默认</button>
				</view>
			</view>
			
			<view class="cut-list">
				<text class="section-title">裁切需求</text>
				<view class="cut-item" v-for="(item, index) in cutRequests" :key="index">
					<view class="input-group">
						<input type="digit" v-model="item.width" placeholder="宽度(cm)" />
						<input type="number" v-model="item.count" placeholder="数量" />
						<button class="delete-btn" @click="deleteRequest(index)" v-if="cutRequests.length > 1">×</button>
					</view>
				</view>
				<button class="add-btn" @click="addRequest">添加需求</button>
			</view>
			
			<button class="calculate-btn" @click="calculate">计算方案</button>
		</view>

		<!-- 结果展示区域 -->
		<view class="result-section" v-if="results.length">
			<text class="section-title">裁切方案</text>
			<view class="total-info">
				<text>共需要 {{results.length}} 块板材</text>
				<text>总废料率: {{wasteRate}}%</text>
			</view>
			
			<!-- 图形化展示 -->
			<scroll-view scroll-y class="boards-view">
				<view class="board-item" v-for="(board, boardIndex) in results" :key="boardIndex">
					<view class="board-header">
						<text class="board-title">板材 {{boardIndex + 1}}</text>
						<text class="board-remain">剩余: {{board.remain}}cm</text>
					</view>
					<view class="board-visual-container">
						<!-- 标尺 -->
						<view class="ruler">
							<text v-for="i in 12" :key="i" class="ruler-mark">{{i * 10}}</text>
						</view>
						<!-- 板材可视化 -->
						<view class="board-visual">
							<view 
								v-for="(piece, pieceIndex) in board.pieces" 
								:key="pieceIndex"
								class="piece"
								:style="{
									width: (piece.width / boardWidth * 100) + '%',
									backgroundColor: getRandomColor(piece.width)
								}"
							>
								<text class="piece-width">{{piece.width}}cm</text>
								<view class="piece-grid"></view>
							</view>
							<view 
								v-if="board.remain > 0"
								class="piece remain"
								:style="{
									width: (board.remain / boardWidth * 100) + '%'
								}"
							>
								<text class="piece-width">{{board.remain}}cm</text>
								<view class="piece-grid"></view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 历史记录 -->
		<view class="history-section">
			<text class="section-title">历史记录</text>
			<scroll-view scroll-y class="history-list">
				<view class="history-item" v-for="(history, index) in histories" :key="index" @click="loadHistory(index)">
					<text class="history-date">{{history.date}}</text>
					<text class="history-board-size">{{history.boardLength}}×{{history.boardWidth}}cm</text>
					<text class="history-summary">{{history.totalBoards}}块板材 · {{history.totalPieces}}个裁片</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				boardLength: '244',
				boardWidth: '122',
				cutRequests: [{
					width: '',
					count: ''
				}],
				results: [],
				histories: [],
				colors: ['#2979ff', '#19be6b', '#ff9900', '#9c26b0', '#e51c23'],
			}
		},
		computed: {
			wasteRate() {
				if (!this.results.length) return 0;
				const totalArea = this.results.length * parseFloat(this.boardLength) * parseFloat(this.boardWidth);
				const usedArea = this.results.reduce((sum, board) => {
					return sum + board.pieces.reduce((s, p) => s + p.width * parseFloat(this.boardLength), 0);
				}, 0);
				return ((totalArea - usedArea) / totalArea * 100).toFixed(2);
			}
		},
		onLoad() {
			// 加载历史记录
			const histories = uni.getStorageSync('cut-histories') || [];
			this.histories = histories;
		},
		methods: {
			validateBoardSize() {
				const length = parseFloat(this.boardLength);
				const width = parseFloat(this.boardWidth);
				
				if (!length || !width || length <= 0 || width <= 0) {
					uni.showToast({
						title: '板材尺寸必须大于0',
						icon: 'none'
					});
					this.resetBoardSize();
					return false;
				}

				// 添加最大值限制
				const MAX_SIZE = 10000; // 100米，合理的板材最大尺寸
				if (length > MAX_SIZE || width > MAX_SIZE) {
					uni.showToast({
						title: '板材尺寸不能超过100米',
						icon: 'none'
					});
					this.resetBoardSize();
					return false;
				}
				
				// 四舍五入到2位小数
				this.boardLength = this.formatNumber(length);
				this.boardWidth = this.formatNumber(width);
				return true;
			},
			// 格式化数字，处理精度问题
			formatNumber(num) {
				// 处理科学计数法并保留10位，确保精度
				let str = Number(num).toFixed(10);
				// 转换为数字以去除末尾多余的0
				let value = parseFloat(str);
				// 如果是整数，直接返回
				if (Number.isInteger(value)) {
					return value.toString();
				}
				// 如果是小数，保留两位
				return value.toFixed(2);
			},
			resetBoardSize() {
				this.boardLength = '244';
				this.boardWidth = '122';
			},
			addRequest() {
				this.cutRequests.push({
					width: '',
					count: ''
				});
			},
			deleteRequest(index) {
				this.cutRequests.splice(index, 1);
			},
			getRandomColor(width) {
				return this.colors[width % this.colors.length];
			},
			validate() {
				if (!this.validateBoardSize()) return false;
				
				const MAX_PIECES = 1000; // 单次最大裁切数量
				let totalPieces = 0;
				
				for (let req of this.cutRequests) {
					if (!req.width || !req.count) {
						uni.showToast({
							title: '请填写完整的宽度和数量',
							icon: 'none'
						});
						return false;
					}
					const width = parseFloat(req.width);
					const count = parseInt(req.count);
					
					if (width > parseFloat(this.boardWidth)) {
						uni.showToast({
							title: '裁切宽度不能超过板材宽度',
							icon: 'none'
						});
						return false;
					}
					if (width <= 0 || count <= 0) {
						uni.showToast({
							title: '宽度和数量必须大于0',
							icon: 'none'
						});
						return false;
					}
					
					// 检查单个需求的数量上限
					if (count > MAX_PIECES) {
						uni.showToast({
							title: '单个尺寸数量不能超过1000',
							icon: 'none'
						});
						return false;
					}
					
					totalPieces += count;
					// 检查总数量上限
					if (totalPieces > MAX_PIECES) {
						uni.showToast({
							title: '总裁切数量不能超过1000',
							icon: 'none'
						});
						return false;
					}
					
					// 格式化宽度为2位小数
					req.width = this.formatNumber(width);
				}
				return true;
			},
			calculate() {
				if (!this.validate()) return;
				
				// 转换输入数据
				const requests = this.cutRequests.map(req => ({
					width: parseFloat(req.width),
					count: parseInt(req.count)
				}));
				
				// 计算裁切方案
				const results = this.calculateCutPlan(requests);
				
				// 格式化结果中的数字
				results.forEach(board => {
					board.remain = this.formatNumber(board.remain);
					board.pieces.forEach(piece => {
						piece.width = this.formatNumber(piece.width);
					});
				});
				
				this.results = results;
				
				// 保存到历史记录
				const history = {
					date: new Date().toLocaleString(),
					boardLength: this.boardLength,
					boardWidth: this.boardWidth,
					requests: this.cutRequests.map(req => ({
						width: this.formatNumber(req.width),
						count: req.count
					})),
					results: results,
					totalBoards: results.length,
					totalPieces: requests.reduce((sum, req) => sum + req.count, 0)
				};
				
				this.histories.unshift(history);
				if (this.histories.length > 20) this.histories.pop(); // 最多保存20条记录
				uni.setStorageSync('cut-histories', this.histories);
			},
			calculateCutPlan(requests) {
				// 将所有需求拆成单个裁片
				let pieces = [];
				requests.forEach(req => {
					for (let i = 0; i < req.count; i++) {
						pieces.push(parseFloat(req.width));
					}
				});
				// 按宽度从大到小排序（通常更优）
				pieces.sort((a, b) => b - a);

				let boards = [];
				const boardWidth = parseFloat(this.boardWidth);
				
				for (let width of pieces) {
					let placed = false;
					// 使用精确计算处理小数
					for (let board of boards) {
						const remainWidth = parseFloat(board.remain);
						// 添加一个小的容差值(0.01)来处理浮点数计算误差
						if (remainWidth >= width - 0.01) {
							board.pieces.push({ width: this.formatNumber(width) });
							board.remain = this.formatNumber(remainWidth - width);
							placed = true;
							break;
						}
					}
					if (!placed) {
						boards.push({
							pieces: [{ width: this.formatNumber(width) }],
							remain: this.formatNumber(boardWidth - width)
						});
					}
				}
				return boards;
			},
			loadHistory(index) {
				const history = this.histories[index];
				this.boardLength = history.boardLength;
				this.boardWidth = history.boardWidth;
				this.cutRequests = JSON.parse(JSON.stringify(history.requests));
				this.results = history.results;
			}
		}
	}
</script>

<style>
.container {
	padding: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	margin: 20rpx 0;
	color: #333;
}

.board-info {
	background-color: #f8f8f8;
	padding: 20rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
}

.board-size-inputs {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-top: 10rpx;
}

.multiply-symbol {
	font-size: 32rpx;
	color: #666;
}

.board-size-inputs .input-group {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.board-size-inputs input {
	width: 120rpx;
	height: 70rpx;
	border: 1rpx solid #ddd;
	border-radius: 6rpx;
	padding: 0 20rpx;
}

.reset-btn {
	font-size: 24rpx;
	padding: 0 20rpx;
	height: 60rpx;
	line-height: 60rpx;
	background-color: #f0f0f0;
	color: #666;
}

.cut-list {
	background-color: #fff;
	padding: 20rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
}

.cut-item {
	margin-bottom: 20rpx;
}

.input-group {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.input-group input {
	flex: 1;
	height: 70rpx;
	border: 1rpx solid #ddd;
	border-radius: 6rpx;
	padding: 0 20rpx;
}

.delete-btn {
	width: 70rpx;
	height: 70rpx;
	line-height: 70rpx;
	text-align: center;
	background-color: #f56c6c;
	color: #fff;
	border-radius: 6rpx;
	padding: 0;
}

.add-btn {
	background-color: #2979ff;
	color: #fff;
	margin: 20rpx 0;
}

.calculate-btn {
	background-color: #19be6b;
	color: #fff;
	margin: 20rpx 0;
}

.result-section {
	background-color: #fff;
	padding: 20rpx;
	border-radius: 10rpx;
	margin-bottom: 20rpx;
}

.total-info {
	display: flex;
	justify-content: space-between;
	color: #666;
	font-size: 28rpx;
	margin-bottom: 20rpx;
}

.boards-view {
	height: 600rpx;
	background: #fff;
	padding: 20rpx;
	border-radius: 10rpx;
}

.board-item {
	background-color: #f8f8f8;
	padding: 20rpx;
	border-radius: 10rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
}

.board-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 20rpx;
	align-items: center;
}

.board-title {
	font-size: 32rpx;
	color: #333;
	font-weight: bold;
}

.board-remain {
	font-size: 28rpx;
	color: #666;
	background: #f0f0f0;
	padding: 4rpx 16rpx;
	border-radius: 20rpx;
}

.board-visual-container {
	position: relative;
	margin-top: 30rpx;
}

.ruler {
	display: flex;
	justify-content: space-between;
	padding: 0 20rpx;
	margin-bottom: 10rpx;
}

.ruler-mark {
	font-size: 20rpx;
	color: #999;
	transform: translateX(-50%);
}

.board-visual {
	height: 100rpx;
	display: flex;
	background-color: #fff;
	border: 2rpx solid #ddd;
	border-radius: 6rpx;
	overflow: hidden;
	position: relative;
}

.piece {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	border-right: 2rpx solid rgba(255,255,255,0.3);
}

.piece-width {
	color: #fff;
	font-size: 26rpx;
	font-weight: bold;
	text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.2);
	z-index: 1;
}

.piece-grid {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-image: linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
					  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
	background-size: 20rpx 20rpx;
}

.piece.remain {
	background-color: #f5f5f5;
}

.piece.remain .piece-width {
	color: #999;
	text-shadow: none;
}

.piece.remain .piece-grid {
	background-image: linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
					  linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px);
}

.history-section {
	background-color: #fff;
	padding: 20rpx;
	border-radius: 10rpx;
}

.history-list {
	height: 300rpx;
}

.history-item {
	padding: 20rpx;
	border-bottom: 1rpx solid #eee;
}

.history-date {
	font-size: 24rpx;
	color: #999;
}

.history-board-size {
	font-size: 24rpx;
	color: #666;
	margin-left: 20rpx;
}

.history-summary {
	font-size: 28rpx;
	color: #333;
	margin-top: 10rpx;
}
</style>
