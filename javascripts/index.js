
//█████████████████████████████████████████████████
//███▀▄▄▄░████▄░███████████▄░█████████████████▄░███
//██░██████████░████▀▄▄▄▄▀██░▀▄▄▄▀██▀▄▄▄▄▀█████░███
//██░███▄░▄████░████░████░██░████░██▀▄▄▄▄░█████░███
//███▄▀▀▀▄███▀▀░▀▀██▄▀▀▀▀▄█▀░▄▀▀▀▄██▄▀▀▀▄░▀██▀▀░▀▀█
//█████████████████████████████████████████████████

// constants
var MAX_BOUNCE = 7;


// global variables
var canvas = document.querySelector("svg");
var canvasWidth  = canvas.clientWidth;
var canvasHeight = canvas.clientHeight;
var floor = ~~(canvasHeight * 0.8);

var nbelem   = 1;
var nbplante = 0;
var nbSeed   = 1;
var maxSpeed = 0;

var animationArray = [];


//█████████████████████████████████████████
//████▄░████████████████▄░█████▄███████████
//████░█░███▄░██▄░██▀▄▄▄▀░███▄▄░████▀▄▄▄▄▀█
//████░▀░████░███░██░████░█████░████░████░█
//██▀░▀█▀░▀██▄▀▀▄░▀█▄▀▀▀▄░▀██▀▀░▀▀██▄▀▀▀▀▄█
//█████████████████████████████████████████

var audioCtx = new webkitAudioContext();

