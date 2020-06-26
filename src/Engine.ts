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

	constructor(
		private canvas: HTMLCanvasElement,
		private rows: number,
		private columns: number
	) {
		this.drawing = false;
		this.ctx = canvas.getContext('2d');
		const size = this.getCellSize();
		this.width = columns * size + 2;
		this.height = rows * size + 2;
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		canvas.onmousedown = () => {
			this.drawing = true;
		};
		canvas.onmousemove = (event: MouseEvent) => {
			event.stopPropagation();
			if (this.drawing) {
				const { left, top } = this.canvas.getBoundingClientRect();
				const { xOffset, yOffset } = this.getScaledOffsets();
				const { clientX, clientY } = event;
				const mx = clientX - left - xOffset;
				const my = clientY - top - yOffset;
				const vwidth = this.width * this.zoom;
				const vheight = this.height * this.zoom;
				// do nothing if we are clicking outside a visible part of the scalved grid
				if (mx < 0 || mx > vwidth) return;
				if (my < 0 || my > vheight) return;
				const { row, col } = this.getSquare(event);
				if (this.grid[row][col].color !== 'gray') {
					this.grid[row][col].color = 'gray';
					this.drawGrid();
				}
			}
		};
		canvas.onmouseup = () => {
			this.drawing = false;
		};
		canvas.onwheel = this.zoomIn;

		this.genGrid(rows, columns);
	}

	public getCellSize = () => {
		return Math.floor(50 * this.zoom);
	};

	public ping = (row, col) => {
		if (this.grid[row][col].color === 'gray') {
			this.grid[row][col].color = 'lightgreen';
		} else {
			this.grid[row][col].color = 'gray';
		}
		this.drawGrid();
	};

	public getSquare = ({ clientX, clientY }: MouseEvent) => {
		const { left, top } = this.canvas.getBoundingClientRect();
		const { xOffset, yOffset } = this.getScaledOffsets();
		const mx = clientX - left - xOffset;
		const my = clientY - top - yOffset;
		const vwidth = this.width * this.zoom;
		const vheight = this.height * this.zoom;

		const row = this.clamp(
			((mx / vwidth) * this.rows) >> 0,
			0,
			this.rows - 1
		);
		const col = this.clamp(
			((my / vheight) * this.columns) >> 0,
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
		const cellsize = this.getCellSize();
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.columns; col++) {
				const color = this.grid[row][col].color;
				if (row === 0 && col === 0) {
					this.drawCell(row, col, cellsize, color);
				} else {
					this.drawCell(
						row * cellsize,
						col * cellsize,
						cellsize,
						color
					);
				}
			}
		}
	};

	private getScaledOffsets = () => {
		const xOffset = ((this.width - this.width * this.zoom) / 2) >> 0;
		const yOffset = ((this.height - this.height * this.zoom) / 2) >> 0;
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
		this.zoom = this.clamp(result, 0.3, 2);
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.drawGrid();
	};

	private clamp = (n: number, min: number, max: number) => {
		return Math.min(max, Math.max(n, min));
	};
}
