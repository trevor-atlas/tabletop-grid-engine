interface Cell {
	color: string;
	entity: string;
}

export class Engine {
	private ctx: CanvasRenderingContext2D;
	private width: number;
	private height: number;
	private grid: Cell[][];
	private timer: number;
	private zoom = 1;
	private drawing: boolean;
	private scrollX: number = 0;
	private scrollY: number = 0;
	private mouseBeginOrigin: { x: number; y: number };
	private activeMouseButton: number;

	constructor(
		private canvas: HTMLCanvasElement,
		private rows: number,
		private columns: number
	) {
		this.drawing = false;
		this.ctx = canvas.getContext('2d');
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		canvas.addEventListener('contextmenu', (e) => {
			if (e.button == 2) {
				// Block right-click menu thru preventing default action.
				e.preventDefault();
				return false;
			}
		});

		canvas.onmousedown = ({ button, clientX, clientY }) => {
			this.drawing = true;
			const { left, top } = this.canvas.getBoundingClientRect();
			const { xOffset, yOffset } = this.getScaledOffsets();
			const mx = (clientX - left - xOffset) * this.zoom;
			const my = (clientY - top - yOffset) * this.zoom;
			this.mouseBeginOrigin = { x: mx, y: my };
			this.activeMouseButton = button;
			switch (this.activeMouseButton) {
				case 2:
					this.canvas.style = 'cursor: grabbing';
			}
		};

		canvas.addEventListener('click', ({ clientX, clientY }) => {
			const { left, top } = this.canvas.getBoundingClientRect();
			const { xOffset, yOffset } = this.getScaledOffsets();
			const mx = ((clientX - left - xOffset) * this.zoom) >> 0;
			const my = ((clientY - top - yOffset) * this.zoom) >> 0;
			// Do nothing if we are clicking outside a visible part of the virtual grid
			if (mx < 0 || mx > this.vwidth || my < 0 || my > this.vheight) {
				return;
			}
			const { row, col } = this.getSquare(clientX, clientY);
			if (this.grid[row][col].color !== 'gray') {
				this.grid[row][col].color = 'gray';
				this.drawGrid();
			}
		});

		canvas.onmousemove = ({ clientX, clientY, button }: MouseEvent) => {
			event.stopPropagation();
			const { left, top } = this.canvas.getBoundingClientRect();
			const { xOffset, yOffset } = this.getScaledOffsets();
			const mx = ((clientX - left - xOffset) * this.zoom) >> 0;
			const my = ((clientY - top - yOffset) * this.zoom) >> 0;
			switch (this.activeMouseButton) {
				case 2:
					const x = -(this.mouseBeginOrigin.x - mx);
					const y = -(this.mouseBeginOrigin.y - my);
					this.scrollX = this.clamp(
						(this.scrollX + x) >> 0,
						-this.width,
						this.width
					);
					this.scrollY = this.clamp(
						this.scrollY + y,
						-this.height,
						this.height
					);
					this.drawGrid();
					break;
				case 0:
					// Do nothing if we are clicking outside a visible part of the virtual grid
					if (
						mx < 0 ||
						mx > this.vwidth ||
						my < 0 ||
						my > this.vheight
					) {
						return;
					}
					if (this.drawing) {
						const { row, col } = this.getSquare(clientX, clientY);
						if (this.grid[row][col].color !== 'gray') {
							this.grid[row][col].color = 'gray';
							this.drawGrid();
						}
					}
					break;
			}
		};
		canvas.onmouseup = () => {
			this.drawing = false;
			this.mouseBeginOrigin = null;
			this.canvas.style = '';
			this.activeMouseButton = null;
		};
		canvas.onwheel = this.zoomIn;

		this.genGrid(rows, columns);
	}

	public get vwidth() {
		return (this.columns * this.cellSize * this.zoom) >> 0;
	}

	public get vheight() {
		return (this.rows * this.cellSize * this.zoom) >> 0;
	}

	public get cellSize() {
		return Math.floor(200 * this.zoom);
	}

	public ping = (row, col) => {
		if (this.grid[row][col].color === 'gray') {
			this.grid[row][col].color = 'lightgreen';
		} else {
			this.grid[row][col].color = 'gray';
		}
		this.drawGrid();
	};

	public getSquare = (x: number, y: number) => {
		const { left, top } = this.canvas.getBoundingClientRect();
		const { xOffset, yOffset } = this.getScaledOffsets();
		const mx = (x - left - xOffset) * this.zoom;
		const my = (y - top - yOffset) * this.zoom;

		const row = this.clamp(
			((my / this.vheight) * this.rows) >> 0,
			0,
			this.rows - 1
		);
		const col = this.clamp(
			((mx / this.vwidth) * this.columns) >> 0,
			0,
			this.columns - 1
		);

		return { row, col };
	};

	public clickSquare = (row, col) => {
		if (this.grid[row][col].color === 'gray') {
			this.grid[row][col].color = 'lightgreen';
		} else {
			this.grid[row][col].color = 'gray';
		}
		this.drawGrid();
	};

	private drawCell = (x: number, y: number, size: number, color: string) => {
		const { xOffset, yOffset } = this.getScaledOffsets();
		this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
		this.ctx.lineWidth = 2;
		this.ctx.lineJoin = 'round';
		this.ctx.fillStyle = color;
		this.ctx.strokeRect(x + xOffset, y + yOffset, size, size);
		this.ctx.fillRect(x + xOffset, y + yOffset, size, size);
	};

	public drawGrid = () => {
		requestAnimationFrame(() => {
			this.ctx.clearRect(0, 0, this.width, this.height);
			for (let row = 0; row < this.rows; row++) {
				for (let col = 0; col < this.columns; col++) {
					const { color } = this.grid[row][col];
					if (row === 0 && col === 0) {
						this.drawCell(row, col, this.cellSize, color);
					} else {
						this.drawCell(
							(col * this.cellSize) >> 0,
							(row * this.cellSize) >> 0,
							this.cellSize,
							color
						);
					}
				}
			}
		});
	};

	private getScaledOffsets = () => {
		const xOffset =
			(this.width / 2 -
				(this.columns * this.cellSize) / 2 +
				this.scrollX) >>
			0;

		const yOffset =
			(this.height / 2 -
				(this.rows * this.cellSize) / 2 +
				this.scrollY) >>
			0;
		return { xOffset, yOffset };
	};

	private genGrid = (rows: number, columns: number) => {
		const grid = Array(rows)
			.fill(null)
			.map(() => Array(columns).fill(null));

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < columns; col++) {
				grid[row][col] = { color: 'lightgreen', entity: null };
			}
		}
		console.log(grid);
		this.grid = grid;
		this.drawGrid();
	};

	private zoomIn = (event) => {
		event.preventDefault();

		let result = this.zoom;

		if (event.deltaY < 0) {
			// zoom in
			result += 0.02;
		} else {
			// zoom out
			result -= 0.02;
		}
		this.zoom = this.clamp(result, 0.05, 1);
		this.drawGrid();
	};

	private clamp = (n: number, min: number, max: number) => {
		return Math.min(max, Math.max(n, min));
	};
}