/**▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
 * @function module:loading.loadSound
 * @desc  load an image file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadSound(path, cb) {
	var snd = new Audio();
	snd.preload = true;
	snd.loop = false;
	
	function onSoundLoad() {
		cb(null, snd);
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	function onSoundError() {
		cb('snd:load');
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	snd.addEventListener('canplaythrough', onSoundLoad);
	snd.addEventListener('error', onSoundError);
	snd.src = path;
	snd.load();
}

function playSoundWebkit(sound, vol, pan) { 
	if (!sound) return;

	var source = audioCtx.createBufferSource();
	var volume = audioCtx.createGainNode();
	var panner = audioCtx.createPanner();

	source.connect(panner);
	panner.connect(volume);
	volume.connect(audioCtx.destination);

	panner.coneOuterGain  = 0.5;
	panner.coneOuterAngle = 180;
	panner.coneInnerAngle = 0;

	panner.setPosition(pan, 0, -0.5);
	volume.gain.value = vol;
	source.buffer = sound;
	
	source.noteOn(0);
}

function playSoundAudio(sound, vol) {
	if (!sound) return;
	sound.volume = vol;
	sound.play();
}

var playSound = playSoundAudio;

var soundDrop;

loadSound('tic.wav', function (error, sound) {
	if (error) return console.error(error);
	soundDrop = sound;
});


//█████████████████████████████████████████████████
//██▀▄▄▄▀░█████████████████████▄█████▀█████████████
//██▄▀▀▀▀███▄░▀▄▄▀██▄░▀▄▄▄███▄▄░████▄░▄▄▄███▀▄▄▄▄▀█
//███████░███░███░███░█████████░█████░██████░▄▄▄▄▄█
//██░▄▀▀▀▄███░▀▀▀▄██▀░▀▀▀████▀▀░▀▀███▄▀▀▀▄██▄▀▀▀▀▀█
//██████████▀░▀████████████████████████████████████

var SVG = "http://www.w3.org/2000/svg";

STATES = {
	INIT:    0,
	MOVE:    1,
	DUPL:    2,
	SEED:    3,
	BOUNCE:  4,
	DEATH:   5,
	EXTINCT: 6,
	END:     7,
	FINISH:  8
};

function Sprite(x, y) {
	this.x = this.homeX = x || 0;
	this.y = this.homeY = y || 0;
	this.speedX = 10 * (Math.random() - 0.5);
	this.speedY = 10 * (Math.random() - 0.5);
	//----------------------
	this.red   = 127;
	this.green = 127;
	this.blue  = 127;
	this.alpha = 1;
	//----------------------
	this.state    = STATES.INIT;
	this.parent   = null;
	this.children = [null, null, null];
	this.childCount = 0; // TODO: don't need this if children is an empty array
	this.me       = 0;
	this.bounce   = 0;
	//----------------------
	this.leaf   = document.createElementNS(SVG, "rect");
	this.branch = document.createElementNS(SVG, "path");
	this.branch.setAttribute("stroke", "black");
	this.branch.setAttribute("fill", "none");
	canvas.appendChild(this.leaf);
	canvas.appendChild(this.branch);
}

Sprite.prototype.drawBranch = function(){
	this.branch.setAttribute("d", 
		"M " + this.x + "," + this.y + " " +
		"Q " + this.x + "," + this.parent.y + " " + this.parent.x + "," + this.parent.y
	);
};


Sprite.prototype.init = function(){
	this.red   = Math.max(0, Math.min(this.red,   255));
	this.green = Math.max(0, Math.min(this.green, 255));
	this.blue  = Math.max(0, Math.min(this.blue,  255));
	this.state = STATES.MOVE;

	this.leaf.setAttribute("x", -5);
	this.leaf.setAttribute("y", -5);
	this.leaf.setAttribute("width",  10);
	this.leaf.setAttribute("height", 10);
	this.leaf.setAttribute("stroke", "black");
	this.leaf.setAttribute("fill", "rgb(" + this.red + "," + this.green + "," + this.blue + ")");
	this.leaf.setAttribute("transform", "translate(" + this.x + "," + this.y + ") ");
};

Sprite.prototype.inertia = function () {
	var accelX = this.homeX - this.x;
	var accelY = this.homeY - this.y;
	this.speedX = this.speedX * 0.9 + accelX * 0.1;
	this.speedY = this.speedY * 0.9 + accelY * 0.1;
	this.x = this.x + this.speedX;
	this.y = this.y + this.speedY;
	this.leaf.setAttribute("transform", "translate(" + this.x + "," + this.y + ") ");
	return Math.abs(accelX) + Math.abs(accelY);;
};

Sprite.prototype.gravity = function () {
	this.speedX = this.speedX * 0.9;
	this.speedY = this.speedY + 0.9;
	this.x = this.x + this.speedX;
	this.y = this.y + this.speedY;
	this.leaf.setAttribute("transform", "translate(" + this.x + "," + this.y + ") ");
};

Sprite.prototype.move = function () {
	var absAccel = this.inertia();

	// connection avec le parent (affichage de la branch)
	if (this.parent != null) {this.drawBranch();}

	var absSpeed = Math.abs(this.speedX) + Math.abs(this.speedY);

	if ((absSpeed <= 0.05) && (absAccel <= 5)){
		this.state = STATES.DUPL;
	} 
};


Sprite.prototype.duplicate = function(){
	// si l'element est trop loin (sort de l'ecran), on le tue
	if ((this.x < -100) || (this.x > canvasWidth + 100)){
		if (this.parent === null){
			if (this.childCount === 0) nbSeed--;
			else nbplante--;
		}
		this.state = STATES.DEATH;
	}
	
	
	//============detection de la death d'une racine=====
	// si toute les branchs d'une racines sont deathes
	// ou sont devenue des seeds, on tue la racine:
	if ((this.parent === null) && (this.childCount === 3)){
		if ((this.children[0] === null) && (this.children[1] === null) && (this.children[3] === null)) {
			nbplante--
			this.state = STATES.DEATH;
		}
	}
	
	//on tire un nombre aleatoire pour choisir
	//l'evenement a effectuer:
	var rand = (80 + nbelem * 6) * Math.random();
	
	//================duplicate:====================
	// (creation d'une branch)
	// si rand est compris entre 0 et 5
	if ((this.childCount < 3) && (rand >= 0) && (rand <= 5)){
		var child = new Sprite(this.x, this.y);
		animationArray.push(child);
		this.children[this.childCount] = child;
		child.parent = this;
		nbelem++;
	
		//calcul de la direction de l'element:
		var posx = this.x + 80 * Math.random() - 40 + 40 * (this.childCount - 1);
		var posy = this.y + 60 * Math.random() - (Math.random() < 0.2 ? 10 : 80);
	
		//init des variables du nouvel element:
		child.homeX = posx;
		child.homeY = posy;
		child.me    = this.childCount;
		child.red   = this.red   + (Math.round(40 * Math.random()) - 20);
		child.green = this.green + (Math.round(40 * Math.random()) - 20);
		child.blue  = this.blue  + (Math.round(40 * Math.random()) - 20);
		//on regarde si une nouvelle plante est cree:
		if ((this.parent === null) && (this.childCount === 0)){
			nbSeed--;
			nbplante++;
		}
		this.childCount++;
	}
	
	//=======================mouvement:=================
	// on fait bouger la branch
	// si rand est compris entre 6 et 10
	if ((this.childCount === 0) && (this.parent !== null) && (rand >= 6) && (rand <= 10)){
		this.speedX = 20 * (Math.random() - 0.5);
		this.speedY = 20 * (Math.random() - 0.5);
		this.state = STATES.MOVE;
	}
	
	//================creation d'une seed:============
	// si rand est compris entre 11 et 14
	if ((this.childCount === 0) && (this.parent !== null) && (rand >= 11) && (rand <= 14)){
		this.state = STATES.SEED;
	}
	
	
	//==================death de la branch:=============
	//cas d'une simple branch:
	if ((this.parent !== null) && ((20000 * Math.random()) < nbelem)){
		this.state = STATES.DEATH;
	}
	//cas d'une racine:
	if ((this.parent === null) && (this.childCount > 0) && ((80000 * Math.random()) < nbelem)){
		if (this.childCount === 0){
			nbSeed--;
		}
		else{
			nbplante--;
		}
		this.state = STATES.DEATH;
	}
};
	
//█████████████████████████████████████████
//██▀▄▄▄▀░██████████████████████▄░█████████
//██▄▀▀▀▀███▀▄▄▄▄▀██▀▄▄▄▄▀██▀▄▄▄▀░█████████
//███████░██░▄▄▄▄▄██░▄▄▄▄▄██░████░█████████
//██░▄▀▀▀▄██▄▀▀▀▀▀██▄▀▀▀▀▀██▄▀▀▀▄░▀████████
//█████████████████████████████████████████
Sprite.prototype.seed = function(){
	//creation d'une seed
	this.parent.children[this.me] = null;
	this.parent = null;
	canvas.removeChild(this.branch);
	this.state = STATES.BOUNCE;
	
	//init des variables:
	this.speedX = 20 * (Math.random() - 0.5);;
	this.speedY = -10; //on donne une legere pousse vers le haut

	nbSeed++
};




//█████████████████████████████████████████████████
//██▄░▄▄▄▀█████████████████████████████████████████
//███░▀▀▀▄██▀▄▄▄▄▀██▄░██▄░██▄░▀▄▄▀██▀▄▄▄▀░██▀▄▄▄▄▀█
//███░███░██░████░███░███░███░███░██░███████░▄▄▄▄▄█
//██▀░▀▀▀▄██▄▀▀▀▀▄███▄▀▀▄░▀█▀░▀█▀░▀█▄▀▀▀▀▄██▄▀▀▀▀▀█
//█████████████████████████████████████████████████
Sprite.prototype.bounceSeed = function(){
	this.gravity();
	
	//collision (rebond sur le sol):
	if (this.y > floor){
		this.y = floor;
		this.speedY = -0.7 * Math.abs(this.speedY);
		this.bounce++
		//faire un son:
		var vol = Math.abs(this.speedY);
		var pan = (this.x - 350) / 4;
		pan = 0.01 * Math.max(-100, Math.min(pan, 100));
		vol = 0.1 * Math.max(0, Math.min(vol, 10));

		playSound(soundDrop, vol, pan);
		maxSpeed = Math.max(maxSpeed, Math.abs(this.speedY));
	}
	
	//si plus de 7 rebond : la seed est plantee
	if (this.bounce > MAX_BOUNCE){
		this.homeX  = this.x;
		this.homeY  = floor;
		this.speedY = 0;
		this.state  = STATES.DUPL;
		// probabilite que la seed soit sterile:
		if (200 * Math.random() < (nbSeed + nbplante)){
			this.state = STATES.DEATH;
			nbSeed--
		}
	}
};

//█████████████████████████████████████████████████
//██▄░▄▄▀████████████████████▀██████▄░█████████████
//███░███░██▀▄▄▄▄▀██▀▄▄▄▄▀██▄░▄▄▄████░▀▄▄▀█████████
//███░███░██░▄▄▄▄▄██▀▄▄▄▄░███░███████░███░█████████
//██▀░▀▀▄███▄▀▀▀▀▀██▄▀▀▀▄░▀██▄▀▀▀▄██▀░▀█▀░▀████████
//█████████████████████████████████████████████████
/** kill self and all children */
Sprite.prototype.death = function(){
	for (var i = 0, len = this.children.length; i < len; i++) {
		if (this.children[i] !== null) this.children[i].state = STATES.DEATH;
	}
	this.state = STATES.EXTINCT;
};

