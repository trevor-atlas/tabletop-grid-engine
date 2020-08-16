interface Cell {
	color: string;
	entity: string;
}

export class Engine {
	private renderingContext: HTMLElement;
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
	private canvas: HTMLCanvasElement;

	private rows: number;
	private columns: number;

	constructor(rows: number, columns: number) {
		this.canvas = document.createElement('canvas');
		this.renderingContext = document.querySelector('#renderingContext');
		this.renderingContext.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');

		this.drawing = false;
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		this.genGrid(rows, columns);

		this.canvas.addEventListener('contextmenu', (e) => {
			if (e.button == 2) {
				// Block right-click menu thru preventing default action.
				e.preventDefault();
				return false;
			}
		});

		this.canvas.onmousedown = ({ button, clientX, clientY }) => {
			this.drawing = true;
			const { left, top } = this.canvas.getBoundingClientRect();
			const { xOffset, yOffset } = this.getScaledOffsets();
			const mx = clientX - left - xOffset;
			const my = clientY - top - yOffset;
			this.mouseBeginOrigin = { x: mx, y: my };
			this.activeMouseButton = button;
			switch (this.activeMouseButton) {
				case 2:
					this.canvas.style = 'cursor: grabbing';
			}
		};

		this.canvas.addEventListener('click', ({ clientX, clientY }) => {
			const { left, top } = this.canvas.getBoundingClientRect();
			const { xOffset, yOffset } = this.getScaledOffsets();
			const mx = (clientX - left - xOffset) >> 0;
			const my = (clientY - top - yOffset) >> 0;
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

		this.canvas.onmousemove = ({
			clientX,
			clientY,
			button,
		}: MouseEvent) => {
			event.stopPropagation();
			const { left, top } = this.canvas.getBoundingClientRect();
			const { xOffset, yOffset } = this.getScaledOffsets();
			const mx = (clientX - left - xOffset) >> 0;
			const my = (clientY - top - yOffset) >> 0;
			switch (this.activeMouseButton) {
				case 2:
					const x = -(this.mouseBeginOrigin.x - mx);
					const y = -(this.mouseBeginOrigin.y - my);
					this.scrollX = this.clamp(
						(this.scrollX + Math.min(x, this.cellSize)) >> 0,
						Math.min(-this.width * 2, -this.vwidth * 2),
						Math.max(this.width * 2, this.vwidth * 2)
					);
					this.scrollY = this.clamp(
						this.scrollY + Math.min(y, this.cellSize),
						Math.min(-this.height * 2, -this.vheight * 2),
						Math.max(this.height * 2, this.vheight * 2)
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
		this.canvas.onmouseup = () => {
			this.drawing = false;
			this.mouseBeginOrigin = null;
			this.canvas.style = '';
			this.activeMouseButton = null;
		};
		this.renderingContext.onwheel = this.zoomIn;
	}

	public get vwidth() {
		return (this.columns * this.cellSize) >> 0;
	}

	public get vheight() {
		return (this.rows * this.cellSize) >> 0;
	}

	public get cellSize() {
		return 200;
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
		const mx = x - left - xOffset;
		const my = y - top - yOffset;

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
		this.ctx.lineWidth = 4;
		this.ctx.lineJoin = 'round';
		this.ctx.fillStyle = color;
		if (
			x + xOffset + this.cellSize < 0 ||
			x + xOffset - this.cellSize > this.width ||
			y + yOffset + this.cellSize < 0 ||
			y + yOffset - this.cellSize > this.height
		)
			return;
		this.ctx.strokeRect(x + xOffset, y + yOffset, size, size);
		this.ctx.fillRect(x + xOffset, y + yOffset, size, size);
	};

	public drawGrid = () => {
		this.ctx.clearRect(0, 0, this.width, this.height);
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.columns; col++) {
				requestAnimationFrame(() => {
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
				});
			}
		}
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
		this.rows = this.clamp(rows, 3, 50);
		this.columns = this.clamp(columns, 3, 50);

		console.log({ rows: this.rows, columns: this.columns });
		this.grid = Array(this.rows)
			.fill(null)
			.map(() => Array(this.columns).fill(null));
		console.log(this.grid);

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.columns; col++) {
				this.grid[row][col] = { color: 'lightgreen', entity: null };
			}
		}
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
		this.renderingContext.style = `transform: scale(${this.zoom})`;
	};

	private clamp = (n: number, min: number, max: number) => {
		return Math.min(max, Math.max(n, min));
	};
}
