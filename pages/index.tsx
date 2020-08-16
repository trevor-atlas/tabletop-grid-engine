import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Engine } from '../src/Engine';

let engine;
export default function Home() {
	const [width, setWidth] = useState(20);
	const [height, setHeight] = useState(20);

	useEffect(() => {
		engine = new Engine(height, width);
	}, []);

	return (
		<div className="container">
			<Head>
				<title>Create Next App</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main>
				<button onClick={() => engine.genGrid(height, width)}>
					reset
				</button>
				<input
					type="range"
					min={0}
					max={100}
					step={1}
					value={width}
					onChange={({ target: { value } }) => setWidth(+value)}
				/>
				<input
					type="range"
					min={0}
					max={100}
					step={1}
					value={height}
					onChange={({ target: { value } }) => setHeight(+value)}
				/>
			</main>

			<div id="renderingContext"></div>

			<footer></footer>

			<style jsx>{`
				.container {
					min-height: 100vh;
					padding: 0 0.5rem;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
				}
				#renderingContext {
					width: 100vh;
					height: 100vh;
				}
			`}</style>

			<style jsx global>{`
				html,
				body {
					padding: 0;
					margin: 0;
					font-family: -apple-system, BlinkMacSystemFont, Segoe UI,
						Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans,
						Helvetica Neue, sans-serif;
				}

				* {
					box-sizing: border-box;
				}
			`}</style>
		</div>
	);
}