//█████████████████████████████████████████████████████████
//██▄░▄▄▄░███████████▀█████████▄█████████████████████▀█████
//███░▀░████▄░██░▄██▄░▄▄▄████▄▄░████▄░▀▄▄▀██▀▄▄▄▀░██▄░▄▄▄██
//███░█▄██████░░█████░█████████░█████░███░██░████████░█████
//██▀░▀▀▀░██▀░██░▀███▄▀▀▀▄███▀▀░▀▀██▀░▀█▀░▀█▄▀▀▀▀▄███▄▀▀▀▄█
//█████████████████████████████████████████████████████████
Sprite.prototype.extinct = function(){
	this.alpha  = this.alpha * 0.95;
	var color = "rgba(0,0,0," + this.alpha + ")";
	this.leaf.setAttribute("stroke", color);
	this.leaf.setAttribute("fill", "none");
	this.branch.setAttribute("stroke", color);

	this.inertia();

	if (this.parent !== null) this.drawBranch();
	if (this.alpha <= 0.01){
		nbelem--;
		if (this.parent !== null){
			this.parent.children[this.me] = null;
		}
		this.state = STATES.END;
	}
};

//█████████████████████████████████
//██▄░▄▄▄░██████████████▄░█████████
//███░▀░████▄░▀▄▄▀██▀▄▄▄▀░█████████
//███░█▄█████░███░██░████░█████████
//██▀░▀▀▀░██▀░▀█▀░▀█▄▀▀▀▄░▀████████
//█████████████████████████████████
Sprite.prototype.end = function(){
	canvas.removeChild(this.leaf);
	if (this.parent !== null) canvas.removeChild(this.branch);
	this.state = STATES.FINISH;
	var index = animationArray.indexOf(this);
	if (index !== -1) animationArray.splice(index, 1);
};

