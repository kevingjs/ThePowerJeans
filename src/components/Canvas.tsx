import { useRef, useEffect, useState } from 'react';

type NewAsset = {
	(src: string, type: 'img'): Promise<HTMLImageElement>;
	(src: string, type: 'audio'): Promise<HTMLAudioElement>;
};

const newAsset: NewAsset = async (src: any, type: any) => {
	const fileConstructors = {
		img: (src: string, resolve: (value: any) => void) => {
			const file = new Image();
			file.src = src;
			file.onload = () => resolve(file);
		},
		audio: (src: string, resolve: (value: any) => void) => {
			const file = new Audio(src);
			file.volume = 0.01;
			file.oncanplaythrough = () => resolve(file);
		}
	};

	return new Promise<any>(resolve => fileConstructors[type](src, resolve));
};

interface Handlers {
	click: () => void,
	key: (e: KeyboardEvent) => void
};

export const Canvas = () => {
	const [ { click: onClick, key: onKeyDown }, setHandlers ] = useState<Handlers>({
		click: null,
		key: null
	});
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const init = async () => {
		const audio = await newAsset('/in-game-assets/pj.mp3', 'audio');
		const tpjSet = await newAsset('/in-game-assets/sprite_sheet.png', 'img');

		const ctx = canvasRef.current.getContext('2d');

		ctx.imageSmoothingEnabled = false;
	
		// CONSTANTS
	
		const BGSPEED = -1,
		EASY = {
			randomnessLimiter: .6,
			speed: -4,
			sortInterval: 1200, 
			gap: 3
		},
		MEDIUM = {
			randomnessLimiter: .3,
			speed: -5,
			sortInterval: 1100, 
			gap: 3.25
		},
		HARD = {
			randomnessLimiter: 0,
			speed: -6,
			sortInterval: 1000, 
			gap: 3.5
		};
			
		// VARIABLES
			
		let
		playing = false,
		gameover = false,
		difficult = HARD,
		score = '0',
		best = '0';

		const gameoverRect = {
			img: tpjSet,
			sx: 0,
			sy: 0,
			sw: canvasRef.current.width,
			sh: canvasRef.current.height,
			dx: 0,
			dy: 0,
			dw: canvasRef.current.width,
			dh: canvasRef.current.height
		};

		const backgroundSize = { w: 744, h: canvasRef.current.height };
		const backgroundRect = {
			img: tpjSet,
			sx: gameoverRect.sw,
			sy: 0,
			sw: backgroundSize.w,
			sh: backgroundSize.h,
			dx: 0,
			dy: 0,
			dw: backgroundSize.w,
			dh: backgroundSize.h
		};
		
		const pipes = [];
		const pipeSize = { width: 64, height: 512 };
		const pipeRect = {
			img: tpjSet,
			sx: {
				top: backgroundRect.sx + backgroundRect.sw + pipeSize.width,
				bottom: backgroundRect.sx + backgroundRect.sw,
			},
			sy: 0,
			sw: pipeSize.width,
			sh: pipeSize.height,
			dx: canvasRef.current.width,
			dw: pipeSize.width,
			dh: pipeSize.height
		};
		
		const minjiSize = { width: 50, height: 53 };
		const minjiRect = {
			img: tpjSet,
			sx: pipeRect.sx.top + pipeRect.sw,
			sy: {
				base: 0,
				move: minjiSize.height
			},
			sw: minjiSize.width,
			sh: minjiSize.height,
			dx: canvasRef.current.width / 5 - minjiSize.width / 2,
			dy: canvasRef.current.height / 2 - minjiSize.height / 2,
			dw: minjiSize.width,
			dh: minjiSize.height,
			gravity: .6,
			flight: .5
		};

		const reset = () => {
			gameover = true;
			audio.load();
			playing = false;
			score = '0';
			pipes.length = 0;
			minjiRect.dy = canvasRef.current.height / 2 - minjiRect.dh / 2;
			minjiRect.flight = 1;
			setTimeout(() => {
				gameover = false;
			}, 5000);
		};
		
		const drawGameOver = () => {
			if (!gameover) return;
			const { img, sx, sy, sw, sh, dx, dy, dw, dh } = gameoverRect;
			ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
		};

		const drawBackground = () => {
			const { img, sx, sy, sw, sh, dx, dy, dw, dh } = backgroundRect;

			ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
			ctx.drawImage(img, sx, sy, sw, sh, dx + dw, dy, dw, dh);
		};
		
		const drawMinji = () => {
			const { img, sx, sy: { move, base }, sw, sh, dx, dy, dw, dh } = minjiRect;
			ctx.drawImage(img, sx, playing ? move : base, sw, sh, dx, dy, dw, dh);
		};
		
		const drawObstacles = () => {
			for (let i = 0; i < pipes.length; i++) {
				const pipe = pipes[i];
		
				pipe.dx += difficult.speed;

				ctx.drawImage(pipe.img, pipe.sx, pipe.sy, pipe.sw, pipe.sh, pipe.dx, pipe.dy, pipe.dw, pipe.dh);
		
				if (!pipe.passed && minjiRect.dx > pipe.dx + pipe.dw) {
					score = (Number(score) + 0.5).toString();
					best = Math.max(Number(best), Number(score)).toString();
					pipe.passed = true;
				};
			};

			while (pipes.length && pipes[0].dx < -pipeRect.dw) pipes.shift();
		};
		
		const drawUI = () => {
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 1;
			ctx.fillStyle = "white";
			ctx.font = "900 36px Upheaval";
			ctx.fillText('SCORE', 20, 50);
			ctx.strokeText('SCORE', 20, 50);
			ctx.fillText(score, 20, 90);
			ctx.strokeText(score, 20, 90);
		
			ctx.fillText('BEST', canvasRef.current.width / 1.15 - 20, 50);
			ctx.strokeText('BEST', canvasRef.current.width / 1.15 - 20, 50);
			ctx.fillText(best, canvasRef.current.width / 1.15 - 20, 90);
			ctx.strokeText(best, canvasRef.current.width / 1.15 - 20, 90);
		
			if (!playing) {
				ctx.font = "900 50px Upheaval";
				ctx.fillText('Click to play', canvasRef.current.width / 4.5, canvasRef.current.height / 1.1);
				ctx.strokeText('Click to play', canvasRef.current.width / 4.5, canvasRef.current.height / 1.1);
			};
		};
		
		const checkCollision = () => {
			if (minjiRect.dy > canvasRef.current.height) return reset();
		
			for (let i = 0; i < pipes.length; i++) {
				const pipe = pipes[i];
		
				if (
					minjiRect.dx < pipe.dx + pipe.dw &&
					minjiRect.dx + minjiRect.dw > pipe.dx &&
					minjiRect.dy < pipe.dy + pipe.dh &&
					minjiRect.dy + minjiRect.dh > pipe.dy
				) return reset();
			};
		};
		
		const minjiMovement = () => {
			if (playing) {
				minjiRect.flight += minjiRect.gravity;
				minjiRect.dy = Math.max(minjiRect.dy + minjiRect.flight, 0);
				return;
			};
		
			if (minjiRect.dy <= canvasRef.current.height / 2.6) minjiRect.flight = -minjiRect.flight;
			if (minjiRect.dy >= canvasRef.current.height / 1.8) minjiRect.flight = -minjiRect.flight;
		
			minjiRect.dy += minjiRect.flight;
		};
		
		const bgMovement = () => {
			if (backgroundRect.dx === -backgroundRect.dw) backgroundRect.dx = 0;
			backgroundRect.dx += BGSPEED;
		};

		const jump = () => {
			minjiRect.flight = -9;
		};
		
		const cleanCanvas = () => {
			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
		};
		
		const sortPipes = () => {
			if (!playing) return;
			const { randomnessLimiter, gap } = difficult;
			const min = 3.5 - randomnessLimiter;
			const max = 1.4 + randomnessLimiter;
			const randomPipeY = (canvasRef.current.height / ((Math.random() * (max - min) + min))) - pipeRect.dh;
			const openingSpace = (canvasRef.current.height / gap) / 2;

			const topPipe = {
				...pipeRect,
				sx: pipeRect.sx.top,
				dy: randomPipeY - openingSpace,
				passed: false
			};
		
			pipes.push(topPipe);
		
			const bottomPipe = {
				...pipeRect,
				sx: pipeRect.sx.bottom,
				dy: randomPipeY + pipeRect.dh + openingSpace,
				passed: false
			};
		
			pipes.push(bottomPipe);
		};
		
		setInterval(sortPipes, difficult.sortInterval);
		
		const draw = () => {
			cleanCanvas();
		
			// drawing
			drawBackground();
			drawMinji();
			drawObstacles();
			drawUI();
			drawGameOver();

			// check collisions and movements
			bgMovement();
			minjiMovement();
			checkCollision();
		
			window.requestAnimationFrame(draw);
		};
		
		draw();

		const handleClick = () => {
			if (gameover) return;
			if (!playing) {
				playing = true;
				audio.play();
			};
			jump();
		};

		const handleKey = (e: KeyboardEvent) => {
			if (gameover) return;
			const { code } = e;
			if (code === "Space" || code === "ArrowUp" || code === 'KeyW') {
				if (!playing && !gameover) {
					playing = true;
					audio.play();
				};
				jump();
			};
		};

		setHandlers({
			click: handleClick,
			key: handleKey
		});

		document.querySelector('.splashscreen').remove();
	};

	useEffect(() => {
		if (canvasRef.current && !onKeyDown) init();

		if (onKeyDown) {
			window.addEventListener('keydown', onKeyDown);

			return () => window.removeEventListener('keydown', onKeyDown);
		};
	}, [ onKeyDown ]);

	return (
		<canvas
			width = { 650 }
			height = { 550 }
			onClick = { onClick }
			ref = { canvasRef }
		></canvas>
	);
};