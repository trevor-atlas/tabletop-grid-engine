import Head from 'next/head';
import { useEffect } from 'react';
import { Engine } from '../src/Engine';

export default function Home() {
	let engine;
	useEffect(() => {
		const canvas = document.querySelector('#main');
		engine = new Engine(canvas as HTMLCanvasElement, 20, 20);
	});
	return (
		<div className="container">
			<Head>
				<title>Create Next App</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main>
				<button onClick={() => engine.genGrid(20, 20)}>reset</button>
				<canvas id="main"></canvas>
			</main>

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