//█████████████████████████████████████████████████████████
//████▄░███████████████▄█████████████████████▀█████████████
//████░█░███▄░▀▄▄▀███▄▄░███▄░▀▄▀▀▄▀█▀▄▄▄▄▀██▄░▄▄▄███▀▄▄▄▄▀█
//████░▀░████░███░█████░████░██░██░█▀▄▄▄▄░███░██████░▄▄▄▄▄█
//██▀░▀█▀░▀█▀░▀█▀░▀██▀▀░▀▀█▀░▀█░▀█░█▄▀▀▀▄░▀██▄▀▀▀▄██▄▀▀▀▀▀█
//█████████████████████████████████████████████████████████
Sprite.prototype.animate = function(){
	switch(this.state){
		case STATES.INIT    : this.init(); break;
		case STATES.MOVE    : this.move(); break;
		case STATES.DUPL    : this.duplicate(); break;
		case STATES.SEED    : this.seed(); break;
		case STATES.BOUNCE  : this.bounceSeed(); break;
		case STATES.DEATH   : this.death(); break;
		case STATES.EXTINCT : this.extinct(); break;
		case STATES.END     : this.end(); break;
		case STATES.FINISH  : break;
	}
};

//█████████████████████████████████████████
//██▀▄▄▄▀░█████████████████████████████████
//██▄▀▀▀▀███▀▄▄▄▀░██▀▄▄▄▄▀██▄░▀▄▄▀██▀▄▄▄▄▀█
//███████░██░███████░▄▄▄▄▄███░███░██░▄▄▄▄▄█
//██░▄▀▀▀▄██▄▀▀▀▀▄██▄▀▀▀▀▀██▀░▀█▀░▀█▄▀▀▀▀▀█
//█████████████████████████████████████████
animationArray[0] = new Sprite(canvasWidth / 2, floor);
animationArray[0].red   = 230 + ~~(30 * Math.random());
animationArray[0].green = 200 + ~~(30 * Math.random());
animationArray[0].blue  = 130 + ~~(30 * Math.random());



//█████████████████████████████████████████████████████████████████████████
//████▄░███████████████▄████████████████████▄░▄████████████████████████████
//████░█░███▄░▀▄▄▀███▄▄░███▄░▀▄▀▀▄▀██████████░██████▀▄▄▄▄▀██▀▄▄▄▄▀██▄░▀▄▄▀█
//████░▀░████░███░█████░████░██░██░██████████░███▀██░████░██░████░███░███░█
//██▀░▀█▀░▀█▀░▀█▀░▀██▀▀░▀▀█▀░▀█░▀█░███░░████▀░▀▀▀░██▄▀▀▀▀▄██▄▀▀▀▀▄███░▀▀▀▄█
//██████████████████████████████████████████████████████████████████▀░▀████
window.requestAnimFrame = (function () {
	return  window.requestAnimationFrame
		||	window.webkitRequestAnimationFrame
		||	window.mozRequestAnimationFrame
		||	window.oRequestAnimationFrame
		||	window.msRequestAnimationFrame
		||	function (callback) {
				window.setTimeout(callback, 1000 / 24);
			};
})();

function drawFrame() {
	for (var i in animationArray) animationArray[i].animate();
	document.getElementById("caption-seeds").textContent = "seeds:" + nbSeed;
	document.getElementById("caption-plant").textContent = "plant:" + nbplante;
	document.getElementById("caption-array").textContent = "animation-array size:" + animationArray.length;
	document.getElementById("caption-elemt").textContent = "graphic elements:" + nbelem;
	document.getElementById("caption-speed").textContent = "max speed:" + maxSpeed.toFixed(2);
}

function loopAnimation(currentTime) {
	drawFrame();
	window.requestAnimFrame(loopAnimation);
}

window.requestAnimFrame(loopAnimation);
